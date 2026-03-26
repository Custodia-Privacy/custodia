"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/trpc";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-violation",
  warning: "bg-warning",
  info: "bg-blue-400",
  ok: "bg-compliant",
};

const MOCK_TRACKERS = [
  { name: "Google Analytics (GA4)", type: "Analytics", status: "warning", issue: "No consent before loading" },
  { name: "Meta Pixel", type: "Advertising", status: "violation", issue: "Tracks without consent" },
  { name: "Stripe.js", type: "Functional", status: "compliant", issue: "Properly categorized" },
  { name: "Hotjar", type: "Analytics", status: "warning", issue: "Session recording without disclosure" },
  { name: "Cloudflare", type: "Performance", status: "compliant", issue: "Essential service" },
];

function FindingRow({ dot, title, subtitle, badge }: { dot: string; title: string; subtitle: string; badge: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 text-left dark:border-slate-800">
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {badge}
      </span>
    </div>
  );
}

export function Hero() {
  const [url, setUrl] = useState("");
  const scan = api.scan.quick.useMutation();
  const scanId = scan.data?.scanId;

  const result = api.scan.quickResult.useQuery(
    { scanId: scanId! },
    { enabled: !!scanId, refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    }},
  );

  const liveData = result.data;
  const isScanning = !!scanId && (!liveData || liveData.status === "queued" || liveData.status === "running");
  const isDone = liveData?.status === "completed";
  const isFailed = liveData?.status === "failed";

  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isDone && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isDone]);

  function handleScan() {
    const raw = url.trim();
    if (!raw) return;
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    scan.mutate({ url: normalized });
  }

  const issueCount = liveData?.findings.filter((f) => f.severity === "critical" || f.severity === "warning").length ?? 0;

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
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
            Your team of Privacy AI Agents
          </h1>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
            Custodia deploys AI agents that scan your site, build your compliance
            stack, and keep you compliant — automatically. Full GDPR, CCPA, and
            global privacy law coverage starting at{" "}
            <span className="font-semibold text-navy-700 dark:text-navy-300">$29/mo</span>.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <form
              className="flex w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              onSubmit={(e) => { e.preventDefault(); handleScan(); }}
            >
              <input
                type="text"
                placeholder="Enter your website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={scan.isPending || isScanning}
                className="bg-navy-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-900 disabled:opacity-60 dark:bg-navy-600 dark:hover:bg-navy-500"
              >
                {scan.isPending ? "Submitting…" : isScanning ? "Scanning…" : "Free Scan"}
              </button>
            </form>
          </div>

          {isScanning && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-50 px-4 py-2 text-sm text-navy-700 dark:bg-navy-900/40 dark:text-navy-300">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning {liveData?.domain || "your site"}… This usually takes under 60 seconds.
            </div>
          )}
          {isFailed && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              Scan failed: {liveData?.errorMessage || "An error occurred. Please try again."}
            </p>
          )}
          {scan.error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{scan.error.message}</p>
          )}
          {!scanId && (
            <p className="mt-3 text-xs text-slate-400">
              No credit card required. Get your privacy report in under 60 seconds.
            </p>
          )}
        </div>

        {/* Live scan results or demo mockup */}
        <div className="mx-auto mt-16 max-w-4xl" ref={resultsRef}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
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

            <div className="p-6">
              {isDone && liveData ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Scan Results — {liveData.domain}
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      issueCount === 0
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {issueCount === 0 ? "No issues" : `${issueCount} issue${issueCount > 1 ? "s" : ""} found`}
                    </span>
                  </div>
                  {liveData.findings.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No trackers or issues detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {liveData.findings.map((f) => (
                        <FindingRow
                          key={f.id}
                          dot={SEVERITY_DOT[f.severity] || "bg-slate-400"}
                          title={f.title}
                          subtitle={f.description}
                          badge={f.category.replace("_", " ")}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-6 rounded-lg border border-navy-200 bg-navy-50 p-4 text-left dark:border-navy-800 dark:bg-navy-950/40">
                    <p className="text-sm font-medium text-navy-900 dark:text-navy-200">Want the full picture?</p>
                    <p className="mt-1 text-xs text-navy-600 dark:text-navy-400">
                      Sign up for a free account to get weekly monitoring, auto-generated policies, and a compliance dashboard.
                    </p>
                    <a href="/signup" className="mt-3 inline-block rounded-lg bg-navy-950 px-4 py-2 text-xs font-medium text-white hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
                      Get Started Free
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Scan Results — example-store.com
                    </h3>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      3 issues found
                    </span>
                  </div>
                  <div className="space-y-3">
                    {MOCK_TRACKERS.map((t) => (
                      <FindingRow
                        key={t.name}
                        dot={t.status === "compliant" ? "bg-compliant" : t.status === "warning" ? "bg-warning" : "bg-violation"}
                        title={t.name}
                        subtitle={t.issue}
                        badge={t.type}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
