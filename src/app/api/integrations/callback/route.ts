/**
 * Nango OAuth callback handler.
 *
 * After the user completes the OAuth flow in Nango, Nango redirects here.
 * We verify the HMAC-signed state parameter to prevent forgery,
 * mark the integration as connected, and redirect back to the dashboard.
 */
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("nango-callback");

function getCallbackSecret(): string {
  return process.env.NANGO_CALLBACK_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
}

export function signCallbackState(orgId: string, provider: string): string {
  const payload = `${orgId}:${provider}`;
  const sig = createHmac("sha256", getCallbackSecret()).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

function verifyCallbackState(state: string): { orgId: string; provider: string } | null {
  const parts = state.split(":");
  if (parts.length !== 3) return null;

  const [orgId, provider, sig] = parts;
  const expected = createHmac("sha256", getCallbackSecret())
    .update(`${orgId}:${provider}`)
    .digest("hex");

  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }

  return { orgId, provider };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!state) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=invalid_callback`);
  }

  const verified = verifyCallbackState(state);
  if (!verified) {
    log.warn("Callback with invalid or tampered state parameter");
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=invalid_callback`);
  }

  const { orgId, provider } = verified;

  try {
    await db.integration.update({
      where: {
        orgId_provider: { orgId, provider: provider as "salesforce" | "hubspot" | "shopify" },
      },
      data: {
        status: "connected",
        lastSyncError: null,
      },
    });

    log.info(`Integration connected: ${provider} for org ${orgId.slice(0, 8)}...`);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?connected=${encodeURIComponent(provider)}`,
    );
  } catch (e) {
    log.error("Callback processing failed", e);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=callback_failed`,
    );
  }
}
