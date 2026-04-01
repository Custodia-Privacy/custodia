import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeDsarDueDate } from "@/lib/dsar-deadlines";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { getClientIp } from "@/lib/ip-check";
import { Resend } from "resend";

const log = createLogger("public/dsar");

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const REQUEST_LABELS: Record<string, string> = {
  access: "Access",
  deletion: "Deletion",
  rectification: "Rectification",
  portability: "Portability",
  opt_out: "Opt-out / Do not sell",
  restrict_processing: "Restrict processing",
};

const bodySchema = z.object({
  siteId: z.string().uuid(),
  requestType: z.enum([
    "access",
    "deletion",
    "rectification",
    "portability",
    "opt_out",
    "restrict_processing",
  ]),
  jurisdiction: z.string().min(2).max(20),
  requesterName: z.string().min(1).max(255),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().max(50).optional(),
  details: z.string().max(8000).optional(),
  /** Honeypot — must be empty */
  website: z.string().max(200).optional(),
});

const clientIp = getClientIp;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = await checkRateLimit(`dsar:${ip}`, 15, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: limited.retryAfterSec },
      {
        status: 429,
        headers: rateLimitHeaders(limited),
      },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  if (input.website && input.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const site = await db.site.findFirst({
    where: { id: input.siteId, deletedAt: null },
    select: { id: true, orgId: true, domain: true },
  });

  if (!site) {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }

  const jurisdiction = input.jurisdiction.trim().toLowerCase();
  const now = new Date();
  const dueDate = computeDsarDueDate(jurisdiction, now);

  const dsar = await db.$transaction(async (tx) => {
    const row = await tx.dsarRequest.create({
      data: {
        orgId: site.orgId,
        siteId: site.id,
        requestType: input.requestType,
        jurisdiction,
        requesterName: input.requesterName.trim(),
        requesterEmail: input.requesterEmail.trim().toLowerCase(),
        requesterPhone: input.requesterPhone?.trim() || null,
        dueDate,
        receivedAt: now,
        notes: input.details?.trim() || null,
      },
    });
    await tx.dsarActivity.create({
      data: {
        requestId: row.id,
        action: "request_received",
        details: {
          source: "public_form",
          requestType: input.requestType,
          jurisdiction,
          dueDate: dueDate.toISOString(),
        },
        actor: "public_dsar_form",
      },
    });
    return row;
  });

  const owner = await db.orgMember.findFirst({
    where: { orgId: site.orgId, role: "owner" },
    include: { user: { select: { email: true, name: true } } },
  });

  if (owner?.user?.email && process.env.RESEND_API_KEY) {
    try {
      await getResend().emails.send({
        from: "Custodia <noreply@custodia-privacy.com>",
        to: owner.user.email,
        subject: `New privacy request (${REQUEST_LABELS[input.requestType]}) — ${site.domain}`,
        html: `
          <p>A new data subject request was submitted via your public form.</p>
          <ul>
            <li><strong>Type:</strong> ${REQUEST_LABELS[input.requestType]}</li>
            <li><strong>Site:</strong> ${site.domain}</li>
            <li><strong>Jurisdiction:</strong> ${jurisdiction}</li>
            <li><strong>Due:</strong> ${dueDate.toISOString().slice(0, 10)}</li>
            <li><strong>Requester:</strong> ${escapeHtml(input.requesterName)} &lt;${escapeHtml(input.requesterEmail)}&gt;</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dsars">Open DSARs in Custodia</a></p>
        `,
      });
    } catch (e) {
      log.error("Notification email delivery failed", e);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      reference: dsar.id,
      message: "We received your request. The organization will respond within the legal timeframe.",
    },
    { status: 201 },
  );
}
