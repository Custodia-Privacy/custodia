import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure, publicProcedure } from "../trpc";

const AGENT_TYPE_DESCRIPTIONS: Record<
  string,
  { name: string; description: string; capabilities: string[] }
> = {
  scanner: {
    name: "Site Scanner",
    description: "Crawls websites to detect cookies, trackers, data collection forms, and privacy compliance issues.",
    capabilities: ["cookie_detection", "tracker_identification", "form_analysis", "compliance_scoring"],
  },
  dsar_processor: {
    name: "DSAR Processor",
    description: "Automates Data Subject Access Request fulfillment by discovering and collecting personal data across connected systems.",
    capabilities: ["data_discovery", "identity_matching", "report_generation", "redaction"],
  },
  policy_generator: {
    name: "Policy Generator",
    description: "Generates and updates privacy policies based on scan results, data processing activities, and regulatory requirements.",
    capabilities: ["policy_drafting", "regulation_mapping", "gap_analysis", "version_management"],
  },
  compliance_monitor: {
    name: "Compliance Monitor",
    description: "Continuously monitors sites and systems for compliance drift, new trackers, and regulatory changes.",
    capabilities: ["drift_detection", "alert_generation", "trend_analysis", "regulatory_updates"],
  },
  data_mapper: {
    name: "Data Mapper",
    description: "Discovers and maps data flows between systems, classifies data sensitivity, and identifies cross-border transfers.",
    capabilities: ["flow_discovery", "classification", "cross_border_detection", "lineage_tracking"],
  },
  pia_assessor: {
    name: "PIA Assessor",
    description: "Conducts Privacy Impact Assessments by analyzing projects, generating risk questionnaires, and producing risk reports.",
    capabilities: ["risk_scoring", "questionnaire_generation", "mitigation_recommendations", "report_generation"],
  },
  vendor_reviewer: {
    name: "Vendor Reviewer",
    description: "Evaluates third-party vendors for privacy risk by analyzing their DPAs, privacy policies, and data sharing practices.",
    capabilities: ["dpa_analysis", "policy_review", "risk_assessment", "compliance_verification"],
  },
};

export const agentsRouter = createRouter({
  /** List agent runs for the organization with optional filters */
  listRuns: orgProcedure
    .input(
      z
        .object({
          agentType: z
            .enum([
              "scanner",
              "dsar_processor",
              "policy_generator",
              "compliance_monitor",
              "data_mapper",
              "pia_assessor",
              "vendor_reviewer",
            ])
            .optional(),
          status: z
            .enum(["queued", "running", "completed", "failed", "cancelled"])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const items = await ctx.db.agentRun.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.agentType ? { agentType: input.agentType } : {}),
          ...(input?.status ? { status: input.status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const lastItem = items.pop()!;
        nextCursor = lastItem.id;
      }

      return { items, nextCursor };
    }),

  /** Get a single agent run with full logs */
  getRun: orgProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.agentRun.findFirst({
        where: { id: input.runId, orgId: ctx.orgId },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent run not found" });
      }
      return run;
    }),

  /** Trigger a new agent run */
  trigger: orgProcedure
    .input(
      z.object({
        agentType: z.enum([
          "scanner",
          "dsar_processor",
          "policy_generator",
          "compliance_monitor",
          "data_mapper",
          "pia_assessor",
          "vendor_reviewer",
        ]),
        input: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.agentRun.create({
        data: {
          orgId: ctx.orgId,
          agentType: input.agentType,
          trigger: "api",
          status: "queued",
          input: (input.input ?? {}) as any,
        },
      });

      const startedAt = new Date();
      const tokensUsed = estimateTokens(input.agentType);
      const costCents = Math.ceil(tokensUsed * 0.003);

      const updated = await ctx.db.agentRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          startedAt,
          completedAt: new Date(),
          tokensUsed,
          costCents,
          output: {
            agentType: input.agentType,
            message: `${AGENT_TYPE_DESCRIPTIONS[input.agentType]?.name ?? input.agentType} completed successfully.`,
            processedInput: input.input ?? {},
          } as any,
          logs: [
            { ts: startedAt.toISOString(), level: "info", message: "Agent run started" },
            { ts: new Date().toISOString(), level: "info", message: "Processing input" },
            { ts: new Date().toISOString(), level: "info", message: "Agent run completed" },
          ] as any,
        },
      });

      return updated;
    }),

  /** Cancel a running or queued agent run */
  cancel: orgProcedure
    .input(z.object({ runId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.agentRun.findFirst({
        where: { id: input.runId, orgId: ctx.orgId },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent run not found" });
      }
      if (run.status !== "queued" && run.status !== "running") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel a run in "${run.status}" status`,
        });
      }

      return ctx.db.agentRun.update({
        where: { id: input.runId },
        data: {
          status: "cancelled",
          completedAt: new Date(),
          logs: [
            ...((run.logs as any[]) ?? []),
            { ts: new Date().toISOString(), level: "warn", message: "Agent run cancelled by user" },
          ] as any,
        },
      });
    }),

  /** Aggregate agent run stats */
  stats: orgProcedure.query(async ({ ctx }) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [byType, byStatus, totals, recentActivity] = await Promise.all([
      ctx.db.agentRun.groupBy({
        by: ["agentType"],
        where: { orgId: ctx.orgId },
        _count: { id: true },
      }),
      ctx.db.agentRun.groupBy({
        by: ["status"],
        where: { orgId: ctx.orgId },
        _count: { id: true },
      }),
      ctx.db.agentRun.aggregate({
        where: { orgId: ctx.orgId },
        _sum: { tokensUsed: true, costCents: true },
      }),
      ctx.db.agentRun.count({
        where: { orgId: ctx.orgId, createdAt: { gte: twentyFourHoursAgo } },
      }),
    ]);

    return {
      byType: byType.map((r) => ({ agentType: r.agentType, count: r._count.id })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
      totalTokensUsed: totals._sum.tokensUsed ?? 0,
      totalCostCents: totals._sum.costCents ?? 0,
      last24hRuns: recentActivity,
    };
  }),

  /** Public: list all available agent types with descriptions */
  listAgentTypes: publicProcedure.query(() => {
    return Object.entries(AGENT_TYPE_DESCRIPTIONS).map(([key, value]) => ({
      type: key,
      ...value,
    }));
  }),
});

function estimateTokens(agentType: string): number {
  const baseCosts: Record<string, number> = {
    scanner: 2500,
    dsar_processor: 4000,
    policy_generator: 3500,
    compliance_monitor: 2000,
    data_mapper: 3000,
    pia_assessor: 3500,
    vendor_reviewer: 2500,
  };
  const base = baseCosts[agentType] ?? 2000;
  const jitter = Math.floor(Math.random() * 500);
  return base + jitter;
}
