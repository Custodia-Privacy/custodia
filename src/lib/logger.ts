/**
 * Structured logger with automatic PII redaction.
 *
 * Redacts email addresses, phone numbers, and IP addresses from log output.
 * Use this instead of console.log/error/warn for any log that might contain user data.
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_RE = /\b\+?[1-9]\d{1,2}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

function redact(value: string): string {
  return value
    .replace(EMAIL_RE, "[EMAIL_REDACTED]")
    .replace(PHONE_RE, "[PHONE_REDACTED]")
    .replace(IP_RE, "[IP_REDACTED]");
}

function formatArgs(args: unknown[]): string[] {
  return args.map((arg) => {
    if (typeof arg === "string") return redact(arg);
    if (arg instanceof Error) return redact(arg.message);
    if (typeof arg === "object" && arg !== null) {
      try {
        return redact(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  });
}

type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, context: string, ...args: unknown[]): void {
  const ts = new Date().toISOString();
  const sanitized = formatArgs(args);
  const message = sanitized.join(" ");
  const line = JSON.stringify({ ts, level, context, message });

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") console.debug(line);
      break;
    default:
      console.log(line);
  }
}

/**
 * Create a scoped logger instance.
 *
 * Usage:
 *   const log = createLogger("nurture-emails");
 *   log.info("Job started", { count: 42 });
 *   log.error("Delivery failed", error);
 */
export function createLogger(context: string) {
  return {
    info: (...args: unknown[]) => emit("info", context, ...args),
    warn: (...args: unknown[]) => emit("warn", context, ...args),
    error: (...args: unknown[]) => emit("error", context, ...args),
    debug: (...args: unknown[]) => emit("debug", context, ...args),
  };
}
