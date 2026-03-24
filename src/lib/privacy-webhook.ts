/**
 * Outbound privacy webhooks (consent + preference center).
 * Payloads are JSON; verify with HMAC-SHA256 of the raw body using the stored secret.
 */
import { createHmac, randomBytes } from "node:crypto";

const WEBHOOK_TIMEOUT_MS = 15_000;

export function generatePrivacyWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function signPrivacyWebhookPayload(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Production: https only. Non-production: http allowed for local testing. */
export function isAllowedPrivacyWebhookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return true;
    if (process.env.NODE_ENV !== "production" && u.protocol === "http:") return true;
    return false;
  } catch {
    return false;
  }
}

export async function deliverPrivacyWebhook(params: {
  url: string;
  secret: string;
  event: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const rawBody = JSON.stringify(params.payload);
  const sig = signPrivacyWebhookPayload(params.secret, rawBody);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(params.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Custodia-Event": params.event,
        "X-Custodia-Signature": `sha256=${sig}`,
      },
      body: rawBody,
      signal: ac.signal,
    });
    if (!res.ok) {
      console.warn(
        `[privacy-webhook] ${params.event} HTTP ${res.status} for ${params.url.slice(0, 80)}…`,
      );
    }
  } catch (e) {
    console.warn(`[privacy-webhook] ${params.event} delivery failed:`, e);
  } finally {
    clearTimeout(t);
  }
}
