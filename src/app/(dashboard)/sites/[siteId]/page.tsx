import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Site Detail — Custodia",
};

const quickActions = [
  {
    label: "View Scans",
    href: "scans",
    description: "See scan history and findings",
  },
  {
    label: "Cookie Banner",
    href: "banner",
    description: "Configure your consent banner",
  },
  {
    label: "Privacy Policy",
    href: "policy",
    description: "View and edit your policy",
  },
];

const latestFindings = [
  { name: "Google Analytics (GA4)", category: "Analytics", status: "warning" },
  { name: "Meta Pixel", category: "Advertising", status: "violation" },
  { name: "Stripe.js", category: "Functional", status: "compliant" },
  { name: "Hotjar", category: "Analytics", status: "warning" },
  { name: "Cloudflare CDN", category: "Performance", status: "compliant" },
];

function statusDot(status: string) {
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

export default async function SiteDetailPage(props: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await props.params;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <Link
          href="/sites"
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
          Back to Sites
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          example-store.com
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Site ID: {siteId}
        </p>
      </div>

      {/* Score card */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compliance Score
          </p>
          <p className="mt-1 text-3xl font-bold text-warning">72%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trackers
          </p>
          <p className="mt-1 text-3xl font-bold text-navy-600 dark:text-navy-400">
            12
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last Scan
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            March 20, 2026
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={`/sites/${siteId}/${action.href}`}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
          >
            <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300">
              {action.label}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {action.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Latest findings */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
          Latest Scan Findings
        </h2>
        <div className="space-y-3">
          {latestFindings.map((finding) => (
            <div
              key={finding.name}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${statusDot(finding.status)}`}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {finding.name}
                </span>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {finding.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
