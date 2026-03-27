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

export function ScanPageClient() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const scan = api.scan.quick.useMutation();
  const scanId = scan.data?.scanId;

  const result = api.scan.quickResult.useQuery(
    { scanId: scanId! },
    {
      enabled: !!scanId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "completed" || status === "failed") return false;
        return 2000;
      },
    },
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-4 py-1.5 text-sm text-navy-700 dark:border-navy-800 dark:bg-navy-950/50 dark:text-navy-300 mb-4">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Free · No signup required
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl dark:text-white">
            Website Privacy Scanner
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Find every tracker, consent issue, and policy gap — in under 60 seconds.
          </p>
        </div>

        {/* Scan form */}
        <form
          className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
          onSubmit={(e) => { e.preventDefault(); handleScan(); }}
        >
          <input
            type="text"
            placeholder="Enter your website URL (e.g. example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-3.5 text-sm outline-none placeholder:text-slate-400 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={scan.isPending || isScanning}
            className="bg-navy-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-900 disabled:opacity-60 dark:bg-navy-600"
          >
            {scan.isPending ? "Submitting…" : isScanning ? "Scanning…" : "Scan Now"}
          </button>
        </form>

        {/* Scanning indicator */}
        {isScanning && (
          <div className="mt-3 text-center text-sm text-navy-600 dark:text-navy-400">
            Scanning {liveData?.domain || "your site"}… <span className="font-mono">{formatElapsed(elapsed)}</span>
          </div>
        )}
        {isFailed && (
          <p className="mt-3 text-center text-sm text-red-600">{liveData?.errorMessage || "Scan failed. Please try again."}</p>
        )}
        {scan.error && (
          <p className="mt-3 text-center text-sm text-red-600">{scan.error.message}</p>
        )}
        {!scanId && (
          <p className="mt-2 text-center text-xs text-slate-400">No credit card required. Results in under 60 seconds.</p>
        )}

        {/* Results */}
        {isDone && liveData && (
          <div
            className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow dark:border-slate-700 dark:bg-slate-900"
            ref={resultsRef}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Scan Results — {liveData.domain}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${issueCount === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {issueCount === 0 ? "No issues found" : `${issueCount} issue${issueCount > 1 ? "s" : ""} found`}
              </span>
            </div>
            <div className="p-5 space-y-3">
              {liveData.findings.length === 0
                ? <p className="text-sm text-slate-500">No trackers or issues detected.</p>
                : liveData.findings.map((f) => (
                    <FindingRow key={f.id} severity={f.severity} title={f.title} subtitle={f.description} category={f.category} />
                  ))
              }
            </div>
            <div className="px-5 pb-5">
              <div className="rounded-lg border border-navy-200 bg-navy-50 p-4 dark:border-navy-800 dark:bg-navy-950/40">
                <p className="text-sm font-medium text-navy-900 dark:text-navy-200">Want the full picture?</p>
                <p className="mt-1 text-xs text-navy-600 dark:text-navy-400">Sign up free to get weekly monitoring, auto-generated policies, and a compliance dashboard.</p>
                <a href="/signup" className="mt-3 inline-block rounded-lg bg-navy-950 px-4 py-2 text-xs font-medium text-white hover:bg-navy-900">
                  Get Started Free →
                </a>
                <button
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/report/${scanId}`;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // fallback: show the URL
                      window.prompt("Copy this link:", shareUrl);
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
            </div>
          </div>
        )}

        {/* What we scan */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-navy-950 dark:text-white text-center mb-8">What the scanner checks</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: "🍪", title: "Cookies & Trackers", body: "Every cookie and tracking script — including third-party analytics, ad pixels, and session recorders you may not know are there." },
              { icon: "✅", title: "Consent Compliance", body: "Whether your banner blocks scripts before consent and whether it respects Global Privacy Control (GPC) signals as required by law." },
              { icon: "📄", title: "Privacy Policy Gaps", body: "Missing disclosures and mismatches between your policy and what's actually running on your site — the most common compliance gap." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-navy-950 dark:text-white mb-6">How it works</h2>
          <div className="space-y-5">
            {[
              { step: "1", title: "Enter your URL", body: "Paste any website address. The scanner visits your site and inspects everything that loads on the page." },
              { step: "2", title: "Get your report", body: "In under 60 seconds, see every tracker, cookie, and compliance issue — with severity ratings and plain-English explanations." },
              { step: "3", title: "Fix it with Custodia", body: "Sign up to set up a compliant consent banner, generate a privacy policy from your real data practices, and automate DSAR handling." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white text-xs font-bold dark:bg-navy-600">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/signup" className="inline-block rounded-xl bg-navy-950 px-8 py-3 text-sm font-semibold text-white hover:bg-navy-900 dark:bg-navy-600">
              Get Started Free →
            </a>
            <p className="mt-2 text-xs text-slate-400">Plans from $29/mo · Free scan always available</p>
          </div>
        </div>

      </div>
    </main>
  );
}
