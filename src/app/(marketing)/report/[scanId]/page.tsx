"use client";

import { useParams } from "next/navigation";
import { api } from "@/lib/trpc";

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

export default function ReportPage() {
  const params = useParams();
  const scanId = params.scanId as string;

  const result = api.scan.quickResult.useQuery({ scanId });
  const data = result.data;

  if (result.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading report…</p>
      </div>
    );
  }

  if (!data || data.status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Scan report not found.</p>
      </div>
    );
  }

  if (data.status !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Scan in progress, check back in a moment.</p>
      </div>
    );
  }

  const issueCount = data.findings.filter(
    (f) => f.severity === "critical" || f.severity === "warning"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Privacy Scan Report</p>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">{data.domain}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {issueCount === 0
              ? "No compliance issues detected."
              : `${issueCount} issue${issueCount > 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {data.findings.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No trackers or issues detected.</p>
          ) : (
            data.findings.map((f) => (
              <FindingRow
                key={f.id}
                severity={f.severity}
                title={f.title}
                subtitle={f.description}
                category={f.category}
              />
            ))
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-navy-200 bg-navy-50 p-6 text-center dark:border-navy-800 dark:bg-navy-950/40">
          <p className="text-sm font-semibold text-navy-900 dark:text-navy-200">Want to fix these issues?</p>
          <p className="mt-1 text-xs text-navy-600 dark:text-navy-400">
            Custodia handles consent banners, privacy policies, and DSAR management from $29/mo.
          </p>
          <a
            href="/signup"
            className="mt-4 inline-block rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-900"
          >
            Get Started Free →
          </a>
          <p className="mt-3 text-xs text-navy-500">
            Or <a href="/scan" className="underline">scan your own website</a> — free, no signup required
          </p>
        </div>
      </div>
    </main>
  );
}
