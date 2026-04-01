/**
 * Email verification endpoint.
 * Validates the token sent during signup, marks the user as verified,
 * then redirects to the login page.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("verify-email");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token || token.length < 32) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);
  }

  try {
    const record = await db.verificationToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(`${appUrl}/login?error=token_expired`);
    }

    await db.user.update({
      where: { email: record.identifier },
      data: { emailVerifiedAt: new Date() },
    });

    await db.verificationToken.delete({ where: { token } });

    log.info("Email verified successfully");
    return NextResponse.redirect(`${appUrl}/login?verified=true`);
  } catch (err) {
    log.error("Verification failed", err);
    return NextResponse.redirect(`${appUrl}/login?error=verification_failed`);
  }
}
