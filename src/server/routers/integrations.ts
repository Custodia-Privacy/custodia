/**
 * tRPC router for managing third-party integrations (Nango-backed).
 *
 * Handles: listing integrations, initiating OAuth, disconnecting,
 * triggering syncs, and viewing sync history.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createRouter, orgProcedure, adminProcedure } from "../trpc";
import { getNango, NANGO_INTEGRATIONS, nangoConnectionId } from "@/lib/nango";
import type { NangoProvider } from "@/lib/nango";
import { getConnector } from "@/lib/connectors";
import { createLogger } from "@/lib/logger";

const log = createLogger("integrations");

const providerEnum = z.enum(["salesforce", "hubspot", "shopify"]);

export const integrationsRouter = createRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    const integrations = await ctx.db.integration.findMany({
      where: { orgId: ctx.orgId },
      select: {
        id: true,
        provider: true,
        status: true,
        config: true,
        lastSyncAt: true,
        lastSyncError: true,
        syncedRecords: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return integrations;
  }),

  getConnectUrl: adminProcedure
    .input(
      z.object({
        provider: providerEnum,
        config: z.record(z.union([z.string().max(1024), z.boolean(), z.number()])).refine(
          (obj) => !("__proto__" in obj) && !("constructor" in obj) && Object.keys(obj).length <= 20,
          { message: "Invalid config" },
        ).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const nango = getNango();
      const connId = nangoConnectionId(ctx.orgId, input.provider);
      const integrationId = NANGO_INTEGRATIONS[input.provider];

      await ctx.db.integration.upsert({
        where: {
          orgId_provider: { orgId: ctx.orgId, provider: input.provider },
        },
        create: {
          orgId: ctx.orgId,
          provider: input.provider,
          status: "disconnected",
          nangoConnectionId: connId,
          config: input.config
            ? (input.config as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        update: {
          nangoConnectionId: connId,
          config: input.config ? (input.config as Prisma.InputJsonValue) : undefined,
        },
      });

      const { signCallbackState } = await import("@/app/api/integrations/callback/route");
      const state = signCallbackState(ctx.orgId, input.provider);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const callbackUrl = `${appUrl}/api/integrations/callback?state=${encodeURIComponent(state)}`;

      return {
        connectUrl: `${process.env.NANGO_HOST ?? "http://localhost:3003"}/oauth/connect/${integrationId}?connection_id=${encodeURIComponent(connId)}&callback_url=${encodeURIComponent(callbackUrl)}`,
      };
    }),

  disconnect: adminProcedure
    .input(z.object({ provider: providerEnum }))
    .mutation(async ({ ctx, input }) => {
      const integration = await ctx.db.integration.findUnique({
        where: {
          orgId_provider: { orgId: ctx.orgId, provider: input.provider },
        },
      });

      if (!integration) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }

      if (integration.nangoConnectionId) {
        try {
          const nango = getNango();
          await nango.deleteConnection(
            NANGO_INTEGRATIONS[input.provider],
            integration.nangoConnectionId,
          );
        } catch (e) {
          log.warn("Failed to delete Nango connection", e);
        }
      }

      await ctx.db.integration.update({
        where: { id: integration.id },
        data: {
          status: "disconnected",
          nangoConnectionId: null,
        },
      });

      return { ok: true };
    }),

  triggerSync: adminProcedure
    .input(z.object({ provider: providerEnum }))
    .mutation(async ({ ctx, input }) => {
      const integration = await ctx.db.integration.findUnique({
        where: {
          orgId_provider: { orgId: ctx.orgId, provider: input.provider },
        },
      });

      if (!integration?.nangoConnectionId || integration.status === "disconnected") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Integration is not connected",
        });
      }

      await ctx.db.integration.update({
        where: { id: integration.id },
        data: { status: "syncing" },
      });

      const startTime = Date.now();
      try {
        const connector = getConnector(input.provider);
        const contacts = await connector.fetchContacts(
          integration.nangoConnectionId,
          integration.lastSyncAt ?? undefined,
        );

        await ctx.db.integration.update({
          where: { id: integration.id },
          data: {
            status: "connected",
            lastSyncAt: new Date(),
            lastSyncError: null,
            syncedRecords: { increment: contacts.length },
          },
        });

        await ctx.db.syncLog.create({
          data: {
            integrationId: integration.id,
            action: "sync_contacts",
            recordsCount: contacts.length,
            durationMs: Date.now() - startTime,
            details: { since: integration.lastSyncAt?.toISOString() ?? null },
          },
        });

        return { synced: contacts.length };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Unknown sync error";
        await ctx.db.integration.update({
          where: { id: integration.id },
          data: { status: "error", lastSyncError: errMsg },
        });

        await ctx.db.syncLog.create({
          data: {
            integrationId: integration.id,
            action: "sync_contacts",
            recordsCount: 0,
            durationMs: Date.now() - startTime,
            error: errMsg,
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Sync failed: ${errMsg}`,
        });
      }
    }),

  syncLogs: orgProcedure
    .input(
      z.object({
        provider: providerEnum,
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integration = await ctx.db.integration.findUnique({
        where: {
          orgId_provider: { orgId: ctx.orgId, provider: input.provider },
        },
        select: { id: true },
      });

      if (!integration) return [];

      return ctx.db.syncLog.findMany({
        where: { integrationId: integration.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          action: true,
          recordsCount: true,
          durationMs: true,
          error: true,
          createdAt: true,
        },
      });
    }),

  /**
   * Search for a contact across all connected integrations.
   * Used during DSAR fulfillment to find where data lives.
   */
  searchContact: orgProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const integrations = await ctx.db.integration.findMany({
        where: {
          orgId: ctx.orgId,
          status: "connected",
          nangoConnectionId: { not: null },
        },
      });

      const results: { provider: string; contacts: unknown[] }[] = [];

      for (const integration of integrations) {
        try {
          const connector = getConnector(integration.provider);
          const contacts = await connector.searchByEmail(
            integration.nangoConnectionId!,
            input.email,
          );
          results.push({ provider: integration.provider, contacts });
        } catch (e) {
          log.warn(`Search failed for ${integration.provider}`, e);
          results.push({ provider: integration.provider, contacts: [] });
        }
      }

      return results;
    }),
});
