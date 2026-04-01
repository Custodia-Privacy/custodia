/**
 * Consent recording endpoint.
 * Logs user consent choices from the banner SDK.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliverPrivacyWebhook } from "@/lib/privacy-webhook";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("consent");

// Basic jurisdiction detection from country code
const GDPR_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "IS", "LI", "NO",
]);

function detectJurisdiction(country: string | null): string | null {
  if (!country) return null;
  const upper = country.toUpperCase();
  if (GDPR_COUNTRIES.has(upper)) return "gdpr";
  if (upper === "US") return "ccpa"; // Simplified — would check state for CCPA
  return null;
}

export async function POST(
  req: Request,
  props: { params: Promise<{ siteId: string }> },
) {
  const rawSiteId = (await props.params).siteId.replace(/\.js$/, "");
  const siteId = rawSiteId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (siteId.length < 10 || siteId.length > 64) {
    return NextResponse.json({ error: "Invalid siteId" }, { status: 400 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await checkRateLimit(`consent:${clientIp}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...rateLimitHeaders(rl), "Access-Control-Allow-Origin": "*" } },
    );
  }

  try {
    const body = await req.json();
    const { consent, action, visitorId, userAgent } = body;

    if (!consent || typeof consent !== "object") {
      return NextResponse.json({ error: "Invalid consent object" }, { status: 400 });
    }
    if (typeof action !== "string" || !["accept_all", "reject_all", "customize"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (typeof visitorId !== "string" || visitorId.length > 100) {
      return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
    }

    // Detect country from Cloudflare headers or X-Forwarded headers
    const country =
      req.headers.get("cf-ipcountry") ??
      req.headers.get("x-vercel-ip-country") ??
      null;

    const jurisdiction = detectJurisdiction(country);

    const log = await db.consentLog.create({
      data: {
        siteId,
        visitorId,
        ipCountry: country?.substring(0, 2) ?? null,
        jurisdiction,
        consentGiven: consent,
        action: action as any,
        userAgent: userAgent?.substring(0, 500) ?? null,
      },
    });

    const site = await db.site.findUnique({
      where: { id: siteId },
      select: {
        orgId: true,
        domain: true,
        privacyWebhookUrl: true,
        privacyWebhookSecret: true,
      },
    });
    if (site?.privacyWebhookUrl && site.privacyWebhookSecret) {
      void deliverPrivacyWebhook({
        url: site.privacyWebhookUrl,
        secret: site.privacyWebhookSecret,
        event: "consent.recorded",
        payload: {
          event: "consent.recorded",
          timestamp: new Date().toISOString(),
          orgId: site.orgId,
          siteId,
          siteDomain: site.domain,
          consentLogId: log.id,
          consent,
          action,
          jurisdiction,
          ipCountry: country?.substring(0, 2) ?? null,
        },
      });
    }

    return NextResponse.json({ ok: true }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    log.error("Consent logging failed", err);
    return NextResponse.json({ error: "Failed to log consent" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
