/**
 * Security event logging.
 *
 * Centralized audit trail for security-relevant events.
 * Events are logged as structured JSON via the logger (which redacts PII).
 *
 * In production, these should be forwarded to a SIEM (Datadog, Splunk, etc.)
 * via log aggregation from the container stdout.
 */
import { createLogger } from "./logger";

const log = createLogger("security");

export type SecurityEvent =
  | "login.success"
  | "login.failed"
  | "login.rate_limited"
  | "signup.success"
  | "signup.rate_limited"
  | "api_key.auth_failed"
  | "api_key.scope_denied"
  | "api_key.rate_limited"
  | "password_reset.requested"
  | "password_reset.completed"
  | "email_verification.success"
  | "email_verification.failed"
  | "email_verification.rate_limited"
  | "csrf.invalid"
  | "ssrf.blocked"
  | "rbac.denied"
  | "webhook.auth_failed";

interface EventMeta {
  ip?: string;
  userId?: string;
  orgId?: string;
  reason?: string;
  [key: string]: unknown;
}

export function logSecurityEvent(event: SecurityEvent, meta: EventMeta = {}): void {
  const entry = { event, ...meta };
  const level = event.includes("failed") || event.includes("denied") || event.includes("blocked")
    ? "warn"
    : "info";
  log[level](JSON.stringify(entry));
}
