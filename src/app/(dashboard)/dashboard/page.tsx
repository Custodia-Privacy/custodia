"use client";

import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

function statusColor(status: string) {
  switch (status) {
    case "compliant":
      return "bg-compliant";
    case "warning":
      return "bg-warning";
    case "violation":
      return "bg-violation";
    default:
      return "bg-slate-400";
  }
}

export default function DashboardPage() {
  const { data, isLoading, error } = api.dashboard.overview.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, regulations, recentActivity, siteCount } = data;

  const statCards = [
    {
      label: "Compliance Score",
      value: stats.complianceScore != null ? `${stats.complianceScore}%` : "—",
      change: siteCount ? `Across ${siteCount} site(s)` : "Add a site to scan",
      positive: true,
      color:
        stats.complianceScore != null && stats.complianceScore >= 90
          ? "text-compliant"
          : stats.complianceScore != null && stats.complianceScore >= 70
            ? "text-warning"
            : "text-navy-600 dark:text-navy-400",
    },
    {
      label: "Trackers Found",
      value: String(stats.trackerCount),
      change: "Unresolved tracker findings",
      positive: stats.trackerCount === 0,
      color: "text-navy-600 dark:text-navy-400",
    },
    {
      label: "Open DSARs",
      value: String(stats.openDsars),
      change: "Awaiting fulfillment",
      positive: stats.openDsars === 0,
      color: "text-navy-600 dark:text-navy-400",
    },
    {
      label: "Policy Status",
      value: stats.policyStatus,
      change: stats.policySubtext,
      positive: stats.policyStatus === "Up to date",
      color: stats.policyStatus === "Up to date" ? "text-compliant" : "text-warning",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Compliance Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Overview of your privacy compliance status across all regulations. All metrics are read
          from your scans, findings, DSARs, and policies in the database.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p
              className={`mt-1 text-xs ${
                stat.positive ? "text-compliant" : "text-violation"
              }`}
            >
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Compliance by Regulation
          </h2>
          <div className="space-y-4">
            {regulations.map((reg) => (
              <div key={reg.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {reg.name}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {reg.score}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${statusColor(reg.status)}`}
                    style={{ width: `${reg.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No activity yet. Run a scan, create a DSAR, or trigger an agent — events will appear
              here.
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(item.type)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.action}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {formatRelativeTime(item.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
