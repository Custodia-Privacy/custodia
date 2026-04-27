import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure, adminProcedure } from "../trpc";
import { enqueueDataScan, enqueueDeletion } from "@/lib/queue";

export const inventoryRouter = createRouter({
  listAssets: orgProcedure
    .input(z.object({ integrationId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.dataAsset.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.integrationId ? { integrationId: input.integrationId } : {}),
          parentId: null,
        },
        include: {
          children: { take: 50, orderBy: { name: "asc" } },
        },
        orderBy: { name: "asc" },
      });
    }),

  listScanRuns: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.inventoryScanRun.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 20,
      });
    }),

  listFindings: orgProcedure
    .input(z.object({ scanRunId: z.string().uuid().optional(), limit: z.number().min(1).max(200).default(100) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.piiFinding.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.scanRunId ? { scanRunId: input.scanRunId } : {}),
        },
        orderBy: { avgScore: "desc" },
        take: input?.limit ?? 100,
        include: { asset: { select: { id: true, name: true, kind: true } } },
      });
    }),

  triggerScan: orgProcedure
    .input(z.object({ integrationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const integ = await ctx.db.integration.findFirst({
        where: { id: input.integrationId, orgId: ctx.orgId },
      });
      if (!integ?.nangoConnectionId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect the integration before scanning." });
      }

      const run = await ctx.db.inventoryScanRun.create({
        data: {
          orgId: ctx.orgId,
          status: "queued",
          trigger: "manual",
        },
      });

      await enqueueDataScan({
        scanRunId: run.id,
        orgId: ctx.orgId,
        integrationId: integ.id,
        provider: integ.provider,
      });

      return { scanRunId: run.id };
    }),

  listRetentionPolicies: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.retentionPolicy.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      include: { targets: { include: { asset: { select: { id: true, name: true } } } } },
    });
  }),

  createRetentionPolicy: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        ruleDays: z.number().int().positive().max(36500).optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.retentionPolicy.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          description: input.description ?? null,
          ruleDays: input.ruleDays ?? null,
          enabled: input.enabled ?? true,
        },
      });
    }),

  attachRetentionTarget: adminProcedure
    .input(
      z.object({
        policyId: z.string().uuid(),
        dataAssetId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const policy = await ctx.db.retentionPolicy.findFirst({
        where: { id: input.policyId, orgId: ctx.orgId },
      });
      if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });
      const asset = await ctx.db.dataAsset.findFirst({
        where: { id: input.dataAssetId, orgId: ctx.orgId },
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const existing = await ctx.db.retentionPolicyTarget.findFirst({
        where: { retentionPolicyId: input.policyId, dataAssetId: input.dataAssetId },
      });
      if (existing) return existing;
      return ctx.db.retentionPolicyTarget.create({
        data: {
          retentionPolicyId: input.policyId,
          dataAssetId: input.dataAssetId,
        },
      });
    }),

  startRetentionDeletion: adminProcedure
    .input(
      z.object({
        policyId: z.string().uuid(),
        dryRun: z.boolean().default(true),
        approved: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.dryRun && !input.approved) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Live retention deletion requires approved: true (after dry-run review).",
        });
      }

      const policy = await ctx.db.retentionPolicy.findFirst({
        where: { id: input.policyId, orgId: ctx.orgId, enabled: true },
        include: { targets: true },
      });
      if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });

      const run = await ctx.db.deletionExecutionRun.create({
        data: {
          orgId: ctx.orgId,
          retentionPolicyId: policy.id,
          dryRun: input.dryRun,
          approved: input.approved && !input.dryRun,
          status: "pending",
          createdByUserId: ctx.userId,
          summary: {
            note: "Retention record-level deletes require subject keys (e.g. email) — use DSAR deletion or extend policy DSL in a follow-up.",
            targets: policy.targets.length,
          } as object,
        },
      });

      // v1: enqueue run for audit/receipt trail; per-asset SQL/SaaS row deletes ship in v2.
      await enqueueDeletion({ runId: run.id, orgId: ctx.orgId });
      return { runId: run.id };
    }),

  listDeletionRuns: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.deletionExecutionRun.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 20,
        include: { tasks: true },
      });
    }),

  approveDeletionRun: adminProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.deletionExecutionRun.findFirst({
        where: { id: input.runId, orgId: ctx.orgId },
      });
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      return ctx.db.deletionExecutionRun.update({
        where: { id: input.runId },
        data: { approved: true },
      });
    }),

  listReceipts: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.deletionReceipt.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
      });
    }),

  listIntegrationsForScan: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.integration.findMany({
      where: { orgId: ctx.orgId },
      select: {
        id: true,
        provider: true,
        status: true,
        nangoConnectionId: true,
        lastSyncAt: true,
      },
    });
  }),

  /** SaaS providers with v1 inventory connectors (matches Prisma IntegrationProvider). */
  connectorProviderLabel: orgProcedure.query(() => {
    return ["salesforce", "hubspot", "shopify"] as const;
  }),
});
