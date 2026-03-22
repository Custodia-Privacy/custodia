import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Custodia",
};

const stats = [
  {
    label: "Compliance Score",
    value: "72%",
    change: "+5%",
    positive: true,
    color: "text-warning",
  },
  {
    label: "Trackers Found",
    value: "12",
    change: "-2",
    positive: true,
    color: "text-navy-600 dark:text-navy-400",
  },
  {
    label: "Open DSARs",
    value: "3",
    change: "+1",
    positive: false,
    color: "text-navy-600 dark:text-navy-400",
  },
  {
    label: "Policy Status",
    value: "Up to date",
    change: "Updated 2d ago",
    positive: true,
    color: "text-compliant",
  },
];

const regulations = [
  { name: "GDPR", score: 78, status: "warning" as const },
  { name: "CCPA / CPRA", score: 85, status: "warning" as const },
  { name: "VCDPA", score: 92, status: "compliant" as const },
  { name: "CPA", score: 90, status: "compliant" as const },
  { name: "CTDPA", score: 88, status: "compliant" as const },
];

const recentActivity = [
  {
    action: "New tracker detected",
    detail: "TikTok Pixel found on /checkout",
    time: "2 hours ago",
    type: "violation",
  },
  {
    action: "DSAR completed",
    detail: "Deletion request #47 fulfilled",
    time: "5 hours ago",
    type: "compliant",
  },
  {
    action: "Policy auto-updated",
    detail: "Cookie policy updated after scan",
    time: "1 day ago",
    type: "info",
  },
  {
    action: "Weekly scan completed",
    detail: "12 trackers, 3 issues found",
    time: "2 days ago",
    type: "warning",
  },
];

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
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Compliance Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Overview of your privacy compliance status across all regulations.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
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
        {/* Regulation scores */}
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

        {/* Recent activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Recent Activity
          </h2>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.detail}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
