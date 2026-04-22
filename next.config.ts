import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
};

const hasSentryDsn = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
);

// Wrap whenever a DSN is present so the client SDK gets injected into the
// bundle. Source map upload is a separate concern and only runs when
// SENTRY_AUTH_TOKEN + org + project are all set — otherwise Sentry emits a
// build-time warning (suppressed locally via `silent: !CI`).
export default hasSentryDsn
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Tunnel client Sentry requests through our own route to bypass ad-blockers.
      tunnelRoute: "/monitoring",
      webpack: {
        automaticVercelMonitors: false,
      },
    })
  : nextConfig;
