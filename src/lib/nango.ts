/**
 * Nango client for OAuth connection management.
 *
 * Nango handles the OAuth dance, token storage, and automatic refresh
 * for all third-party integrations (Salesforce, HubSpot, Shopify).
 *
 * Self-hosted Nango instance is expected at NANGO_HOST.
 * Cloud Nango can be used by setting NANGO_HOST to https://api.nango.dev
 *
 * Env vars:
 *   NANGO_SECRET_KEY — server-side secret key from Nango dashboard
 *   NANGO_HOST       — URL of the Nango server (default: http://localhost:3003)
 */
import { Nango } from "@nangohq/node";

const globalForNango = globalThis as unknown as { nango: Nango | undefined };

export function getNango(): Nango {
  if (!globalForNango.nango) {
    const secretKey = process.env.NANGO_SECRET_KEY;
    if (!secretKey) {
      throw new Error("NANGO_SECRET_KEY is required for integration features");
    }
    globalForNango.nango = new Nango({
      secretKey,
      host: process.env.NANGO_HOST ?? "http://localhost:3003",
    });
  }
  return globalForNango.nango;
}

/**
 * Nango integration IDs — must match the integrations configured in the Nango dashboard.
 */
export const NANGO_INTEGRATIONS = {
  salesforce: "salesforce",
  hubspot: "hubspot",
  shopify: "shopify",
} as const;

export type NangoProvider = keyof typeof NANGO_INTEGRATIONS;

/**
 * Build a unique Nango connection ID for an org + provider.
 */
export function nangoConnectionId(orgId: string, provider: NangoProvider): string {
  return `custodia:${orgId}:${provider}`;
}
