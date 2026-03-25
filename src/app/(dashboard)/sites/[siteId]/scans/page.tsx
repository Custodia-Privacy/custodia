"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/trpc";

function scanStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return { text: "Completed", className: "text-compliant", icon: null };
    case "failed":
      return { text: "Failed", className: "text-red-600 dark:text-red-400", icon: null };
    case "running":
      return { text: "Running", className: "text-navy-600 dark:text-navy-400", icon: "pulse" as const };
    case "queued":
      return { text: "Queued", className: "text-amber-600 dark:text-amber-400", icon: "pulse" as const };
    default:
      return { text: status, className: "text-slate-500", icon: null };
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function ScansPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const utils = api.useUtils();

  const { data, isLoading, error } = api.scan.list.useQuery(
    { siteId, limit: 50 },
    {
      enabled: !!siteId,
      refetchInterval: (query) => {
        const items = query.state.data?.items;
        if (items?.some((s) => s.status === "queued" || s.status === "running")) return 3000;
        return false;
      },
    },
  );

  const trigger = api.scan.trigger.useMutation({
    onSuccess: () => {
      void utils.scan.list.invalidate({ siteId, limit: 50 });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading scans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href={`/sites/${siteId}`}
          className="text-sm text-navy-600 hover:underline dark:text-navy-400"
        >
          ← Back to site
        </Link>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error.message}</p>
      </div>
    );
  }

  const rows = data?.items ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/sites/${siteId}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scan history</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Each row is a record in <code className="text-xs">scans</code> for this site.
          </p>
        </div>
        <button
          type="button"
          disabled={trigger.isPending}
          onClick={() => trigger.mutate({ siteId, type: "full" })}
          className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600 dark:hover:bg-navy-500"
        >
          {trigger.isPending ? "Starting…" : "Run new scan"}
        </button>
      </div>

      {trigger.error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{trigger.error.message}</p>
      )}

      {rows.some((s) => s.status === "queued" || s.status === "running") && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-navy-200 bg-navy-50/50 px-4 py-3 dark:border-navy-900 dark:bg-navy-950/30">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-navy-500" />
          <p className="text-sm text-navy-700 dark:text-navy-300">
            A scan is currently in progress. This page refreshes automatically.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  When
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Trackers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Findings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No scans yet. Click the scan button to analyze this site for privacy issues.
                  </td>
                </tr>
              ) : (
                rows.map((scan) => {
                  const summary = scan.summary as { trackersFound?: number; issuesFound?: number } | null;
                  const trackers =
                    typeof summary?.trackersFound === "number" ? summary.trackersFound : "—";
                  const issues =
                    typeof summary?.issuesFound === "number"
                      ? summary.issuesFound
                      : scan._count?.findings ?? "—";
                  const when = scan.completedAt ?? scan.startedAt ?? scan.createdAt;
                  const { text, className, icon } = scanStatusLabel(scan.status);
                  return (
                    <tr
                      key={scan.id}
                      className="border-b border-slate-50 last:border-0 dark:border-slate-800/80"
                    >
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {new Date(when).toLocaleString()}
                        {(scan.status === "queued" || scan.status === "running") && (
                          <span className="ml-2 text-xs text-slate-400">
                            started {timeAgo(scan.createdAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-slate-600 dark:text-slate-300">
                        {scan.scanType.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{trackers}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{issues}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${className}`}>
                        <span className="inline-flex items-center gap-1.5">
                          {icon === "pulse" && (
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                          )}
                          {text}
                        </span>
                        {scan.status === "queued" && (
                          <p className="mt-0.5 text-xs font-normal text-slate-400">
                            Usually completes in 30–60s
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
