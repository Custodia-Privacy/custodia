/**
 * Outbound privacy webhooks (consent + preference center).
 * Payloads are JSON; verify with HMAC-SHA256 of the raw body using the stored secret.
 */
import { createHmac, randomBytes } from "node:crypto";
import { createLogger } from "./logger";

const log = createLogger("privacy-webhook");
const WEBHOOK_TIMEOUT_MS = 15_000;

export function generatePrivacyWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function signPrivacyWebhookPayload(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "169.254.169.254",
  "metadata.google.internal",
]);

/** Production: https only. Non-production: http allowed for local testing. Blocks SSRF targets. */
export function isAllowedPrivacyWebhookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (process.env.NODE_ENV === "production") {
      if (u.protocol !== "https:") return false;
      if (BLOCKED_HOSTS.has(u.hostname)) return false;
      if (u.hostname.endsWith(".internal") || u.hostname.endsWith(".local")) return false;
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(u.hostname)) return false;
    } else {
      if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    }
    return true;
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
      log.warn(`${params.event} HTTP ${res.status}`);
    }
  } catch (e) {
    log.warn(`${params.event} delivery failed`, e);
  } finally {
    clearTimeout(t);
  }
}
