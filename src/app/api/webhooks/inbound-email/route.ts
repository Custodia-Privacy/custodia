/**
 * Inbound email webhook — converts incoming emails to DSAR requests.
 *
 * Compatible with Resend Inbound Webhooks. The expected address format is:
 *   privacy@<orgSlug>.custodia-privacy.com
 *
 * To set up:
 * 1. Configure your DNS MX record to point to the email provider.
 * 2. Set INBOUND_EMAIL_WEBHOOK_SECRET in your env (shared secret for verification).
 * 3. Configure the email provider to POST to /api/webhooks/inbound-email
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DsarType } from "@prisma/client";
import { computeDsarDueDate } from "@/lib/dsar-deadlines";

interface InboundEmailPayload {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

const REQUEST_TYPE_KEYWORDS: Record<string, string[]> = {
  deletion: ["delete", "erase", "remove", "forget me", "right to be forgotten"],
  access: ["access", "copy of my data", "what data", "data you have", "subject access"],
  portability: ["portability", "export", "transfer my data", "download my data"],
  rectification: ["correct", "rectif", "update my", "fix my", "inaccurate"],
  opt_out: ["opt out", "opt-out", "do not sell", "unsubscribe", "stop processing"],
  restrict_processing: ["restrict", "limit processing"],
};

function classifyRequestType(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();
  for (const [type, keywords] of Object.entries(REQUEST_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return type;
  }
  return "access";
}

function detectJurisdiction(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("gdpr") || lower.includes("eu") || lower.includes("european")) return "gdpr";
  if (lower.includes("ccpa") || lower.includes("california") || lower.includes("cpra")) return "ccpa";
  if (lower.includes("lgpd") || lower.includes("brazil")) return "lgpd";
  if (lower.includes("pipeda") || lower.includes("canada")) return "pipeda";
  if (lower.includes("popia") || lower.includes("south africa")) return "popia";
  return "auto";
}

function parseFromField(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, "") || match[2], email: match[2] };
  }
  return { name: from.trim(), email: from.trim() };
}

function extractOrgSlugFromTo(to: string): string | null {
  const match = to.match(/privacy@([^.]+)\.custodia-privacy\.com/i);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  const hookSecret = req.headers.get("x-webhook-secret");
  if (authHeader !== `Bearer ${secret}` && hookSecret !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: InboundEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload.from || !payload.to) {
    return NextResponse.json({ error: "missing_fields", message: "from and to are required" }, { status: 400 });
  }

  const orgSlug = extractOrgSlugFromTo(payload.to);
  if (!orgSlug) {
    return NextResponse.json(
      { error: "unknown_recipient", message: "Could not determine org from the 'to' address. Expected privacy@<slug>.custodia-privacy.com" },
      { status: 400 },
    );
  }

  const org = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    return NextResponse.json({ error: "org_not_found", message: `No organization found for slug: ${orgSlug}` }, { status: 404 });
  }

  const { name, email } = parseFromField(payload.from);
  const body = payload.text || "";
  const subject = payload.subject || "";

  const requestType = classifyRequestType(subject, body) as DsarType;
  const jurisdiction = detectJurisdiction(`${subject} ${body}`);
  const now = new Date();
  const dueDate = computeDsarDueDate(jurisdiction, now);

  const dsar = await db.$transaction(async (tx) => {
    const row = await tx.dsarRequest.create({
      data: {
        orgId: org.id,
        requestType,
        jurisdiction,
        requesterName: name,
        requesterEmail: email,
        dueDate,
        receivedAt: now,
        notes: [
          subject ? `Subject: ${subject}` : null,
          body ? `\n${body.slice(0, 4000)}` : null,
        ].filter(Boolean).join("\n"),
      },
    });
    await tx.dsarActivity.create({
      data: {
        requestId: row.id,
        action: "request_received",
        details: {
          source: "inbound_email",
          from: payload.from,
          subject,
          requestType,
          jurisdiction,
          dueDate: dueDate.toISOString(),
        },
        actor: "system:email",
      },
    });
    return row;
  });

  return NextResponse.json(
    {
      ok: true,
      dsarId: dsar.id,
      requestType,
      jurisdiction,
      dueDate: dueDate.toISOString(),
    },
    { status: 201 },
  );
}
