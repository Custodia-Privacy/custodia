import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scan History — Custodia",
};

const scans = [
  {
    id: "scan_5",
    date: "March 20, 2026 — 3:42 PM",
    trackers: 12,
    issues: 3,
    status: "warning",
  },
  {
    id: "scan_4",
    date: "March 13, 2026 — 3:00 PM",
    trackers: 14,
    issues: 5,
    status: "warning",
  },
  {
    id: "scan_3",
    date: "March 6, 2026 — 3:00 PM",
    trackers: 14,
    issues: 5,
    status: "warning",
  },
  {
    id: "scan_2",
    date: "February 27, 2026 — 3:00 PM",
    trackers: 10,
    issues: 2,
    status: "warning",
  },
  {
    id: "scan_1",
    date: "February 20, 2026 — 11:15 AM",
    trackers: 10,
    issues: 4,
    status: "warning",
  },
];

export default async function ScansPage(props: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await props.params;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href={`/sites/${siteId}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Scan History
          </h1>
        </div>
        <button className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
          Run New Scan
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Trackers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scans.map((scan) => (
                <tr
                  key={scan.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {scan.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {scan.trackers}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {scan.issues}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-block rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-medium capitalize text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      {scan.issues} issues
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
