"use client";

import Link from "next/link";
import { api } from "@/lib/trpc";

export default function InventoryPage() {
  const { data: integrations, isLoading } = api.inventory.listIntegrationsForScan.useQuery();
  const utils = api.useUtils();
  const triggerScan = api.inventory.triggerScan.useMutation({
    onSuccess: () => {
      void utils.inventory.listScanRuns.invalidate();
      void utils.inventory.listAssets.invalidate();
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Data Inventory</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Connect integrations, run PII scans (OpenAI Privacy Filter taxonomy via the PII engine), and review
            findings. Retention policies and deletion receipts live under Policies and Audit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/inventory/findings"
            className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Findings
          </Link>
          <Link
            href="/inventory/policies"
            className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Policies
          </Link>
          <Link
            href="/inventory/audit"
            className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Audit ledger
          </Link>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Integrations</h2>
        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {!isLoading && (!integrations || integrations.length === 0) && (
          <p className="text-sm text-slate-500">
            No integrations yet.{" "}
            <Link href="/settings" className="text-navy-600 underline dark:text-navy-400">
              Connect Salesforce, HubSpot, or Shopify
            </Link>{" "}
            (Nango), then run a scan.
          </p>
        )}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {(integrations ?? []).map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{i.provider}</p>
                <p className="text-xs text-slate-500">
                  Status: {i.status}
                  {i.nangoConnectionId ? " · OAuth linked" : " · Not connected"}
                </p>
              </div>
              <button
                type="button"
                disabled={!i.nangoConnectionId || i.status !== "connected" || triggerScan.isPending}
                onClick={() => triggerScan.mutate({ integrationId: i.id })}
                className="rounded-lg bg-navy-950 px-3 py-2 text-xs font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
              >
                {triggerScan.isPending ? "Queueing…" : "Run PII scan"}
              </button>
            </li>
          ))}
        </ul>
        {triggerScan.error && (
          <p className="mt-2 text-xs text-red-600">{triggerScan.error.message}</p>
        )}
        {triggerScan.data && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            Scan queued: run id {triggerScan.data.scanRunId}. Ensure the inventory worker and PII engine are running.
          </p>
        )}
      </section>

      <ScanRunsSection />
    </div>
  );
}

function ScanRunsSection() {
  const { data: runs } = api.inventory.listScanRuns.useQuery({ limit: 15 });
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Recent scan runs</h2>
      {!runs?.length && <p className="text-sm text-slate-500">No scans yet.</p>}
      <ul className="space-y-2 text-sm">
        {runs?.map((r) => (
          <li key={r.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{r.id.slice(0, 8)}…</span>
            <span className="text-slate-700 dark:text-slate-200">{r.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
