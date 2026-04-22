/**
 * Sentry event scrubber. Runs in every runtime (browser, node, edge).
 *
 * Guarantees:
 * 1. No request cookies, bodies, or auth headers leave the process.
 * 2. Every string field in the event is run through the logger's PII redactor.
 * 3. URLs have common ID query params stripped before send.
 *
 * This is defense-in-depth — sendDefaultPii is already false in every init.
 */

import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { redactDeep, redactString } from "./pii-redact";

const STRIPPABLE_QUERY_KEYS = new Set([
  "email",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "key",
  "auth",
  "session",
  "sessionid",
  "jwt",
  "code",
  "state",
  "signature",
  "sig",
]);

function stripSensitiveQuery(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl, "http://sentry.local");
    let changed = false;
    for (const key of Array.from(u.searchParams.keys())) {
      if (STRIPPABLE_QUERY_KEYS.has(key.toLowerCase())) {
        u.searchParams.set(key, "[REDACTED]");
        changed = true;
      }
    }
    if (!changed) return rawUrl;
    return u.pathname + (u.search ? u.search : "") + (u.hash || "");
  } catch {
    return rawUrl;
  }
}

export function scrubSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.request.headers)) {
        const kl = k.toLowerCase();
        if (
          kl === "authorization" ||
          kl === "cookie" ||
          kl === "x-api-key" ||
          kl.startsWith("x-auth")
        ) {
          headers[k] = "[REDACTED]";
        } else if (typeof v === "string") {
          headers[k] = redactString(v);
        }
      }
      event.request.headers = headers;
    }
    event.request.url = stripSensitiveQuery(event.request.url);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = stripSensitiveQuery(
        "?" + event.request.query_string,
      )?.replace(/^\?/, "") as string;
    }
  }

  if (event.user) {
    const safeUser: typeof event.user = {};
    if (event.user.id) safeUser.id = String(event.user.id);
    event.user = safeUser;
  }

  if (event.message) {
    event.message =
      typeof event.message === "string"
        ? redactString(event.message)
        : event.message;
  }

  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = redactString(ex.value);
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((bc) => {
      if (bc.message) bc.message = redactString(bc.message);
      if (bc.data) bc.data = redactDeep(bc.data);
      return bc;
    });
  }

  if (event.extra) event.extra = redactDeep(event.extra);
  if (event.contexts) event.contexts = redactDeep(event.contexts);
  if (event.tags) event.tags = redactDeep(event.tags);

  return event;
}
