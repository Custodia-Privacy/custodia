/**
 * Next.js instrumentation hook. Runs once per server/edge process start.
 * Routes to the correct Sentry config based on runtime.
 *
 * MUST live in src/ because Custodia uses the src/ directory structure.
 * Next.js only looks for instrumentation.ts in src/ when src/ is in use.
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Surface server-side request errors (route handlers, server components, etc.)
// to Sentry. No-op if DSN isn't set.
export const onRequestError = Sentry.captureRequestError;
