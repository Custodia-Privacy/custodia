/**
 * Signup API route — creates a new user with email/password.
 * After signup, the user must verify their email before signing in.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("signup");

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  orgName: z.string().min(1).max(255).optional(),
});

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn("RESEND_API_KEY not set — skipping verification email");
    return;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await fetch("https://api.resend.com/emails", {
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
}

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit(`signup:${clientIp}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const input = signupSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { name: input.name, passwordHash },
      });
      await db.verificationToken.create({
        data: { identifier: input.email, token: verificationToken, expires: tokenExpiry },
      });
      await sendVerificationEmail(input.email, verificationToken);
      return NextResponse.json({ success: true, userId: existing.id, needsVerification: true });
    }

    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
    });

    await db.verificationToken.create({
      data: { identifier: input.email, token: verificationToken, expires: tokenExpiry },
    });

    const orgName = input.orgName ?? `${input.name}'s Organization`;
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

    await sendVerificationEmail(input.email, verificationToken);

    return NextResponse.json(
      { success: true, userId: user.id, needsVerification: true },
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
