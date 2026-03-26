/**
 * Consent recording endpoint.
 * Logs user consent choices from the banner SDK.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliverPrivacyWebhook } from "@/lib/privacy-webhook";

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
  const siteId = (await props.params).siteId.replace(/\.js$/, "");

  try {
    const body = await req.json();
    const { consent, action, visitorId, userAgent } = body;

    if (!consent || !action || !visitorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
          visitorId,
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
    console.error("Consent logging error:", err);
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
