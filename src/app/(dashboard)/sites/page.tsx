import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sites — Custodia",
};

const sites = [
  {
    id: "site_1",
    url: "example-store.com",
    complianceScore: 72,
    status: "warning" as const,
    trackers: 12,
    lastScan: "March 20, 2026",
    issues: 3,
  },
];

function scoreColor(score: number) {
  if (score >= 90) return "text-compliant";
  if (score >= 70) return "text-warning";
  return "text-violation";
}

export default function SitesPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Your Sites
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage and monitor your websites for privacy compliance.
          </p>
        </div>
        <button className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
          + Add Site
        </button>
      </div>

      <div className="space-y-4">
        {sites.map((site) => (
          <Link
            key={site.id}
            href={`/sites/${site.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {site.url}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Last scan: {site.lastScan} &middot; {site.trackers} trackers
                  &middot; {site.issues} issues
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Compliance
                  </p>
                  <p
                    className={`text-2xl font-bold ${scoreColor(site.complianceScore)}`}
                  >
                    {site.complianceScore}%
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}

        {/* Empty state */}
        {sites.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No sites added yet. Add your first website to start scanning.
            </p>
            <button className="mt-4 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white">
              + Add Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
