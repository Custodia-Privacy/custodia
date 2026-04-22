/**
 * Shared PII redaction for log output AND Sentry events.
 *
 * Kept in sync (manually) with the inline regexes in src/lib/logger.ts.
 * New users of this module: Sentry beforeSend scrubber. Logger will be
 * migrated here in a later cleanup pass.
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_RE = /\b\+?[1-9]\d{1,2}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6_RE = /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const CC_RE = /\b(?:\d[ -]*?){13,19}\b/g;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const API_KEY_RE = /\b(?:sk-ant-api|cust_|re_|pf_live_|sk-)[A-Za-z0-9_-]{8,}\b/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/g;

export function redactString(value: string): string {
  return value
    .replace(EMAIL_RE, "[EMAIL_REDACTED]")
    .replace(SSN_RE, "[SSN_REDACTED]")
    .replace(CC_RE, "[CC_REDACTED]")
    .replace(JWT_RE, "[JWT_REDACTED]")
    .replace(API_KEY_RE, "[APIKEY_REDACTED]")
    .replace(BEARER_RE, "Bearer [TOKEN_REDACTED]")
    .replace(PHONE_RE, "[PHONE_REDACTED]")
    .replace(IPV4_RE, "[IP_REDACTED]")
    .replace(IPV6_RE, "[IPV6_REDACTED]");
}

/**
 * Recursively walk a JSON-like object and redact string leaves.
 * Cycle-safe via a WeakSet. Caps depth at 8 to avoid pathological payloads.
 */
export function redactDeep<T>(input: T, seen = new WeakSet<object>(), depth = 0): T {
  if (depth > 8) return input;
  if (typeof input === "string") return redactString(input) as unknown as T;
  if (input === null || typeof input !== "object") return input;
  if (seen.has(input as object)) return input;
  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map((v) => redactDeep(v, seen, depth + 1)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    out[k] = redactDeep(v, seen, depth + 1);
  }
  return out as unknown as T;
}
