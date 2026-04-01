import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { getAI, getAIModel } from "@/lib/ai";

interface SessionWithOrg {
  user: { id: string };
  orgId?: string;
  orgRole?: string;
}

const TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "propose_create_site",
      description: "Propose adding a new website property to scan. User must confirm in UI.",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Hostname only, e.g. shop.example.com" },
          name: { type: "string", description: "Friendly label" },
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
        properties: { siteId: { type: "string" } },
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
          requestType: { type: "string", enum: ["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"] },
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
      description: "Propose moving a DSAR to a new status.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["received", "identity_verified", "processing", "data_collected", "review", "fulfilled", "rejected"] },
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
      description: "Propose generating (or regenerating) a privacy policy, cookie policy, terms of service, or other legal document for a site using AI. Requires a completed scan. User must confirm.",
      parameters: {
        type: "object",
        properties: {
          siteId: { type: "string", description: "The site UUID to generate the policy for" },
          type: {
            type: "string",
            enum: ["privacy_policy", "cookie_policy", "terms_of_service", "acceptable_use", "data_processing"],
            description: "The type of policy to generate. Defaults to privacy_policy.",
          },
        },
        required: ["siteId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_navigation",
      description: "Suggest opening a Custodia app path.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          reason: { type: "string" },
        },
        required: ["path", "reason"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  const session = (await auth()) as SessionWithOrg | null;
  if (!session?.user?.id || !session.orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.AI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  let parsedBody: unknown;
  try { parsedBody = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { messages } = parsedBody as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 24) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }
  for (const m of messages) {
    if (!m || typeof m !== "object") return Response.json({ error: "Invalid message format" }, { status: 400 });
    if (!["user", "assistant", "system"].includes(m.role)) return Response.json({ error: "Invalid role" }, { status: 400 });
    if (typeof m.content !== "string" || m.content.length > 16000) return Response.json({ error: "Message too long" }, { status: 400 });
  }

  const userId = session.user.id;
  const orgId = session.orgId;
  const orgRole = session.orgRole ?? "member";

  const org = await db.organization.findUniqueOrThrow({
    where: { id: orgId },
    include: { _count: { select: { sites: true, members: true } } },
  });

  const planKey = (org.plan as PlanKey) ?? "free";
  const planLimits = PLANS[planKey] ?? PLANS.free;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const usageCount = await db.auditLog.count({
    where: { orgId, action: "assistant_chat", createdAt: { gte: monthStart } },
  });

  if (usageCount >= planLimits.aiCompletionsPerMonth) {
    return Response.json({
      error: `Monthly limit reached (${planLimits.aiCompletionsPerMonth} on ${planLimits.name}). Upgrade for more.`,
    }, { status: 429 });
  }

  const [sites, dsars, user, alerts] = await Promise.all([
    db.site.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, domain: true, name: true, complianceScore: true, lastScannedAt: true, monitoringEnabled: true },
      take: 30,
    }),
    db.dsarRequest.findMany({
      where: { orgId, status: { notIn: ["fulfilled", "rejected"] } },
      select: { id: true, requesterName: true, requesterEmail: true, requestType: true, status: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true } }),
    db.alert.findMany({
      where: { orgId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { type: true, title: true, severity: true, createdAt: true },
    }),
  ]);

  const siteIds = sites.map((s) => s.id);

  const [findings, policies, latestScans] = await Promise.all([
    siteIds.length > 0
      ? db.finding.findMany({
          where: { siteId: { in: siteIds }, resolvedAt: null },
          select: { siteId: true, category: true, severity: true, title: true, regulations: true },
          orderBy: { severity: "asc" },
          take: 50,
        })
      : [],
    db.policy.findMany({
      where: { site: { orgId, deletedAt: null } },
      select: { siteId: true, type: true, publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    siteIds.length > 0
      ? db.scan.findMany({
          where: { siteId: { in: siteIds }, status: "completed" },
          orderBy: { completedAt: "desc" },
          take: siteIds.length,
          distinct: ["siteId" as const],
          select: { siteId: true, completedAt: true, summary: true, complianceScores: true },
        })
      : [],
  ]);

  const scanBySite = new Map(latestScans.map((s) => [s.siteId, s]));

  const siteLines = sites.length > 0
    ? sites.map((s) => {
        const scan = scanBySite.get(s.id);
        const scores = scan?.complianceScores as { overall?: number; regulations?: Record<string, number | null> } | null;
        const summary = scan?.summary as { trackersFound?: number; cookiesFound?: number; issuesFound?: number } | null;
        const parts = [
          `id=${s.id} domain=${s.domain} name=${s.name}`,
          `score=${scores?.overall ?? s.complianceScore ?? "no-scan"}`,
          `monitoring=${s.monitoringEnabled ? "on" : "off"}`,
          s.lastScannedAt ? `last_scan=${s.lastScannedAt.toISOString().slice(0, 10)}` : "never_scanned",
        ];
        if (summary) parts.push(`trackers=${summary.trackersFound ?? 0} cookies=${summary.cookiesFound ?? 0} issues=${summary.issuesFound ?? 0}`);
        if (scores?.regulations) {
          const regs = Object.entries(scores.regulations).filter(([, v]) => v != null).map(([k, v]) => `${k}:${v}`).join(",");
          if (regs) parts.push(`regulation_scores={${regs}}`);
        }
        return parts.join(" ");
      }).join("\n")
    : "(none)";

  const findingLines = findings.length > 0
    ? findings.map((f) => {
        const site = sites.find((s) => s.id === f.siteId);
        return `[${f.severity}] ${f.category}: ${f.title} (site=${site?.domain ?? f.siteId}${f.regulations.length ? ` regs=${f.regulations.join(",")}` : ""})`;
      }).join("\n")
    : "(no open findings)";

  const policyLines = policies.length > 0
    ? policies.map((p) => {
        const site = sites.find((s) => s.id === p.siteId);
        return `${p.type} for ${site?.domain ?? "unknown"}: ${p.publishedAt ? `published=${p.publishedAt.toISOString().slice(0, 10)}` : "draft"}`;
      }).join("\n")
    : "(no policies created)";

  const alertLines = alerts.length > 0
    ? alerts.map((a) => `[${a.severity}] ${a.title} (${a.createdAt.toISOString().slice(0, 10)})`).join("\n")
    : "(no unread alerts)";

  const dsarLines = dsars.length > 0
    ? dsars.map((d) => `id=${d.id} name=${d.requesterName} email=${d.requesterEmail} type=${d.requestType} status=${d.status} due=${d.dueDate.toISOString().slice(0, 10)}`).join("\n")
    : "(no open requests)";

  const systemPrompt = [
    "# ABOUT CUSTODIA",
    "Custodia is a privacy compliance platform for small and medium businesses. It helps companies:",
    "- Scan websites to detect cookies, trackers, and third-party scripts that may violate privacy regulations",
    "- Generate and publish privacy policies and cookie policies based on actual scan findings",
    "- Manage Data Subject Access Requests (DSARs) with automated workflows",
    "- Monitor compliance with GDPR, CCPA/CPRA, VCDPA, CPA, CTDPA, and other privacy regulations",
    "- Run Privacy Impact Assessments (PIAs) with AI assistance",
    "- Deploy customizable cookie consent banners",
    "- Track data flows and vendor relationships for data governance",
    "",
    "# USER & ORGANIZATION CONTEXT",
    `Organization: ${org.name} (plan: ${org.plan}, slug: ${org.slug})`,
    `User: ${user.name ?? user.email} (role: ${orgRole})`,
    `Team members: ${org._count.members}`,
    "",
    "# SITES", siteLines,
    "",
    "# OPEN FINDINGS", findingLines,
    "",
    "# POLICIES", policyLines,
    "",
    "# UNREAD ALERTS", alertLines,
    "",
    "# OPEN DATA SUBJECT REQUESTS", dsarLines,
    "",
    "# INSTRUCTIONS",
    "You are Custodia AI, an expert privacy compliance co-pilot.",
    "- Answer using the context above. Be specific — cite scores, site names, finding titles.",
    "- For regulation questions (GDPR, CCPA, etc.), provide accurate practical guidance.",
    "- When the user wants an action, call the appropriate tool. Tools create proposals the user must confirm.",
    "- You can generate policies (privacy policy, cookie policy, terms of service, etc.) for any site that has a completed scan. Use propose_generate_policy.",
    "- For action items: prioritize open findings, alerts, missing policies, pending DSARs by severity.",
    "- Be concise. Use markdown (bold, lists, headings).",
    "- Do not invent data. If data is missing, suggest running a scan.",
    "- For legal specifics, recommend consulting counsel.",
  ].join("\n");

  const client = getAI();

  const stream = await client.chat.completions.create({
    model: getAIModel(),
    max_tokens: 2048,
    tools: TOOLS,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    stream: true,
  });

  const encoder = new TextEncoder();
  const toolCallAccumulator: Record<number, { name: string; arguments: string }> = {};

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta.content })}\n\n`));
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!toolCallAccumulator[idx]) {
                toolCallAccumulator[idx] = { name: "", arguments: "" };
              }
              if (tc.function?.name) toolCallAccumulator[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCallAccumulator[idx].arguments += tc.function.arguments;
            }
          }
        }

        const proposals: Array<{ id: string; tool: string; input: Record<string, unknown>; label: string }> = [];
        for (const tc of Object.values(toolCallAccumulator)) {
          const id = randomUUID();
          let inputObj: Record<string, unknown>;
          try { inputObj = JSON.parse(tc.arguments); } catch { continue; }

          if (tc.name === "propose_create_site") {
            const domain = String(inputObj.domain ?? "").trim();
            if (!domain) continue;
            proposals.push({ id, tool: tc.name, input: inputObj, label: `Add site ${domain}` });
          } else if (tc.name === "propose_trigger_scan") {
            const siteId = String(inputObj.siteId ?? "").trim();
            const site = sites.find((s) => s.id === siteId);
            proposals.push({ id, tool: tc.name, input: inputObj, label: site ? `Run full scan for ${site.domain}` : `Run scan` });
          } else if (tc.name === "propose_create_dsar") {
            proposals.push({ id, tool: tc.name, input: inputObj, label: `Create ${inputObj.requestType} request for ${inputObj.requesterName}` });
          } else if (tc.name === "propose_update_dsar_status") {
            const dsar = dsars.find((d) => d.id === inputObj.id);
            proposals.push({ id, tool: tc.name, input: inputObj, label: dsar ? `Move ${dsar.requesterName}'s request → ${inputObj.status}` : `Update request → ${inputObj.status}` });
          } else if (tc.name === "propose_generate_policy") {
            const siteId = String(inputObj.siteId ?? "").trim();
            const policyType = String(inputObj.type ?? "privacy_policy");
            const site = sites.find((s) => s.id === siteId);
            const typeLabels: Record<string, string> = {
              privacy_policy: "Privacy Policy",
              cookie_policy: "Cookie Policy",
              terms_of_service: "Terms of Service",
              acceptable_use: "Acceptable Use Policy",
              data_processing: "Data Processing Agreement",
            };
            const label = typeLabels[policyType] ?? "Policy";
            proposals.push({ id, tool: tc.name, input: { siteId, type: policyType }, label: `Generate ${label}${site ? ` for ${site.domain}` : ""}` });
          } else if (tc.name === "suggest_navigation") {
            proposals.push({ id, tool: tc.name, input: inputObj, label: String(inputObj.reason ?? "Open") });
          }
        }

        if (proposals.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "proposals", proposals })}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();

        await db.auditLog.create({
          data: { orgId, userId, action: "assistant_chat", source: "assistant", success: true },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
