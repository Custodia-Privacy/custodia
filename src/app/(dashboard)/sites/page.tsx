"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc";

function scoreColor(score: number | null) {
  if (score == null) return "text-slate-400";
  if (score >= 90) return "text-compliant";
  if (score >= 70) return "text-warning";
  return "text-violation";
}

export default function SitesPage() {
  const utils = api.useUtils();
  const { data: sites, isLoading } = api.site.list.useQuery();
  const createSite = api.site.create.useMutation({
    onSuccess: () => {
      void utils.site.list.invalidate();
      setDomain("");
      setName("");
      setOpenForm(false);
    },
  });

  const [openForm, setOpenForm] = useState(false);
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Sites</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage the websites you monitor for privacy compliance. Add a site to start scanning.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenForm((o) => !o)}
          className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500"
        >
          {openForm ? "Cancel" : "+ Add Site"}
        </button>
      </div>

      {openForm && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(e) => {
            e.preventDefault();
            const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
            const n = name.trim() || d;
            if (!d) return;
            createSite.mutate({ domain: d, name: n });
          }}
        >
          <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">New site</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Domain</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My storefront"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          {createSite.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createSite.error.message}</p>
          )}
          <button
            type="submit"
            disabled={createSite.isPending}
            className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
          >
            {createSite.isPending ? "Creating…" : "Create & queue scan"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading sites…</p>
      ) : (
        <div className="space-y-4">
          {(sites ?? []).map((site) => {
            const score = site.complianceScore;
            const lastScan = site.lastScannedAt
              ? new Date(site.lastScannedAt).toLocaleDateString()
              : "Never";
            return (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {site.domain}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {site.name} · Last scan: {lastScan} · {site._count.scans} scans ·{" "}
                      {site._count.findings} findings (all time)
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Compliance</p>
                      <p className={`text-2xl font-bold ${scoreColor(score)}`}>
                        {score != null ? `${score}%` : "—"}
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
            );
          })}

          {(sites?.length ?? 0) === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No sites yet. Click <strong>+ Add Site</strong> above to add your first website and start a privacy scan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
