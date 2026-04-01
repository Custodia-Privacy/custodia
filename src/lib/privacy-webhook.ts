/**
 * Outbound privacy webhooks (consent + preference center).
 * Payloads are JSON; verify with HMAC-SHA256 of the raw body using the stored secret.
 */
import { createHmac, randomBytes } from "node:crypto";
import { createLogger } from "./logger";
import { isSafeUrl } from "./ip-check";

const log = createLogger("privacy-webhook");
const WEBHOOK_TIMEOUT_MS = 15_000;

export function generatePrivacyWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function signPrivacyWebhookPayload(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Validates webhook URLs against SSRF (IPv4/IPv6, private ranges, metadata). */
export function isAllowedPrivacyWebhookUrl(url: string): boolean {
  const isProd = process.env.NODE_ENV === "production";
  return isSafeUrl(url, isProd);
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
      log.warn(`${params.event} HTTP ${res.status}`);
    }
  } catch (e) {
    log.warn(`${params.event} delivery failed`, e);
  } finally {
    clearTimeout(t);
  }
}
