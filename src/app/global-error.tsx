"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Top-level React error boundary. Fires when a client-side render throws
 * above every other error boundary (including the root layout).
 *
 * Must be a client component and must render its own <html>/<body>.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            background: "#0b1020",
            color: "#e2e8f0",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
              Something went wrong
            </h1>
            <p style={{ opacity: 0.8, marginBottom: "1.5rem", lineHeight: 1.5 }}>
              An unexpected error occurred. Our team has been notified. Please
              try again, or return to the homepage.
            </p>
            {/* Intentional <a>, not <Link>: this is the top-level error
                boundary and the Next router context may be the thing that
                broke. A hard navigation forces a full reload and resets
                state, which is what we want during recovery. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "0.625rem 1rem",
                borderRadius: 8,
                background: "#3b82f6",
                color: "white",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
