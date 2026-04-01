import { randomUUID } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";
import { createRouter, orgProcedure } from "../trpc";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { getAI, getAIModel } from "@/lib/ai";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12_000),
});

const ASSISTANT_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "propose_create_site",
      description: "Propose adding a new website property to scan. User must confirm in UI.",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Hostname only, e.g. shop.example.com" },
          name: { type: "string", description: "Friendly label; defaults to domain if omitted" },
        },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_trigger_scan",
      description: "Propose enqueueing a new full scan for an existing site.",
      parameters: {
        type: "object",
        properties: {
          siteId: { type: "string", description: "UUID of the site row" },
        },
        required: ["siteId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_create_dsar",
      description: "Propose creating a new DSAR. User must confirm.",
      parameters: {
        type: "object",
        properties: {
          requestType: {
            type: "string",
            enum: ["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"],
          },
          jurisdiction: { type: "string" },
          requesterName: { type: "string" },
          requesterEmail: { type: "string" },
          notes: { type: "string" },
        },
        required: ["requestType", "jurisdiction", "requesterName", "requesterEmail"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_dsar_status",
      description: "Propose moving a DSAR to a new pipeline status.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: {
            type: "string",
            enum: ["received", "identity_verified", "processing", "data_collected", "review", "fulfilled", "rejected"],
          },
          notes: { type: "string" },
        },
        required: ["id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_generate_policy",
      description: "Propose generating a privacy policy, cookie policy, or terms of service for a site using AI. Requires a completed scan.",
      parameters: {
        type: "object",
        properties: {
          siteId: { type: "string" },
          type: {
            type: "string",
            enum: ["privacy_policy", "cookie_policy", "terms_of_service", "acceptable_use", "data_processing"],
          },
        },
        required: ["siteId", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_navigation",
      description: "Suggest opening a Custodia app path in the dashboard.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "In-app route, e.g. /dashboard, /sites, /dsars, /settings" },
          reason: { type: "string", description: "One short line shown on the button" },
        },
        required: ["path", "reason"],
      },
    },
  },
];

export type AssistantProposal =
  | { id: string; tool: "propose_create_site"; input: { domain: string; name?: string }; label: string }
  | { id: string; tool: "propose_trigger_scan"; input: { siteId: string }; label: string }
  | { id: string; tool: "propose_create_dsar"; input: { requestType: string; jurisdiction: string; requesterName: string; requesterEmail: string; notes?: string }; label: string }
  | { id: string; tool: "propose_update_dsar_status"; input: { id: string; status: string; notes?: string }; label: string }
  | { id: string; tool: "propose_generate_policy"; input: { siteId: string; type: string }; label: string }
  | { id: string; tool: "suggest_navigation"; input: { path: string; reason: string }; label: string };


async function getMonthlyUsage(db: any, orgId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return db.auditLog.count({
    where: {
      orgId,
      action: "assistant_chat",
      createdAt: { gte: startOfMonth },
    },
  });
}

export const assistantRouter = createRouter({
  chat: orgProcedure
    .input(
      z.object({
        messages: z.array(messageSchema).min(1).max(24),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.AI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "AI assistant is not configured. Set AI_API_KEY or ANTHROPIC_API_KEY in the server environment.",
        });
      }

      const rate = checkPublicRateLimit(`assistant-chat:${ctx.userId}`, 40, 60 * 60 * 1000);
      if (!rate.ok) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Too many assistant requests. Try again in ${rate.retryAfterSec} seconds.`,
        });
      }

      const org = await ctx.db.organization.findUniqueOrThrow({
        where: { id: ctx.orgId },
        include: {
          _count: { select: { sites: true, members: true } },
        },
      });

      const planLimits = PLANS[org.plan as PlanKey] ?? PLANS.free;
      const monthlyUsage = await getMonthlyUsage(ctx.db, ctx.orgId);
      if (monthlyUsage >= planLimits.aiCompletionsPerMonth) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Monthly AI limit reached (${planLimits.aiCompletionsPerMonth}). Upgrade your plan for more.`,
        });
      }

      const sites = await ctx.db.site.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        select: { id: true, domain: true, name: true },
        take: 30,
      });

      const dsars = await ctx.db.dsarRequest.findMany({
        where: { orgId: ctx.orgId, status: { notIn: ["fulfilled", "rejected"] } },
        select: { id: true, requesterName: true, requesterEmail: true, requestType: true, status: true, dueDate: true },
        orderBy: { dueDate: "asc" },
        take: 20,
      });

      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.userId },
        select: { email: true, name: true },
      });

      const siteLines =
        sites.length > 0
          ? sites.map((s) => `id=${s.id} domain=${s.domain} name=${s.name}`).join("\n")
          : "(none — use propose_create_site first)";

      const dsarLines =
        dsars.length > 0
          ? dsars.map((d) => `id=${d.id} name=${d.requesterName} email=${d.requesterEmail} type=${d.requestType} status=${d.status} due=${d.dueDate.toISOString().slice(0, 10)}`).join("\n")
          : "(no open requests)";

      const systemPrompt = [
        "You are Custodia AI, an expert privacy compliance co-pilot for SMB owners.",
        "",
        "ORG_CONTEXT (read-only; do not invent data):",
        `- Organization: ${org.name} (plan: ${org.plan}, slug: ${org.slug})`,
        `- Your role in app: ${ctx.orgRole}`,
        `- Members: ${org._count.members}`,
        `- User: ${user.name ?? user.email}`,
        "",
        "Sites (use these exact ids for propose_trigger_scan):",
        siteLines,
        "",
        "Open DSARs (use these ids for propose_update_dsar_status):",
        dsarLines,
        "",
        "INSTRUCTIONS:",
        "- Be concise but thorough. Use markdown formatting (bold, lists, headings) for readability.",
        "- When the user wants you to DO something in the app, call the appropriate tool — tools create proposals the user must click 'Run' to confirm.",
        "- You can create data requests, trigger scans, update DSAR statuses, generate policies, and navigate the user to pages.",
        "- Prefer at most 1–2 tool calls per turn. You may combine a short text answer with tools.",
        "- Do not claim data was changed without a tool proposal.",
        "- For legal questions, provide general guidance but defer to their counsel for specifics.",
      ].join("\n");

      const client = getAI();

      const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...input.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 2048,
        tools: ASSISTANT_TOOLS,
        messages: apiMessages,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Empty AI response." });
      }

      const textParts: string[] = [];
      const proposals: AssistantProposal[] = [];

      if (choice.message.content) {
        textParts.push(choice.message.content);
      }

      if (choice.message.tool_calls) {
        for (const call of choice.message.tool_calls) {
          if (call.type !== "function") continue;
          const id = randomUUID();
          let inputObj: Record<string, unknown> = {};
          try {
            inputObj = JSON.parse(call.function.arguments || "{}");
          } catch { /* ignore parse errors */ }

          if (call.function.name === "propose_create_site") {
            const domain = String(inputObj.domain ?? "").trim();
            if (!domain) continue;
            const name = inputObj.name != null ? String(inputObj.name).trim() : undefined;
            proposals.push({ id, tool: "propose_create_site", input: { domain, name: name || undefined }, label: `Add site ${domain}` });
          } else if (call.function.name === "propose_trigger_scan") {
            const siteId = String(inputObj.siteId ?? "").trim();
            if (!siteId) continue;
            const site = sites.find((s) => s.id === siteId);
            proposals.push({ id, tool: "propose_trigger_scan", input: { siteId }, label: site ? `Run full scan for ${site.domain}` : `Run full scan (${siteId.slice(0, 8)}…)` });
          } else if (call.function.name === "propose_create_dsar") {
            const requesterName = String(inputObj.requesterName ?? "").trim();
            const requesterEmail = String(inputObj.requesterEmail ?? "").trim();
            const requestType = String(inputObj.requestType ?? "access").trim();
            const jurisdiction = String(inputObj.jurisdiction ?? "auto").trim();
            if (!requesterName || !requesterEmail) continue;
            proposals.push({ id, tool: "propose_create_dsar", input: { requestType, jurisdiction, requesterName, requesterEmail, notes: inputObj.notes ? String(inputObj.notes) : undefined }, label: `Create ${requestType} request for ${requesterName}` });
          } else if (call.function.name === "propose_update_dsar_status") {
            const dsarId = String(inputObj.id ?? "").trim();
            const status = String(inputObj.status ?? "").trim();
            if (!dsarId || !status) continue;
            const dsar = dsars.find((d) => d.id === dsarId);
            proposals.push({ id, tool: "propose_update_dsar_status", input: { id: dsarId, status, notes: inputObj.notes ? String(inputObj.notes) : undefined }, label: dsar ? `Move ${dsar.requesterName}'s request → ${status}` : `Update request → ${status}` });
          } else if (call.function.name === "propose_generate_policy") {
            const siteId = String(inputObj.siteId ?? "").trim();
            const policyType = String(inputObj.type ?? "privacy_policy").trim();
            if (!siteId) continue;
            const site = sites.find((s) => s.id === siteId);
            const typeLabels: Record<string, string> = { privacy_policy: "Privacy Policy", cookie_policy: "Cookie Policy", terms_of_service: "Terms of Service", acceptable_use: "Acceptable Use Policy", data_processing: "DPA" };
            proposals.push({ id, tool: "propose_generate_policy", input: { siteId, type: policyType }, label: `Generate ${typeLabels[policyType] ?? policyType} for ${site?.domain ?? siteId.slice(0, 8)}` });
          } else if (call.function.name === "suggest_navigation") {
            const path = String(inputObj.path ?? "").trim();
            const reason = String(inputObj.reason ?? "Open").trim();
            proposals.push({ id, tool: "suggest_navigation", input: { path, reason }, label: reason });
          }
        }
      }

      const reply = textParts.join("\n").trim();
      if (!reply && proposals.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Assistant returned an empty response.",
        });
      }

      await ctx.db.auditLog.create({
        data: {
          orgId: ctx.orgId,
          userId: ctx.userId,
          action: "assistant_chat",
          source: "assistant",
          success: true,
        },
      });

      return {
        reply: reply || "Here are actions you can confirm:",
        proposals,
      };
    }),

  /** Persist a row when the user confirms (or fails) an assistant-suggested action. */
  recordConfirmedAction: orgProcedure
    .input(
      z.object({
        action: z.string().max(100),
        payload: z.record(z.any()).optional(),
        success: z.boolean(),
        errorMessage: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.auditLog.create({
        data: {
          orgId: ctx.orgId,
          userId: ctx.userId,
          action: input.action,
          source: "assistant",
          payload: input.payload ?? undefined,
          success: input.success,
          errorMessage: input.errorMessage ?? null,
        },
      });
    }),

  listAudit: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.auditLog.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: {
          user: { select: { email: true, name: true } },
        },
      });
    }),

  usage: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUniqueOrThrow({
      where: { id: ctx.orgId },
    });
    const planLimits = PLANS[org.plan as PlanKey] ?? PLANS.free;
    const used = await getMonthlyUsage(ctx.db, ctx.orgId);
    return {
      used,
      limit: planLimits.aiCompletionsPerMonth,
      remaining: Math.max(0, planLimits.aiCompletionsPerMonth - used),
    };
  }),
});
