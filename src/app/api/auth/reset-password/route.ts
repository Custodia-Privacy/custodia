/**
 * Password reset flow.
 *
 * POST /api/auth/reset-password
 *   - Body: { email } → sends reset email with hashed token
 *   - Body: { token, password } → resets the password
 *
 * Tokens are stored as SHA-256 hashes. Raw tokens are sent via email.
 * Always returns success to prevent email enumeration.
 */
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { getClientIp } from "@/lib/ip-check";

const log = createLogger("reset-password");

const requestSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(12).max(128),
});

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function sendResetEmail(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn("RESEND_API_KEY not set — skipping reset email");
    return;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Custodia <noreply@custodia-privacy.com>",
      to: [email],
      subject: "Reset your password — Custodia",
      html: `<p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This link expires in 1 hour.</p>
        <p style="color:#888;font-size:12px">If you didn't request a password reset, ignore this email.</p>`,
    }),
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`reset-pw:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ success: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const resetParsed = resetSchema.safeParse(body);
  if (resetParsed.success) {
    const { token, password } = resetParsed.data;
    const tokenHash = hashToken(token);

    try {
      const record = await db.verificationToken.findUnique({ where: { token: tokenHash } });
      if (!record || record.expires < new Date()) {
        if (record) await db.verificationToken.delete({ where: { token: tokenHash } });
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      await db.user.update({
        where: { email: record.identifier },
        data: { passwordHash },
      });

      await db.verificationToken.delete({ where: { token: tokenHash } });
      log.info("Password reset completed");
      return NextResponse.json({ success: true });
    } catch (err) {
      log.error("Password reset failed", err);
      return NextResponse.json({ error: "Reset failed" }, { status: 500 });
    }
  }

  const requestParsed = requestSchema.safeParse(body);
  if (!requestParsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({
      where: { email: requestParsed.data.email.toLowerCase() },
    });

    if (user?.passwordHash) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);

      await db.verificationToken.create({
        data: {
          identifier: user.email!,
          token: tokenHash,
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await sendResetEmail(user.email!, rawToken);
    }
  } catch (err) {
    log.error("Reset request failed", err);
  }

  return NextResponse.json({ success: true });
}
