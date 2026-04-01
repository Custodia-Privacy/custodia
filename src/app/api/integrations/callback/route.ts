/**
 * Nango OAuth callback handler.
 *
 * After the user completes the OAuth flow in Nango, Nango redirects here.
 * We mark the integration as connected and redirect back to the dashboard.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("nango-callback");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const orgId = url.searchParams.get("orgId");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!provider || !orgId) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=invalid_callback`);
  }

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
      `${appUrl}/settings/integrations?connected=${provider}`,
    );
  } catch (e) {
    log.error("Callback processing failed", e);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=callback_failed`,
    );
  }
}
