import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { getAI, getAIModel } from "@/lib/ai";

export const governanceRouter = createRouter({
  /** List all data stores for the organization */
  listStores: orgProcedure
    .input(
      z
        .object({
          type: z
            .enum([
              "database",
              "api",
              "file_storage",
              "saas_app",
              "crm",
              "analytics",
              "email_platform",
              "cdn",
              "payment_processor",
              "other",
            ])
            .optional(),
          cursor: z.string().uuid().optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const items = await ctx.db.dataStore.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.type ? { type: input.type } : {}),
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

  /** Get a single data store by ID */
  getStore: orgProcedure
    .input(z.object({ storeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const store = await ctx.db.dataStore.findFirst({
        where: { id: input.storeId, orgId: ctx.orgId },
        include: {
          sourceFlows: { include: { target: { select: { id: true, name: true } } } },
          targetFlows: { include: { source: { select: { id: true, name: true } } } },
        },
      });
      if (!store) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Data store not found" });
      }
      return store;
    }),

  /** Create a new data store */
  createStore: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum([
          "database",
          "api",
          "file_storage",
          "saas_app",
          "crm",
          "analytics",
          "email_platform",
          "cdn",
          "payment_processor",
          "other",
        ]),
        provider: z.string().max(100).optional(),
        location: z.string().max(100).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.dataStore.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          type: input.type,
          provider: input.provider,
          location: input.location,
          description: input.description,
        },
      });
    }),

  /** Update a data store */
  updateStore: orgProcedure
    .input(
      z.object({
        storeId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        type: z
          .enum([
            "database",
            "api",
            "file_storage",
            "saas_app",
            "crm",
            "analytics",
            "email_platform",
            "cdn",
            "payment_processor",
            "other",
          ])
          .optional(),
        provider: z.string().max(100).optional(),
        location: z.string().max(100).optional(),
        description: z.string().optional(),
        status: z.string().max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { storeId, ...data } = input;
      const store = await ctx.db.dataStore.findFirst({
        where: { id: storeId, orgId: ctx.orgId },
      });
      if (!store) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Data store not found" });
      }
      return ctx.db.dataStore.update({ where: { id: storeId }, data });
    }),

  /** AI-classify a data store: infer dataTypes, sensitivity, and piiFields from its description */
  classifyStore: orgProcedure
    .input(z.object({ storeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.db.dataStore.findFirst({
        where: { id: input.storeId, orgId: ctx.orgId },
      });
      if (!store) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Data store not found" });
      }

      const client = getAI();
      const completion = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: "You are a data privacy classification engine. Respond ONLY with valid JSON — no markdown fences.",
          },
          {
            role: "user",
            content: `Analyze this data store and classify it.

DATA STORE:
- Name: ${store.name}
- Type: ${store.type}
- Provider: ${store.provider ?? "Unknown"}
- Location: ${store.location ?? "Unknown"}
- Description: ${store.description ?? "No description provided"}

Respond with ONLY valid JSON:
{
  "dataTypes": ["list of data type categories stored, e.g. personal_info, financial, health, behavioral, contact, authentication"],
  "sensitivity": "one of: public, internal, confidential, restricted, pii, sensitive_pii",
  "piiFields": ["specific PII fields likely present, e.g. email, full_name, phone_number, ip_address, ssn, date_of_birth"]
}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      let classification: { dataTypes?: string[]; sensitivity?: string; piiFields?: string[] };
      try {
        classification = JSON.parse(raw);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse AI classification response",
        });
      }

      const validSensitivities = [
        "public",
        "internal",
        "confidential",
        "restricted",
        "pii",
        "sensitive_pii",
      ] as const;
      const sensitivity = validSensitivities.includes(
        classification.sensitivity as (typeof validSensitivities)[number],
      )
        ? (classification.sensitivity as (typeof validSensitivities)[number])
        : store.sensitivity;

      return ctx.db.dataStore.update({
        where: { id: input.storeId },
        data: {
          dataTypes: classification.dataTypes ?? [],
          sensitivity,
          piiFields: classification.piiFields ?? [],
        },
      });
    }),

  /** List all data flows for the organization */
  listFlows: orgProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const items = await ctx.db.dataFlow.findMany({
        where: { orgId: ctx.orgId },
        include: {
          source: { select: { id: true, name: true, type: true, location: true } },
          target: { select: { id: true, name: true, type: true, location: true } },
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

  /** Create a data flow between two stores */
  createFlow: orgProcedure
    .input(
      z.object({
        sourceId: z.string().uuid(),
        targetId: z.string().uuid(),
        dataTypes: z.array(z.string()).optional(),
        purpose: z.string().max(500).optional(),
        legalBasis: z.string().max(100).optional(),
        crossBorder: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [source, target] = await Promise.all([
        ctx.db.dataStore.findFirst({ where: { id: input.sourceId, orgId: ctx.orgId } }),
        ctx.db.dataStore.findFirst({ where: { id: input.targetId, orgId: ctx.orgId } }),
      ]);
      if (!source) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Source data store not found" });
      }
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Target data store not found" });
      }

      const existing = await ctx.db.dataFlow.findUnique({
        where: { sourceId_targetId: { sourceId: input.sourceId, targetId: input.targetId } },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A data flow between these two stores already exists",
        });
      }

      return ctx.db.dataFlow.create({
        data: {
          orgId: ctx.orgId,
          sourceId: input.sourceId,
          targetId: input.targetId,
          dataTypes: input.dataTypes ?? [],
          purpose: input.purpose,
          legalBasis: input.legalBasis,
          crossBorder: input.crossBorder,
          discoveredBy: "manual",
          verified: true,
        },
      });
    }),

  /** AI-discover: analyze all data stores and suggest potential data flows */
  mapFlows: orgProcedure.mutation(async ({ ctx }) => {
    const stores = await ctx.db.dataStore.findMany({
      where: { orgId: ctx.orgId },
    });

    if (stores.length < 2) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "At least two data stores are needed to map flows",
      });
    }

    const existingFlows = await ctx.db.dataFlow.findMany({
      where: { orgId: ctx.orgId },
      select: { sourceId: true, targetId: true },
    });
    const existingSet = new Set(existingFlows.map((f) => `${f.sourceId}->${f.targetId}`));

    const storeList = stores
      .map(
        (s) =>
          `- ID: ${s.id} | Name: ${s.name} | Type: ${s.type} | Provider: ${s.provider ?? "N/A"} | Location: ${s.location ?? "N/A"} | Description: ${s.description ?? "N/A"}`,
      )
      .join("\n");

    const client = getAI();
    const completion = await client.chat.completions.create({
      model: getAIModel(),
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: "You are a data flow mapping engine for privacy compliance. Respond ONLY with valid JSON — no markdown fences.",
        },
        {
          role: "user",
          content: `Analyze these data stores and suggest likely data flows between them.

DATA STORES:
${storeList}

For each suggested flow, consider:
- Common integration patterns (e.g., CRM syncs to email platform, app DB sends to analytics)
- Data types that would flow between them
- Whether the flow crosses borders (different locations)

Respond with ONLY valid JSON:
{
  "suggestions": [
    {
      "sourceId": "uuid",
      "targetId": "uuid",
      "sourceName": "name",
      "targetName": "name",
      "dataTypes": ["types"],
      "purpose": "why this flow likely exists",
      "crossBorder": true/false,
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation"
    }
  ]
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{"suggestions":[]}';
    let parsed: {
      suggestions: Array<{
        sourceId: string;
        targetId: string;
        sourceName: string;
        targetName: string;
        dataTypes: string[];
        purpose: string;
        crossBorder: boolean;
        confidence: number;
        reasoning: string;
      }>;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse AI flow mapping response",
      });
    }

    const storeIds = new Set(stores.map((s) => s.id));
    const suggestions = (parsed.suggestions ?? []).filter(
      (s) =>
        storeIds.has(s.sourceId) &&
        storeIds.has(s.targetId) &&
        s.sourceId !== s.targetId &&
        !existingSet.has(`${s.sourceId}->${s.targetId}`),
    );

    return { suggestions };
  }),

  /** List all vendors for the organization */
  listVendors: orgProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const items = await ctx.db.vendor.findMany({
        where: { orgId: ctx.orgId },
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

  /** Create a vendor */
  createVendor: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        category: z.string().min(1).max(100),
        website: z.string().url().max(500).optional(),
        dpaUrl: z.string().url().max(500).optional(),
        privacyPolicyUrl: z.string().url().max(500).optional(),
        dataShared: z.array(z.string()).optional(),
        purposes: z.array(z.string()).optional(),
        legalBasis: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.vendor.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          category: input.category,
          website: input.website,
          dpaUrl: input.dpaUrl,
          privacyPolicyUrl: input.privacyPolicyUrl,
          dataShared: input.dataShared ?? [],
          purposes: input.purposes ?? [],
          legalBasis: input.legalBasis,
        },
      });
    }),

  /** Update a vendor */
  updateVendor: orgProcedure
    .input(
      z.object({
        vendorId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        category: z.string().min(1).max(100).optional(),
        website: z.string().url().max(500).optional(),
        dpaUrl: z.string().url().max(500).optional(),
        privacyPolicyUrl: z.string().url().max(500).optional(),
        dataShared: z.array(z.string()).optional(),
        purposes: z.array(z.string()).optional(),
        legalBasis: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { vendorId, ...data } = input;
      const vendor = await ctx.db.vendor.findFirst({
        where: { id: vendorId, orgId: ctx.orgId },
      });
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
      }
      return ctx.db.vendor.update({ where: { id: vendorId }, data });
    }),

  /** AI-review: analyze vendor privacy posture and assess risk */
  reviewVendor: orgProcedure
    .input(z.object({ vendorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.db.vendor.findFirst({
        where: { id: input.vendorId, orgId: ctx.orgId },
      });
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
      }

      const client = getAI();
      const completion = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: "You are a vendor privacy risk assessor. Respond ONLY with valid JSON — no markdown fences.",
          },
          {
            role: "user",
            content: `Analyze this vendor and assess their privacy risk.

VENDOR:
- Name: ${vendor.name}
- Category: ${vendor.category}
- Website: ${vendor.website ?? "Not provided"}
- DPA URL: ${vendor.dpaUrl ?? "Not provided"}
- Privacy Policy URL: ${vendor.privacyPolicyUrl ?? "Not provided"}
- Data Shared: ${JSON.stringify(vendor.dataShared ?? [])}
- Purposes: ${JSON.stringify(vendor.purposes ?? [])}
- Sub-processors: ${JSON.stringify(vendor.subProcessors ?? [])}

Assess the vendor on:
1. Whether they have a DPA (Data Processing Agreement)
2. Privacy policy availability and likely comprehensiveness
3. Risk level based on data shared and category
4. Compliance status (compliant, needs_review, non_compliant, unknown)
5. Key concerns and recommendations

Respond with ONLY valid JSON:
{
  "riskLevel": "one of: low, medium, high, critical",
  "complianceStatus": "one of: compliant, needs_review, non_compliant, unknown",
  "findings": [
    { "category": "string", "severity": "low|medium|high", "detail": "string" }
  ],
  "recommendations": ["actionable recommendation strings"],
  "summary": "2-3 sentence overall assessment"
}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      let review: {
        riskLevel?: string;
        complianceStatus?: string;
        findings?: unknown[];
        recommendations?: string[];
        summary?: string;
      };
      try {
        review = JSON.parse(raw);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse AI vendor review response",
        });
      }

      const validRiskLevels = ["low", "medium", "high", "critical"] as const;
      const riskLevel = validRiskLevels.includes(
        review.riskLevel as (typeof validRiskLevels)[number],
      )
        ? (review.riskLevel as (typeof validRiskLevels)[number])
        : undefined;

      await ctx.db.vendor.update({
        where: { id: input.vendorId },
        data: {
          riskLevel,
          complianceStatus: review.complianceStatus ?? "unknown",
          lastReviewedAt: new Date(),
        },
      });

      return {
        vendorId: input.vendorId,
        riskLevel: riskLevel ?? "unknown",
        complianceStatus: review.complianceStatus ?? "unknown",
        findings: review.findings ?? [],
        recommendations: review.recommendations ?? [],
        summary: review.summary ?? "",
      };
    }),

  /** Aggregate governance stats for the organization */
  stats: orgProcedure.query(async ({ ctx }) => {
    const [storesByType, flowCount, crossBorderFlowCount, vendorsByRisk] = await Promise.all([
      ctx.db.dataStore.groupBy({
        by: ["type"],
        where: { orgId: ctx.orgId },
        _count: { id: true },
      }),
      ctx.db.dataFlow.count({ where: { orgId: ctx.orgId } }),
      ctx.db.dataFlow.count({ where: { orgId: ctx.orgId, crossBorder: true } }),
      ctx.db.vendor.groupBy({
        by: ["riskLevel"],
        where: { orgId: ctx.orgId },
        _count: { id: true },
      }),
    ]);

    return {
      storesByType: storesByType.map((s) => ({ type: s.type, count: s._count.id })),
      flowCount,
      crossBorderFlowCount,
      vendorsByRisk: vendorsByRisk.map((v) => ({
        riskLevel: v.riskLevel ?? "unassessed",
        count: v._count.id,
      })),
    };
  }),

  /**
   * JSON bundle of data stores + flows for DSAR / connector handoff (download or pipe to automation).
   */
  exportDataInventory: orgProcedure.query(async ({ ctx }) => {
    const [stores, flows] = await Promise.all([
      ctx.db.dataStore.findMany({
        where: { orgId: ctx.orgId },
        select: {
          id: true,
          name: true,
          type: true,
          provider: true,
          location: true,
          description: true,
          sensitivity: true,
          connectionType: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
      }),
      ctx.db.dataFlow.findMany({
        where: { orgId: ctx.orgId },
        include: {
          source: { select: { id: true, name: true, type: true } },
          target: { select: { id: true, name: true, type: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 1_000,
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      orgId: ctx.orgId,
      dataStores: stores,
      dataFlows: flows,
    };
  }),
});
