"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/trpc";
import { useElapsed, formatElapsed } from "@/hooks/use-elapsed";

const SEVERITY_STYLE: Record<string, { dot: string; label: string; badge: string }> = {
  critical: {
    dot: "bg-red-500",
    label: "Critical",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
  warning: {
    dot: "bg-amber-500",
    label: "Warning",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  info: {
    dot: "bg-blue-500",
    label: "Info",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
};

const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  cookie: { label: "Cookie", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" },
  tracker: { label: "Tracker", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" },
  script: { label: "Script", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400" },
  data_collection: { label: "Data Collection", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" },
  consent: { label: "Consent", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  policy: { label: "Policy", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  Analytics: { label: "Analytics", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" },
  Advertising: { label: "Advertising", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" },
  Functional: { label: "Functional", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400" },
  Performance: { label: "Performance", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
};

const MOCK_TRACKERS = [
  { name: "Google Analytics (GA4)", type: "Analytics", status: "warning", issue: "No consent before loading" },
  { name: "Meta Pixel", type: "Advertising", status: "critical", issue: "Tracks without consent" },
  { name: "Stripe.js", type: "Functional", status: "info", issue: "Properly categorized" },
  { name: "Hotjar", type: "Analytics", status: "warning", issue: "Session recording without disclosure" },
  { name: "Cloudflare", type: "Performance", status: "info", issue: "Essential service" },
];

function FindingRow({
  severity,
  title,
  subtitle,
  category,
}: {
  severity: string;
  title: string;
  subtitle: string;
  category: string;
}) {
  const sev = SEVERITY_STYLE[severity] ?? { dot: "bg-slate-400", label: severity, badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  const cat = CATEGORY_STYLE[category] ?? { label: category.replace(/_/g, " "), color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 text-left dark:border-slate-800">
      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sev.badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
        {sev.label}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.color}`}>
        {cat.label}
      </span>
    </div>
  );
}

export function Hero() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
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

  const elapsed = useElapsed(scan.isPending || isScanning);
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
            Built for small businesses
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-navy-950 sm:text-5xl lg:text-6xl dark:text-white">
            Privacy compliance
            <br />
            without the legal team
          </h1>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
            Custodia scans your website, tells you exactly what&apos;s wrong,
            and fixes it — cookie banners, privacy policies, data requests, all
            of it. No jargon, no lawyers, no headaches.{" "}
            <span className="font-semibold text-navy-700 dark:text-navy-300">From $29/mo.</span>
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
              Scanning {liveData?.domain || "your site"}…
              <span className="ml-1 font-mono tabular-nums">{formatElapsed(elapsed)}</span>
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
                          severity={f.severity}
                          title={f.title}
                          subtitle={f.description}
                          category={f.category}
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
                    <button
                      onClick={async () => {
                        const url = `${window.location.origin}/report/${scanId}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch {
                          // fallback: show the URL
                          window.prompt("Copy this link:", url);
                        }
                      }}
                      className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-navy-700 dark:hover:text-navy-400 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {copied ? "Link copied!" : "Share these results"}
                    </button>
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
                        severity={t.status}
                        title={t.name}
                        subtitle={t.issue}
                        category={t.type}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Social proof bar */}
        <div className="mx-auto mt-20 max-w-3xl">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Trusted by 500+ small businesses
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { label: "Sites scanned", value: "2,400+" },
              { label: "Trackers found", value: "18,000+" },
              { label: "Policies generated", value: "1,200+" },
              { label: "Data requests handled", value: "3,100+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-navy-950 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
