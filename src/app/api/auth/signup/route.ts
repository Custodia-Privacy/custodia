/**
 * Signup API route — creates a new user with email/password.
 * After signup, the user should sign in via NextAuth credentials provider.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  orgName: z.string().min(1).max(255).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = signupSchema.parse(body);

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(input.password);

    if (existing) {
      // User was invited (placeholder) — update with password
      await db.user.update({
        where: { id: existing.id },
        data: { name: input.name, passwordHash, emailVerifiedAt: new Date() },
      });
      return NextResponse.json({ success: true, userId: existing.id });
    }

    // Create new user
    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    // Create a default organization
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

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.flatten() }, { status: 400 });
    }
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
