/**
 * Signup API route — creates a new user with email/password.
 * By default, email must be verified (inbox link) before credentials sign-in.
 * If `RESEND_API_KEY` is unset or `SIGNUP_AUTO_VERIFY=true`, the account is verified immediately.
 */
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { getClientIp } from "@/lib/ip-check";

const log = createLogger("signup");

const COMMON_PASSWORDS = new Set([
  "password1234", "123456789012", "qwertyuiop12", "letmein12345",
  "admin1234567", "welcome12345", "password1!", "changeme1234",
]);

/** When true, set `emailVerifiedAt` immediately (empty prod / no Resend). See .env.example. */
function shouldVerifyEmailViaInboxOnly(): boolean {
  const forceInbox =
    process.env.SIGNUP_AUTO_VERIFY === "false" || process.env.SIGNUP_AUTO_VERIFY === "0";
  if (forceInbox) return true;
  const auto = process.env.SIGNUP_AUTO_VERIFY === "true" || process.env.SIGNUP_AUTO_VERIFY === "1";
  if (auto) {
    log.warn("SIGNUP_AUTO_VERIFY=true — marking new signups as email-verified without inbox step");
    return false;
  }
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  if (!hasResend) {
    log.warn("RESEND_API_KEY unset — marking new signups as email-verified (no verification email)");
    return false;
  }
  return true;
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128).refine(
    (pw) => !COMMON_PASSWORDS.has(pw.toLowerCase()),
    { message: "This password is too common. Please choose a stronger password." },
  ),
  name: z.string().min(1).max(255),
  orgName: z.string().min(1).max(255).optional(),
});

/** @returns true if Resend accepted the message */
async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn("RESEND_API_KEY not set — skipping verification email");
    return false;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Custodia <noreply@custodia-privacy.com>",
        to: [email],
        subject: "Verify your email — Custodia",
        html: `<p>Click the link below to verify your email address:</p>
        <p><a href="${verifyUrl}">Verify email</a></p>
        <p>This link expires in 24 hours.</p>
        <p style="color:#888;font-size:12px">If you didn't sign up for Custodia, ignore this email.</p>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log.error("Resend API error", { status: res.status, body: body.slice(0, 500) });
      return false;
    }
    return true;
  } catch (err) {
    log.error("Resend fetch failed", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rl = await checkRateLimit(`signup:${clientIp}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const input = signupSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing?.passwordHash) {
      return NextResponse.json(
        { success: true, needsVerification: true, canSignInNow: false },
        { status: 201 },
      );
    }

    const passwordHash = await hashPassword(input.password);
    const inboxOnly = shouldVerifyEmailViaInboxOnly();
    const rawToken = randomBytes(32).toString("hex");
    const verificationToken = createHash("sha256").update(rawToken).digest("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          passwordHash,
          ...(!inboxOnly ? { emailVerifiedAt: new Date() } : {}),
        },
      });
      if (inboxOnly) {
        await db.verificationToken.create({
          data: { identifier: input.email, token: verificationToken, expires: tokenExpiry },
        });
        const sent = await sendVerificationEmail(input.email, rawToken);
        if (!sent) {
          await db.user.update({
            where: { id: existing.id },
            data: { emailVerifiedAt: new Date() },
          });
          log.warn("Verification email failed — user marked verified (existing user path)");
          return NextResponse.json({
            success: true,
            userId: existing.id,
            needsVerification: false,
            canSignInNow: true,
            verificationEmailFailed: true,
          });
        }
      }
      return NextResponse.json({
        success: true,
        userId: existing.id,
        needsVerification: inboxOnly,
        canSignInNow: !inboxOnly,
      });
    }

    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        ...(!inboxOnly ? { emailVerifiedAt: new Date() } : {}),
      },
    });

    if (inboxOnly) {
      await db.verificationToken.create({
        data: { identifier: input.email, token: verificationToken, expires: tokenExpiry },
      });
    }

    const orgName = input.orgName || `${input.name}'s Organization`;
    const baseSlug = slugify(orgName);
    const slugExists = await db.organization.findUnique({ where: { slug: baseSlug } });
    const slug = slugExists ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    await db.organization.create({
      data: {
        name: orgName,
        slug,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    let verificationEmailFailed = false;
    if (inboxOnly) {
      const sent = await sendVerificationEmail(input.email, rawToken);
      if (!sent) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
        log.warn("Verification email failed — user marked verified (new user path)");
        verificationEmailFailed = true;
      }
    }

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        needsVerification: inboxOnly && !verificationEmailFailed,
        canSignInNow: !inboxOnly || verificationEmailFailed,
        ...(verificationEmailFailed ? { verificationEmailFailed: true } : {}),
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.flatten() }, { status: 400 });
    }
    log.error("Signup failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
