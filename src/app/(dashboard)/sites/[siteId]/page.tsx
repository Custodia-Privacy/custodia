"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/trpc";

const quickActions = [
  { label: "View Scans", href: "scans", description: "See scan history and findings" },
  { label: "Cookie Banner", href: "banner", description: "Configure your consent banner" },
  { label: "Privacy Policy", href: "policy", description: "View and edit your policy" },
];

function severityDot(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-violation";
    case "warning":
      return "bg-warning";
    case "info":
      return "bg-slate-400";
    case "ok":
      return "bg-compliant";
    default:
      return "bg-slate-400";
  }
}

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const utils = api.useUtils();

  const { data: site, isLoading: siteLoading, error: siteError } = api.site.get.useQuery(
    { siteId },
    { enabled: !!siteId },
  );

  const [consentWebhookUrl, setConsentWebhookUrl] = useState("");
  useEffect(() => {
    if (site?.privacyWebhookUrl) setConsentWebhookUrl(site.privacyWebhookUrl);
    else setConsentWebhookUrl("");
  }, [site?.privacyWebhookUrl]);

  const updateSite = api.site.update.useMutation({
    onSuccess: async (data) => {
      await utils.site.get.invalidate({ siteId });
      if (data.revealSecretOnce) {
        window.alert(
          `Copy your signing secret now (shown once only). Verify requests using HMAC-SHA256 of the raw JSON body.\n\n${data.revealSecretOnce}`,
        );
      }
    },
  });

  const rotateSecret = api.site.rotatePrivacyWebhookSecret.useMutation({
    onSuccess: async (data) => {
      await utils.site.get.invalidate({ siteId });
      if (data.revealSecretOnce) {
        window.alert(`New signing secret (copy now):\n\n${data.revealSecretOnce}`);
      }
    },
  });

  const { data: findings, isLoading: findingsLoading } = api.scan.recentFindings.useQuery(
    { siteId, limit: 15 },
    { enabled: !!siteId && !!site },
  );

  if (siteLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading site…</p>
      </div>
    );
  }

  if (siteError || !site) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/sites" className="text-sm text-navy-600 hover:underline dark:text-navy-400">
          ← Back to Sites
        </Link>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {siteError?.message ?? "Site not found"}
        </p>
      </div>
    );
  }

  const latest = site.latestScan;
  const scores = latest?.complianceScores as { overall?: number } | null | undefined;
  const score = site.complianceScore ?? scores?.overall ?? null;
  const trackerCount =
    findings?.filter((f) => f.category === "tracker" && !f.resolvedAt).length ?? 0;
  const lastScanLabel = site.lastScannedAt
    ? new Date(site.lastScannedAt).toLocaleDateString()
    : latest?.completedAt
      ? new Date(latest.completedAt).toLocaleDateString()
      : "—";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <Link
          href="/sites"
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Sites
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{site.domain}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {site.name} · Open findings: {site._count.findings}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Compliance Score</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {score != null ? `${score}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Trackers (unresolved)</p>
          <p className="mt-1 text-3xl font-bold text-navy-600 dark:text-navy-400">{trackerCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Last Scan</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{lastScanLabel}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={`/sites/${siteId}/${action.href}`}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
          >
            <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300">{action.label}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
          Consent webhook
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          When visitors save banner choices, Custodia can POST a signed JSON payload to your URL. Header{" "}
          <code className="text-[10px]">X-Custodia-Signature: sha256=&lt;hex&gt;</code> matches HMAC-SHA256 of
          the raw body with your secret. Event name in <code className="text-[10px]">X-Custodia-Event</code>.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-slate-500">HTTPS URL</label>
            <input
              type="url"
              value={consentWebhookUrl}
              onChange={(e) => setConsentWebhookUrl(e.target.value)}
              placeholder="https://api.example.com/custodia/consent"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={updateSite.isPending}
              onClick={() =>
                updateSite.mutate({
                  siteId,
                  privacyWebhookUrl: consentWebhookUrl.trim() || null,
                })
              }
              className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
            >
              {updateSite.isPending ? "Saving…" : "Save URL"}
            </button>
            {site.privacyWebhookSecretConfigured && site.privacyWebhookUrl ? (
              <button
                type="button"
                disabled={rotateSecret.isPending}
                onClick={() => rotateSecret.mutate({ siteId })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                {rotateSecret.isPending ? "…" : "Rotate secret"}
              </button>
            ) : null}
          </div>
        </div>
        {updateSite.error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{updateSite.error.message}</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
          Recent findings
        </h2>
        {findingsLoading ? (
          <p className="text-sm text-slate-500">Loading findings…</p>
        ) : !findings?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No findings yet. Complete a scan (scanner worker + Redis) to populate this list.
          </p>
        ) : (
          <div className="space-y-3">
            {findings.map((finding) => (
              <div
                key={finding.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDot(finding.severity)}`} />
                  <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {finding.title}
                  </span>
                </div>
                <span className="ml-2 shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {finding.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
