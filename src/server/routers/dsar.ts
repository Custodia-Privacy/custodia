import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createRouter, orgProcedure, publicProcedure } from "../trpc";
import Anthropic from "@anthropic-ai/sdk";
import { computeDsarDueDate } from "@/lib/dsar-deadlines";

function getAI() {
  return new Anthropic();
}

export const dsarRouter = createRouter({
  /** List all DSARs for the org, with optional status filter */
  list: orgProcedure
    .input(
      z.object({
        status: z
          .enum([
            "received",
            "identity_verified",
            "processing",
            "data_collected",
            "review",
            "fulfilled",
            "rejected",
            "appealed",
          ])
          .optional(),
      }).default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.dsarRequest.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input.status ? { status: input.status } : {}),
        },
        orderBy: { dueDate: "asc" },
        include: {
          _count: { select: { activities: true } },
        },
      });
    }),

  /** Get a single DSAR by ID with activity log */
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const dsar = await ctx.db.dsarRequest.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          activities: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!dsar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "DSAR request not found" });
      }

      return dsar;
    }),

  /** Create a new DSAR request with auto-calculated due date */
  create: orgProcedure
    .input(
      z.object({
        requestType: z.enum([
          "access",
          "deletion",
          "rectification",
          "portability",
          "opt_out",
          "restrict_processing",
        ]),
        jurisdiction: z.string().min(1).max(20),
        requesterName: z.string().min(1).max(255),
        requesterEmail: z.string().email(),
        requesterPhone: z.string().max(50).optional(),
        siteId: z.string().uuid().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.siteId) {
        const site = await ctx.db.site.findFirst({
          where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        });
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      const now = new Date();
      const dueDate = computeDsarDueDate(input.jurisdiction, now);

      const dsar = await ctx.db.$transaction(async (tx) => {
        const row = await tx.dsarRequest.create({
          data: {
            orgId: ctx.orgId,
            siteId: input.siteId ?? null,
            requestType: input.requestType,
            jurisdiction: input.jurisdiction,
            requesterName: input.requesterName,
            requesterEmail: input.requesterEmail,
            requesterPhone: input.requesterPhone ?? null,
            dueDate,
            notes: input.notes ?? null,
            receivedAt: now,
          },
        });
        await tx.dsarActivity.create({
          data: {
            requestId: row.id,
            action: "request_received",
            details: {
              requestType: input.requestType,
              jurisdiction: input.jurisdiction,
              dueDate: dueDate.toISOString(),
            },
            actor: ctx.userId,
          },
        });
        return tx.dsarRequest.findFirstOrThrow({
          where: { id: row.id },
          include: { activities: true },
        });
      });

      return dsar;
    }),

  /** Update the status of a DSAR and log the transition */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([
          "received",
          "identity_verified",
          "processing",
          "data_collected",
          "review",
          "fulfilled",
          "rejected",
          "appealed",
        ]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dsar = await ctx.db.dsarRequest.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!dsar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "DSAR request not found" });
      }

      const previousStatus = dsar.status;

      const updated = await ctx.db.dsarRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          notes: input.notes ?? dsar.notes,
          activities: {
            create: {
              action: "status_changed",
              details: {
                from: previousStatus,
                to: input.status,
                notes: input.notes ?? null,
              },
              actor: ctx.userId,
            },
          },
        },
        include: { activities: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      return updated;
    }),

  /** AI-process a DSAR: analyze the request, search data stores, generate summary */
  process: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const dsar = await ctx.db.dsarRequest.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!dsar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "DSAR request not found" });
      }

      const dataStores = await ctx.db.dataStore.findMany({
        where: { orgId: ctx.orgId, status: "active" },
        select: {
          id: true,
          name: true,
          type: true,
          provider: true,
          dataTypes: true,
          sensitivity: true,
          piiFields: true,
          description: true,
        },
      });

      await ctx.db.dsarRequest.update({
        where: { id: input.id },
        data: {
          status: "processing",
          activities: {
            create: {
              action: "ai_processing_started",
              details: { dataStoresScanned: dataStores.length },
              actor: "system:ai",
            },
          },
        },
      });

      const client = getAI();
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are a privacy compliance AI agent processing a Data Subject Access Request (DSAR).

REQUEST DETAILS:
- Type: ${dsar.requestType}
- Requester: ${dsar.requesterName} (${dsar.requesterEmail})
- Jurisdiction: ${dsar.jurisdiction}
- Due Date: ${dsar.dueDate.toISOString()}
- Notes: ${dsar.notes ?? "None"}

CONNECTED DATA STORES IN THIS ORGANIZATION:
${dataStores.map((ds) => `- ${ds.name} (${ds.type}, ${ds.provider ?? "self-hosted"}): sensitivity=${ds.sensitivity}, piiFields=${JSON.stringify(ds.piiFields)}, dataTypes=${JSON.stringify(ds.dataTypes)}`).join("\n") || "No data stores registered."}

TASK:
1. Identify which data stores likely contain personal data for this requester (search by email/name).
2. For each relevant data store, describe what personal data categories are likely stored.
3. Based on the request type (${dsar.requestType}), recommend specific actions per data store.
4. Flag any risks or compliance considerations for the ${dsar.jurisdiction} jurisdiction.
5. Provide a step-by-step fulfillment plan with timeline recommendations.

Respond in JSON format:
{
  "dataLocations": [{ "storeId": "...", "storeName": "...", "dataCategories": [...], "action": "...", "priority": "high|medium|low" }],
  "summary": "...",
  "risks": ["..."],
  "fulfillmentPlan": [{ "step": 1, "action": "...", "deadline": "..." }],
  "estimatedEffort": "..."
}`,
          },
        ],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      let parsed: { dataLocations?: unknown; summary?: string } = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { summary: responseText, dataLocations: [] };
      }

      const updated = await ctx.db.dsarRequest.update({
        where: { id: input.id },
        data: {
          status: "data_collected",
          aiSummary: typeof parsed.summary === "string" ? parsed.summary : responseText,
          dataLocations: parsed.dataLocations
            ? (parsed.dataLocations as Prisma.InputJsonValue)
            : Prisma.DbNull,
          activities: {
            create: {
              action: "ai_processing_completed",
              details: { dataStoresIdentified: Array.isArray(parsed.dataLocations) ? parsed.dataLocations.length : 0 },
              actor: "system:ai",
            },
          },
        },
      });

      return updated;
    }),

  /** Mark a DSAR as fulfilled */
  fulfill: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        responsePackage: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dsar = await ctx.db.dsarRequest.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!dsar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "DSAR request not found" });
      }

      return ctx.db.dsarRequest.update({
        where: { id: input.id },
        data: {
          status: "fulfilled",
          fulfilledAt: new Date(),
          responsePackage: input.responsePackage
            ? (input.responsePackage as Prisma.InputJsonValue)
            : Prisma.DbNull,
          activities: {
            create: {
              action: "request_fulfilled",
              details: { fulfilledAt: new Date().toISOString() },
              actor: ctx.userId,
            },
          },
        },
      });
    }),

  /** Reject a DSAR with reason */
  reject: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dsar = await ctx.db.dsarRequest.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!dsar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "DSAR request not found" });
      }

      return ctx.db.dsarRequest.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          rejectedReason: input.reason,
          activities: {
            create: {
              action: "request_rejected",
              details: { reason: input.reason },
              actor: ctx.userId,
            },
          },
        },
      });
    }),

  /** Aggregate stats: counts by status, overdue count, average fulfillment time */
  stats: orgProcedure.query(async ({ ctx }) => {
    const [all, fulfilled] = await Promise.all([
      ctx.db.dsarRequest.findMany({
        where: { orgId: ctx.orgId },
        select: { status: true, dueDate: true, receivedAt: true, fulfilledAt: true },
      }),
      ctx.db.dsarRequest.findMany({
        where: { orgId: ctx.orgId, status: "fulfilled", fulfilledAt: { not: null } },
        select: { receivedAt: true, fulfilledAt: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let overdueCount = 0;
    const now = new Date();

    for (const req of all) {
      byStatus[req.status] = (byStatus[req.status] ?? 0) + 1;
      const isOpen = !["fulfilled", "rejected"].includes(req.status);
      if (isOpen && req.dueDate < now) {
        overdueCount++;
      }
    }

    let avgFulfillmentMs = 0;
    if (fulfilled.length > 0) {
      const totalMs = fulfilled.reduce((sum, r) => {
        return sum + (r.fulfilledAt!.getTime() - r.receivedAt.getTime());
      }, 0);
      avgFulfillmentMs = totalMs / fulfilled.length;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const fulfilledThisMonth = await ctx.db.dsarRequest.count({
      where: {
        orgId: ctx.orgId,
        status: "fulfilled",
        fulfilledAt: { gte: startOfMonth },
      },
    });

    const openCount = all.filter(
      (r) => !["fulfilled", "rejected"].includes(r.status),
    ).length;
    const processingCount = all.filter((r) =>
      ["processing", "data_collected", "identity_verified"].includes(r.status),
    ).length;

    return {
      total: all.length,
      byStatus,
      overdueCount,
      avgFulfillmentDays: Math.round((avgFulfillmentMs / (1000 * 60 * 60 * 24)) * 10) / 10,
      openCount,
      processingCount,
      fulfilledThisMonth,
    };
  }),

  /** Public intake portal: create a DSAR from an external requester */
  submitPortal: publicProcedure
    .input(
      z.object({
        orgSlug: z.string().min(1),
        requestType: z.enum([
          "access",
          "deletion",
          "rectification",
          "portability",
          "opt_out",
          "restrict_processing",
        ]),
        jurisdiction: z.string().min(1).max(20),
        requesterName: z.string().min(1).max(255),
        requesterEmail: z.string().email(),
        requesterPhone: z.string().max(50).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.orgSlug },
      });
      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      const now = new Date();
      const dueDate = computeDsarDueDate(input.jurisdiction, now);

      const dsar = await ctx.db.$transaction(async (tx) => {
        const row = await tx.dsarRequest.create({
          data: {
            orgId: org.id,
            requestType: input.requestType,
            jurisdiction: input.jurisdiction,
            requesterName: input.requesterName,
            requesterEmail: input.requesterEmail,
            requesterPhone: input.requesterPhone ?? null,
            dueDate,
            notes: input.notes ?? null,
            receivedAt: now,
          },
        });
        await tx.dsarActivity.create({
          data: {
            requestId: row.id,
            action: "portal_submission",
            details: {
              source: "public_portal",
              requestType: input.requestType,
              jurisdiction: input.jurisdiction,
            },
            actor: "system:portal",
          },
        });
        return row;
      });

      return {
        id: dsar.id,
        status: dsar.status,
        dueDate: dsar.dueDate,
        message: "Your request has been received and will be processed within the legal timeframe.",
      };
    }),
});
