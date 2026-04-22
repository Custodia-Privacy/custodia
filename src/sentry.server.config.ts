/**
 * Sentry initialization — Node server runtime.
 * Loaded from src/instrumentation.ts when NEXT_RUNTIME === "nodejs".
 */

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    debug: process.env.SENTRY_DEBUG === "true",

    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,

    ignoreErrors: [
      // Next.js internal non-errors
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
    ],
  });
}
