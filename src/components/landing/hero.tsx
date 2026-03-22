"use client";

import { useState } from "react";

export function Hero() {
  const [email, setEmail] = useState("");

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-navy-100/50 blur-3xl dark:bg-navy-950/50" />
      </div>

      <div className="mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-4 py-1.5 text-sm text-navy-700 dark:border-navy-800 dark:bg-navy-950/50 dark:text-navy-300">
            <span className="inline-block h-2 w-2 rounded-full bg-compliant animate-pulse" />
            AI-powered privacy compliance
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-navy-950 sm:text-5xl lg:text-6xl dark:text-white">
            Privacy compliance for businesses that can&apos;t afford a legal
            team
          </h1>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
            AI-powered. Actually affordable. Custodia scans your site, builds
            your compliance stack, and keeps you compliant — automatically. Full
            GDPR, CCPA, and state privacy law coverage from{" "}
            <span className="font-semibold text-navy-700 dark:text-navy-300">
              $29/mo
            </span>
            .
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="flex w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <input
                type="email"
                placeholder="Enter your website URL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400 dark:bg-slate-900 dark:text-white"
              />
              <button className="bg-navy-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
                Free Scan
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            No credit card required. Get your privacy report in under 60
            seconds.
          </p>
        </div>

        {/* Scanner demo mockup */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                custodia-privacy.com/scan
              </div>
            </div>

            {/* Scanner content */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Scan Results — example-store.com
                </h3>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  3 issues found
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: "Google Analytics (GA4)",
                    type: "Analytics",
                    status: "warning",
                    issue: "No consent before loading",
                  },
                  {
                    name: "Meta Pixel",
                    type: "Advertising",
                    status: "violation",
                    issue: "Tracks without consent",
                  },
                  {
                    name: "Stripe.js",
                    type: "Functional",
                    status: "compliant",
                    issue: "Properly categorized",
                  },
                  {
                    name: "Hotjar",
                    type: "Analytics",
                    status: "warning",
                    issue: "Session recording without disclosure",
                  },
                  {
                    name: "Cloudflare",
                    type: "Performance",
                    status: "compliant",
                    issue: "Essential service",
                  },
                ].map((tracker) => (
                  <div
                    key={tracker.name}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          tracker.status === "compliant"
                            ? "bg-compliant"
                            : tracker.status === "warning"
                              ? "bg-warning"
                              : "bg-violation"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {tracker.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tracker.issue}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {tracker.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
