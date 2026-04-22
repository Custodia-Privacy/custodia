/**
 * Sentry initialization — browser runtime.
 *
 * Next.js 15+ loads this file natively on every client bundle (replaces the
 * older `sentry.client.config.ts` pattern, which breaks under Turbopack).
 *
 * MUST live in src/ because Custodia uses the src/ directory structure.
 */

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // No PII, no session replay. Custodia is a privacy product; session replay
    // captures DOM state which includes anything users typed into forms.
    sendDefaultPii: false,
    integrations: [],

    beforeSend: scrubSentryEvent,

    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      "Non-Error promise rejection captured",
      /^Network request failed$/,
      /^Load failed$/,
      /extension\//i,
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
    ],
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
  });
}

// Capture App Router client-side navigation transitions as Sentry spans.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
