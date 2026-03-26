import { randomUUID } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";
import { createRouter, orgProcedure } from "../trpc";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12_000),
});

/** Tools only *propose* work — the browser executes after the user clicks Confirm. */
const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "propose_create_site",
    description:
      "Propose adding a new website property to scan. User must confirm in UI. Domain must look like example.com (no protocol).",
    input_schema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Hostname only, e.g. shop.example.com" },
        name: { type: "string", description: "Friendly label; defaults to domain if omitted" },
      },
      required: ["domain"],
    },
  },
  {
    name: "propose_trigger_scan",
    description:
      "Propose enqueueing a new full scan for an existing site. Use site id from ORG_CONTEXT list.",
    input_schema: {
      type: "object",
      properties: {
        siteId: { type: "string", description: "UUID of the site row" },
      },
      required: ["siteId"],
    },
  },
  {
    name: "propose_create_dsar",
    description:
      "Propose creating a new Data Subject Access Request (DSAR). The user must confirm before it runs.",
    input_schema: {
      type: "object",
      properties: {
        requestType: {
          type: "string",
          enum: ["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"],
          description: "Type of data subject request",
        },
        jurisdiction: {
          type: "string",
          description: "Regulation code, e.g. gdpr, ccpa, lgpd, auto",
        },
        requesterName: { type: "string", description: "Full name of the data subject" },
        requesterEmail: { type: "string", description: "Email of the data subject" },
        notes: { type: "string", description: "Optional notes about the request" },
      },
      required: ["requestType", "jurisdiction", "requesterName", "requesterEmail"],
    },
  },
  {
    name: "propose_update_dsar_status",
    description:
      "Propose moving a DSAR to a new pipeline status. Use DSAR ids from DSAR_CONTEXT.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID of the DSAR request" },
        status: {
          type: "string",
          enum: ["received", "identity_verified", "processing", "data_collected", "review", "fulfilled", "rejected"],
          description: "Target status",
        },
        notes: { type: "string", description: "Optional note for the status change" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "suggest_navigation",
    description: "Suggest opening a Custodia app path in the dashboard (no server mutation). You can also use dynamic paths like /sites/{siteId}.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "In-app route, e.g. /dashboard, /sites, /dsars, /settings" },
        reason: { type: "string", description: "One short line shown on the button" },
      },
      required: ["path", "reason"],
    },
  },
];

export type AssistantProposal =
  | { id: string; tool: "propose_create_site"; input: { domain: string; name?: string }; label: string }
  | { id: string; tool: "propose_trigger_scan"; input: { siteId: string }; label: string }
  | { id: string; tool: "propose_create_dsar"; input: { requestType: string; jurisdiction: string; requesterName: string; requesterEmail: string; notes?: string }; label: string }
  | { id: string; tool: "propose_update_dsar_status"; input: { id: string; status: string; notes?: string }; label: string }
  | { id: string; tool: "suggest_navigation"; input: { path: string; reason: string }; label: string };

export const assistantRouter = createRouter({
  chat: orgProcedure
    .input(
      z.object({
        messages: z.array(messageSchema).min(1).max(24),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "AI assistant is not configured. Set ANTHROPIC_API_KEY in the server environment.",
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
          _count: {
            select: { sites: true, members: true },
          },
        },
      });

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

      const contextBlock = [
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
        "You are Custodia AI, an expert privacy compliance co-pilot for SMB owners.",
        "- Be concise but thorough. Use markdown formatting (bold, lists, headings) for readability.",
        "- When the user wants you to DO something in the app, call the appropriate tool — tools create proposals the user must click 'Run' to confirm.",
        "- You can create data requests, trigger scans, update DSAR statuses, and navigate the user to pages.",
        "- Prefer at most 1–2 tool calls per turn. You may combine a short text answer with tools.",
        "- Do not claim data was changed without a tool proposal.",
        "- For legal questions, provide general guidance but defer to their counsel for specifics.",
      ].join("\n");

      const client = new Anthropic();

      const apiMessages = input.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: contextBlock,
        tools: ASSISTANT_TOOLS,
        messages: apiMessages,
      });

      const textParts: string[] = [];
      const proposals: AssistantProposal[] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          textParts.push(block.text);
        }
        if (block.type === "tool_use") {
          const id = randomUUID();
          const inputObj = block.input as Record<string, unknown>;
          if (block.name === "propose_create_site") {
            const domain = String(inputObj.domain ?? "").trim();
            if (!domain) continue;
            const name = inputObj.name != null ? String(inputObj.name).trim() : undefined;
            proposals.push({
              id,
              tool: "propose_create_site",
              input: { domain, name: name || undefined },
              label: `Add site ${domain}`,
            });
          } else if (block.name === "propose_trigger_scan") {
            const siteId = String(inputObj.siteId ?? "").trim();
            if (!siteId) continue;
            const site = sites.find((s) => s.id === siteId);
            proposals.push({
              id,
              tool: "propose_trigger_scan",
              input: { siteId },
              label: site ? `Run full scan for ${site.domain}` : `Run full scan (${siteId.slice(0, 8)}…)`,
            });
          } else if (block.name === "propose_create_dsar") {
            const requesterName = String(inputObj.requesterName ?? "").trim();
            const requesterEmail = String(inputObj.requesterEmail ?? "").trim();
            const requestType = String(inputObj.requestType ?? "access").trim();
            const jurisdiction = String(inputObj.jurisdiction ?? "auto").trim();
            if (!requesterName || !requesterEmail) continue;
            proposals.push({
              id,
              tool: "propose_create_dsar",
              input: { requestType, jurisdiction, requesterName, requesterEmail, notes: inputObj.notes ? String(inputObj.notes) : undefined },
              label: `Create ${requestType} request for ${requesterName}`,
            });
          } else if (block.name === "propose_update_dsar_status") {
            const dsarId = String(inputObj.id ?? "").trim();
            const status = String(inputObj.status ?? "").trim();
            if (!dsarId || !status) continue;
            const dsar = dsars.find((d) => d.id === dsarId);
            proposals.push({
              id,
              tool: "propose_update_dsar_status",
              input: { id: dsarId, status, notes: inputObj.notes ? String(inputObj.notes) : undefined },
              label: dsar ? `Move ${dsar.requesterName}'s request → ${status}` : `Update request → ${status}`,
            });
          } else if (block.name === "suggest_navigation") {
            const path = String(inputObj.path ?? "").trim();
            const reason = String(inputObj.reason ?? "Open").trim();
            proposals.push({
              id,
              tool: "suggest_navigation",
              input: { path, reason },
              label: reason,
            });
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
});
