import { NextResponse } from "next/server";
import { z } from "zod";

const WELCOME_EMAIL_HTML = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Custodia</span>
            <span style="color:#64748b;font-size:14px;margin-left:8px;">Privacy Compliance</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 24px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.6;">Welcome to the Custodia privacy compliance blog.</p>
            <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">You'll get weekly updates on GDPR, CCPA, and privacy law changes that matter for small businesses — practical, no jargon.</p>

            <p style="margin:0 0 16px;color:#1e293b;font-size:15px;font-weight:600;">Start with these guides:</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                <a href="https://app.custodia-privacy.com/blog/gdpr-compliance-small-business" style="color:#2563eb;text-decoration:none;font-size:14px;line-height:1.5;">GDPR Compliance for Small Business: The 2026 Guide →</a>
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                <a href="https://app.custodia-privacy.com/blog/website-privacy-audit-checklist" style="color:#2563eb;text-decoration:none;font-size:14px;line-height:1.5;">Website Privacy Audit Checklist: 30 Things to Verify →</a>
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                <a href="https://app.custodia-privacy.com/blog/dsar-guide-small-business" style="color:#2563eb;text-decoration:none;font-size:14px;line-height:1.5;">Data Subject Access Requests: A Small Business Survival Guide →</a>
              </td></tr>
              <tr><td style="padding:8px 0;">
                <a href="https://app.custodia-privacy.com/blog/google-consent-mode-v2" style="color:#2563eb;text-decoration:none;font-size:14px;line-height:1.5;">Google Consent Mode v2: What It Is and Why It&apos;s Mandatory →</a>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.7;">One more thing: the free privacy scanner shows every tracker and compliance gap on your site in 60 seconds — no signup required → <a href="https://app.custodia-privacy.com/scan" style="color:#2563eb;text-decoration:none;">app.custodia-privacy.com/scan</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 32px;">
            <p style="margin:0;color:#1e293b;font-size:14px;">— The Custodia Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              You're receiving this because you subscribed to the Custodia privacy blog.<br>
              <a href="mailto:hello@custodia-privacy.com?subject=Unsubscribe" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`.trim();

async function sendWelcomeEmail(email: string, apiKey: string): Promise<void> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Custodia <hello@custodia-privacy.com>",
        to: [email],
        subject: "You're subscribed to Custodia's privacy blog",
        html: WELCOME_EMAIL_HTML,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[blog-subscribe] welcome email error", res.status);
    }
  } catch (err) {
    console.error("[blog-subscribe] welcome email delivery failed");
  }
}

const bodySchema = z.object({
  email: z.string().email(),
  /** Honeypot — must be empty */
  website: z.string().max(200).optional(),
});

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

// Simple in-memory rate limit: 3 attempts per IP per 5 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, website } = parsed.data;

  // Honeypot check — bots fill this field
  if (website && website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[blog-subscribe] RESEND_API_KEY not set");
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Resend audience for blog subscribers (General audience)
  const RESEND_AUDIENCE_ID = "8a5e6694-1334-4c5c-b851-e5cd358b5fd1";

  let isNewContact = false;

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          unsubscribed: false,
        }),
      },
    );
    // 200/201 = created, 409 = already exists — both are fine
    if (!res.ok && res.status !== 409) {
      const body = await res.text();
      console.error("[blog-subscribe] Resend error", res.status, body);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    // Only send the welcome email for genuinely new contacts
    isNewContact = res.status !== 409;
  } catch (err) {
    console.error("[blog-subscribe] fetch error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Fire-and-forget welcome email — do not await so the response is not blocked
  if (isNewContact) {
    void sendWelcomeEmail(
      email.trim().toLowerCase(),
      process.env.RESEND_API_KEY!,
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
