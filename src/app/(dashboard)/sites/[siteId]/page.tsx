"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

type Tab = "overview" | "scans" | "banner" | "policy";
type FindingWithResolved = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  recommendation: string | null;
  resolvedAt: Date | string | null;
  pageUrl: string | null;
  details: Record<string, unknown> | null;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "scans", label: "Scan Results" },
  { id: "banner", label: "Banner" },
  { id: "policy", label: "Policy" },
];

function severityColor(s: string) {
  switch (s) {
    case "critical": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800";
    case "warning": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800";
    case "info": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800";
    default: return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  }
}

function severityLabel(s: string) {
  switch (s) { case "critical": return "Critical"; case "warning": return "Warning"; case "info": return "Info"; default: return s; }
}

function categoryColor(c: string) {
  switch (c) {
    case "cookie": return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400";
    case "tracker": return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400";
    case "script": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400";
    case "data_collection": return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
    case "consent": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400";
    case "policy": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
}

function categoryLabel(c: string) {
  switch (c) {
    case "cookie": return "Cookie";
    case "tracker": return "Tracker";
    case "script": return "Script";
    case "data_collection": return "Data Collection";
    case "consent": return "Consent";
    case "policy": return "Policy";
    default: return c.replace(/_/g, " ");
  }
}

function scoreColor(score: number | null) {
  if (score == null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function SiteDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const activeTab = (searchParams.get("tab") as Tab) || "overview";
  const setTab = useCallback((tab: Tab) => {
    router.replace(`/sites/${siteId}?tab=${tab}`, { scroll: false });
  }, [router, siteId]);

  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const { data: site, isLoading: siteLoading, error: siteError } = api.site.get.useQuery({ siteId }, { enabled: !!siteId });
  const { data: findings } = api.scan.recentFindings.useQuery({ siteId, limit: 50, showResolved }, { enabled: !!siteId && activeTab === "overview" });
  const { data: progress } = api.scan.progress.useQuery({ siteId }, { enabled: !!siteId && activeTab === "overview" });
  const { data: scansData } = api.scan.list.useQuery(
    { siteId, limit: 50 },
    {
      enabled: !!siteId && activeTab === "scans",
      refetchInterval: (query) => {
        const items = query.state.data?.items;
        if (items?.some((s) => s.status === "queued" || s.status === "running")) return 3000;
        return false;
      },
    },
  );
  const { data: policies } = api.policy.list.useQuery({ siteId }, { enabled: !!siteId && activeTab === "policy" });
  const { data: banner } = api.banner.get.useQuery({ siteId }, { enabled: !!siteId && activeTab === "banner" });

  const utils = api.useUtils();
  const triggerScan = api.scan.trigger.useMutation({
    onSuccess: () => { void utils.scan.list.invalidate({ siteId }); },
  });
  const deleteSite = api.site.delete.useMutation({
    onSuccess: () => { void utils.site.list.invalidate(); router.push("/sites"); },
  });

  if (siteLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-6 w-48 rounded bg-slate-200 animate-pulse dark:bg-slate-800" />
      </div>
    );
  }

  if (siteError || !site) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/sites" className="text-sm text-navy-600 hover:underline dark:text-navy-400">Back to Sites</Link>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{siteError?.message ?? "Site not found"}</p>
      </div>
    );
  }

  const latest = site.latestScan;
  const scores = latest?.complianceScores as { overall?: number } | null | undefined;
  const score = site.complianceScore ?? scores?.overall ?? null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/sites" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Sites
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{site.domain}</h1>
          {score != null && (
            <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}/100</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {site._count.findings} open finding{site._count.findings !== 1 ? "s" : ""}
          {latest?.completedAt && ` · Last scan ${formatRelativeTime(latest.completedAt)}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-navy-600 text-navy-700 dark:border-navy-400 dark:text-navy-300"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">Risk Score</p>
              <p className={`mt-1 text-2xl font-bold ${scoreColor(score)}`}>{score ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">Open Findings</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{progress?.open ?? site._count.findings}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{progress?.resolved ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">Banner</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {site.banner?.publishedAt ? "Published" : site.banner ? "Draft" : "Not set up"}
              </p>
            </div>
          </div>

          {/* Resolution progress */}
          {progress && progress.total > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Compliance Progress</h2>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{progress.percentage}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    progress.percentage >= 80 ? "bg-emerald-500" : progress.percentage >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {progress.resolved} of {progress.total} finding{progress.total !== 1 ? "s" : ""} resolved
              </p>
            </div>
          )}

          {/* Policy gap auto-fix */}
          {findings && findings.some((f) => f.category === "policy" && f.title.startsWith("Privacy policy gap:") && !f.resolvedAt) && (
            <PolicyGapFixBanner findings={findings as FindingWithResolved[]} siteId={siteId} />
          )}

          {/* Recent findings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {showResolved ? "All Findings" : "Open Findings"}
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-navy-600 focus:ring-navy-500 dark:border-slate-600"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Show resolved</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTab("scans")}
                  className="text-xs text-navy-600 hover:underline dark:text-navy-400"
                >
                  View all scans
                </button>
              </div>
            </div>
            {!findings?.length ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {showResolved ? "No findings yet. Run a scan to detect privacy issues." : "All findings resolved! Great work."}
              </p>
            ) : (
              <div className="space-y-2">
                {findings.slice(0, 20).map((f) => (
                  <FindingRow key={f.id} finding={f as FindingWithResolved} siteId={siteId} />
                ))}
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900 dark:bg-red-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete this site</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/60">
                  Permanently remove this site and all its scans, findings, policies, and banner configuration.
                </p>
              </div>
              <button
                type="button"
                disabled={deleteSite.isPending}
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${site.domain}? This cannot be undone.`)) {
                    deleteSite.mutate({ siteId });
                  }
                }}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                {deleteSite.isPending ? "Deleting..." : "Delete Site"}
              </button>
            </div>
            {deleteSite.error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{deleteSite.error.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Scan Results */}
      {activeTab === "scans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Scan history for this site</p>
            <button
              type="button"
              disabled={triggerScan.isPending}
              onClick={() => triggerScan.mutate({ siteId, type: "full" })}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
            >
              {triggerScan.isPending ? "Starting..." : "Run New Scan"}
            </button>
          </div>
          {triggerScan.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{triggerScan.error.message}</p>
          )}

          {!scansData?.items?.length ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">No scans yet. Click &quot;Run New Scan&quot; to analyze this site.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scansData.items.map((scan) => (
                <ScanRow
                  key={scan.id}
                  scan={scan}
                  siteId={siteId}
                  isExpanded={expandedScan === scan.id}
                  onToggle={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Banner */}
      {activeTab === "banner" && (
        <div>
          {!banner ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No consent banner configured yet. Run a scan first to auto-detect cookies and trackers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Consent Banner</h2>
                  <span className={`text-xs font-medium ${banner.publishedAt ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {banner.publishedAt ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Configure your cookie consent banner appearance, copy, and consent categories.
                  {banner.publishedAt && ` Last published ${new Date(banner.publishedAt).toLocaleDateString()}.`}
                </p>
                <Link
                  href={`/sites/${siteId}/banner`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700"
                >
                  Open Banner Editor
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Embed Code</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Add this script tag to your website to show the consent banner.
                </p>
                <code className="block rounded-lg bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 break-all">
                  {`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/api/banner/${siteId}.js" async></script>`}
                </code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Policies */}
      {activeTab === "policy" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {policies?.length ? `${policies.length} ${policies.length === 1 ? "policy" : "policies"}` : "No policies yet"}
            </p>
            <Link
              href={`/sites/${siteId}/policy`}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700"
            >
              {policies?.length ? "Manage Policies" : "Create a Policy"}
            </Link>
          </div>

          {policies && policies.length > 0 ? (
            <div className="space-y-2">
              {policies.map((p) => (
                <Link
                  key={p.id}
                  href={`/sites/${siteId}/policy?type=${p.type}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      v{p.version} · Updated {new Date(p.updatedAt).toLocaleDateString()}
                      {p.publishedAt && <span className="ml-2 text-emerald-600 dark:text-emerald-400">Published</span>}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Create privacy policies, cookie policies, terms of service, and more using our AI-guided builder.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Policy gap auto-fix banner ---------- */
function PolicyGapFixBanner({ findings, siteId }: { findings: FindingWithResolved[]; siteId: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const fixGaps = api.policy.fixGaps.useMutation({
    onSuccess: () => {
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });

  const policyGaps = findings.filter(
    (f) => f.category === "policy" && f.title.startsWith("Privacy policy gap:") && !f.resolvedAt,
  );

  if (policyGaps.length === 0) return null;

  const gaps = policyGaps.map((f) => {
    const details = f.details as { gapTopic?: string } | null;
    return {
      topic: details?.gapTopic ?? f.title.replace("Privacy policy gap: ", ""),
      description: f.description,
      recommendation: f.recommendation ?? "Address this gap in your privacy policy.",
    };
  });

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {policyGaps.length} privacy policy gap{policyGaps.length !== 1 ? "s" : ""} detected
            </p>
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
            Your privacy policy is missing coverage for: {gaps.map((g) => g.topic).join(", ")}.
            Custodia can automatically update your policy to address {policyGaps.length === 1 ? "this gap" : "these gaps"}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={fixGaps.isPending}
            onClick={() => fixGaps.mutate({ siteId, gaps })}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {fixGaps.isPending ? "Updating Policy..." : "Auto-fix Policy"}
          </button>
        </div>
      </div>
      {fixGaps.isSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Policy updated and gaps resolved!{" "}
            <button
              type="button"
              onClick={() => router.push(`/sites/${siteId}?tab=policy`)}
              className="font-medium underline hover:no-underline"
            >
              Review the updated policy
            </button>
          </p>
        </div>
      )}
      {fixGaps.error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{fixGaps.error.message}</p>
      )}
    </div>
  );
}

/* ---------- AI Summary block ---------- */
function ScanSummaryBlock({ summary }: { summary: unknown }) {
  const s = summary as { overview?: string; keyFindings?: string[]; complianceRisks?: string[]; recommendations?: string[] } | null;
  if (!s || typeof s !== "object") return null;

  // Handle case where summary is a plain string (quick scans store a different shape)
  if (typeof summary === "string") {
    return (
      <div className="px-5 py-3 bg-navy-50/30 dark:bg-navy-950/20">
        <p className="text-[10px] font-medium uppercase tracking-wider text-navy-600 dark:text-navy-400 mb-1">AI Summary</p>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{summary}</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 bg-navy-50/30 dark:bg-navy-950/20 space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-navy-600 dark:text-navy-400">AI Summary</p>
      {s.overview && (
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{s.overview}</p>
      )}
      {s.keyFindings && s.keyFindings.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Key Findings</p>
          <ul className="space-y-0.5">
            {s.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.complianceRisks && s.complianceRisks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1">Compliance Risks</p>
          <ul className="space-y-0.5">
            {s.complianceRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-600/80 dark:text-red-400/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.recommendations && s.recommendations.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Recommendations</p>
          <ul className="space-y-0.5">
            {s.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Finding row with resolve/unresolve ---------- */
function FindingRow({ finding, siteId }: { finding: FindingWithResolved; siteId: string }) {
  const utils = api.useUtils();
  const resolveMutation = api.finding.resolve.useMutation({
    onSuccess: () => {
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });
  const unresolveMutation = api.finding.unresolve.useMutation({
    onSuccess: () => {
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });
  const fixGap = api.policy.fixGaps.useMutation({
    onSuccess: () => {
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });

  const isResolved = !!finding.resolvedAt;
  const isPending = resolveMutation.isPending || unresolveMutation.isPending;
  const isPolicyGap = finding.category === "policy" && finding.title.startsWith("Privacy policy gap:");

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
      isResolved
        ? "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10"
        : "border-slate-100 dark:border-slate-800"
    }`}>
      <span className={`mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        isResolved ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : severityColor(finding.severity)
      }`}>
        {isResolved ? "Resolved" : severityLabel(finding.severity)}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${isResolved ? "text-slate-500 line-through dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
          {finding.title}
        </p>
        {finding.description && !isResolved && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{finding.description}</p>
        )}
        {finding.recommendation && !isResolved && (
          <p className="mt-1 text-[11px] text-navy-600 dark:text-navy-400">
            <span className="font-medium">Action:</span> {finding.recommendation}
          </p>
        )}
        {fixGap.error && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{fixGap.error.message}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColor(finding.category)}`}>
          {categoryLabel(finding.category)}
        </span>
        {isPolicyGap && !isResolved && (
          <button
            type="button"
            disabled={fixGap.isPending}
            onClick={() => {
              const details = finding.details as { gapTopic?: string } | null;
              fixGap.mutate({
                siteId,
                gaps: [{
                  topic: details?.gapTopic ?? finding.title.replace("Privacy policy gap: ", ""),
                  description: finding.description,
                  recommendation: finding.recommendation ?? "Address this gap in your privacy policy.",
                }],
              });
            }}
            title="Auto-fix this gap in the privacy policy"
            className="rounded-lg border border-amber-200 px-2.5 py-1 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            {fixGap.isPending ? "Fixing..." : "Fix in Policy"}
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (isResolved) {
              unresolveMutation.mutate({ findingId: finding.id });
            } else {
              resolveMutation.mutate({ findingId: finding.id });
            }
          }}
          title={isResolved ? "Reopen this finding" : "Mark as resolved"}
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-50 ${
            isResolved
              ? "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          }`}
        >
          {isPending ? "..." : isResolved ? "Reopen" : "Resolve"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Expandable scan row ---------- */
function ScanRow({ scan, siteId, isExpanded, onToggle }: {
  scan: { id: string; status: string; scanType: string; summary: unknown; completedAt: Date | null; startedAt: Date | null; createdAt: Date; _count?: { findings: number } };
  siteId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: detail, isLoading } = api.scan.get.useQuery(
    { scanId: scan.id },
    { enabled: isExpanded },
  );

  const summary = scan.summary as { trackersFound?: number; issuesFound?: number } | null;
  const when = scan.completedAt ?? scan.startedAt ?? scan.createdAt;
  const isRunning = scan.status === "queued" || scan.status === "running";
  const findingsCount = scan._count?.findings ?? 0;
  const scores = detail?.complianceScores as { overall?: number } | null | undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {new Date(when).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 capitalize dark:bg-slate-800 dark:text-slate-400">
              {scan.scanType}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {summary?.trackersFound != null ? `${summary.trackersFound} trackers` : ""}
            {summary?.issuesFound != null ? ` · ${summary.issuesFound} issues` : ""}
            {!summary ? `${findingsCount} finding${findingsCount !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && <span className="h-2 w-2 animate-pulse rounded-full bg-navy-500" />}
          <span className={`text-xs font-medium ${
            scan.status === "completed" ? "text-emerald-600 dark:text-emerald-400"
              : scan.status === "failed" ? "text-red-600 dark:text-red-400"
              : "text-navy-600 dark:text-navy-400"
          }`}>
            {scan.status === "completed" ? "Completed" : scan.status === "failed" ? "Failed" : scan.status === "running" ? "Running" : "Queued"}
          </span>
          <svg className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : !detail?.findings?.length ? (
            <p className="px-5 py-6 text-center text-xs text-slate-400">No findings in this scan.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Summary bar */}
              {scores?.overall != null && (
                <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Score</span>
                    <span className={`text-sm font-bold ${scoreColor(scores.overall)}`}>{scores.overall}/100</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Findings</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{detail.findings.length}</span>
                  </div>
                  {detail.pagesCrawled != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Pages crawled</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{detail.pagesCrawled}</span>
                    </div>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {detail.summary && (
                <ScanSummaryBlock summary={detail.summary} />
              )}

              {/* Findings list */}
              {detail.findings.map((f) => (
                <ScanFindingRow key={f.id} finding={f as FindingWithResolved} siteId={siteId} scanId={scan.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Finding row inside expanded scan ---------- */
function ScanFindingRow({ finding, siteId, scanId }: { finding: FindingWithResolved; siteId: string; scanId: string }) {
  const utils = api.useUtils();
  const resolveMutation = api.finding.resolve.useMutation({
    onSuccess: () => {
      void utils.scan.get.invalidate({ scanId });
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });
  const unresolveMutation = api.finding.unresolve.useMutation({
    onSuccess: () => {
      void utils.scan.get.invalidate({ scanId });
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });
  const fixGap = api.policy.fixGaps.useMutation({
    onSuccess: () => {
      void utils.scan.get.invalidate({ scanId });
      void utils.scan.recentFindings.invalidate({ siteId });
      void utils.scan.progress.invalidate({ siteId });
      void utils.site.get.invalidate({ siteId });
    },
  });

  const isResolved = !!finding.resolvedAt;
  const isPending = resolveMutation.isPending || unresolveMutation.isPending;
  const isPolicyGap = finding.category === "policy" && finding.title.startsWith("Privacy policy gap:");

  return (
    <div className={`flex items-start gap-3 px-5 py-3 ${isResolved ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""}`}>
      <span className={`mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        isResolved ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : severityColor(finding.severity)
      }`}>
        {isResolved ? "Resolved" : severityLabel(finding.severity)}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${isResolved ? "text-slate-500 line-through dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
          {finding.title}
        </p>
        {finding.description && !isResolved && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{finding.description}</p>
        )}
        {finding.recommendation && !isResolved && (
          <p className="mt-1 text-[11px] text-navy-600 dark:text-navy-400">
            <span className="font-medium">Fix:</span> {finding.recommendation}
          </p>
        )}
        {fixGap.error && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{fixGap.error.message}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColor(finding.category)}`}>
          {categoryLabel(finding.category)}
        </span>
        {isPolicyGap && !isResolved && (
          <button
            type="button"
            disabled={fixGap.isPending}
            onClick={() => {
              const details = finding.details as { gapTopic?: string } | null;
              fixGap.mutate({
                siteId,
                gaps: [{
                  topic: details?.gapTopic ?? finding.title.replace("Privacy policy gap: ", ""),
                  description: finding.description,
                  recommendation: finding.recommendation ?? "Address this gap in your privacy policy.",
                }],
              });
            }}
            title="Auto-fix this gap in the privacy policy"
            className="rounded-lg border border-amber-200 px-2.5 py-1 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            {fixGap.isPending ? "Fixing..." : "Fix in Policy"}
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (isResolved) {
              unresolveMutation.mutate({ findingId: finding.id });
            } else {
              resolveMutation.mutate({ findingId: finding.id });
            }
          }}
          title={isResolved ? "Reopen this finding" : "Mark as resolved"}
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-50 ${
            isResolved
              ? "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          }`}
        >
          {isPending ? "..." : isResolved ? "Reopen" : "Resolve"}
        </button>
      </div>
    </div>
  );
}
