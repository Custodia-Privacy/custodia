/**
 * Email verification endpoint.
 *
 * GET  — renders a "click to verify" page (prevents link pre-fetchers consuming the token).
 * POST — actually verifies the token, marks the user as verified, redirects to login.
 *
 * Tokens are stored as SHA-256 hashes; the raw token arrives from the email link.
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip-check";

const log = createLogger("verify-email");

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token || token.length < 32) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);
  }

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verify Email — Custodia</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
.card{background:#fff;border-radius:12px;padding:48px;box-shadow:0 1px 3px rgba(0,0,0,0.1);text-align:center;max-width:400px}
h1{font-size:24px;margin:0 0 12px}p{color:#64748b;margin:0 0 24px}
button{background:#2563eb;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:16px;cursor:pointer;font-weight:500}
button:hover{background:#1d4ed8}</style></head>
<body><div class="card"><h1>Verify your email</h1><p>Click the button below to complete verification.</p>
<form method="POST" action="${appUrl}/api/auth/verify-email">
<input type="hidden" name="token" value="${token.replace(/"/g, '&quot;')}">
<button type="submit">Verify Email</button>
</form></div></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

export async function POST(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`verify-email:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.redirect(`${appUrl}/login?error=rate_limited`);
  }

  let token: string | null = null;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    token = formData.get("token") as string | null;
  } else {
    try {
      const body = await req.json();
      token = body?.token ?? null;
    } catch { /* empty */ }
  }

  if (!token || token.length < 32) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);
  }

  try {
    const tokenHash = hashToken(token);
    const record = await db.verificationToken.findUnique({ where: { token: tokenHash } });

    if (!record) {
      return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token: tokenHash } });
      return NextResponse.redirect(`${appUrl}/login?error=token_expired`);
    }

    await db.user.update({
      where: { email: record.identifier },
      data: { emailVerifiedAt: new Date() },
    });

    await db.verificationToken.delete({ where: { token: tokenHash } });

    log.info("Email verified successfully");
    return NextResponse.redirect(`${appUrl}/login?verified=true`);
  } catch (err) {
    log.error("Verification failed", err);
    return NextResponse.redirect(`${appUrl}/login?error=verification_failed`);
  }
}
