"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc";

function scoreColor(score: number | null) {
  if (score == null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number | null) {
  if (score == null) return "bg-slate-100 dark:bg-slate-800";
  if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/40";
  if (score >= 60) return "bg-amber-50 dark:bg-amber-950/40";
  return "bg-red-50 dark:bg-red-950/40";
}

export default function SitesPage() {
  const utils = api.useUtils();
  const { data: sitesData, isLoading } = api.site.list.useQuery();
  const sites = sitesData?.items ?? [];
  const createSite = api.site.create.useMutation({
    onSuccess: () => {
      void utils.site.list.invalidate();
      setDomain("");
      setName("");
      setShowForm(false);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Sites</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Websites monitored for privacy compliance
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((o) => !o)}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700"
        >
          {showForm ? "Cancel" : "Add Site"}
        </button>
      </div>

      {showForm && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          onSubmit={(e) => {
            e.preventDefault();
            const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
            const n = name.trim() || d;
            if (!d) return;
            createSite.mutate({ domain: d, name: n });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="site-domain" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Domain</label>
              <input
                id="site-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="site-name" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Display name</label>
              <input
                id="site-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Storefront"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createSite.isPending}
                className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
              >
                {createSite.isPending ? "Creating..." : "Create & Scan"}
              </button>
            </div>
          </div>
          {createSite.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createSite.error.message}</p>
          )}
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-slate-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : !sites?.length ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">No sites yet</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Add your first website to start monitoring privacy compliance.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sites.map((site) => {
            const score = site.complianceScore;
            return (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{site.domain}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {site.name !== site.domain && `${site.name} · `}
                    {site._count.findings} open finding{site._count.findings !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${scoreBg(score)}`}>
                    <span className={`text-sm font-bold ${scoreColor(score)}`}>
                      {score ?? "—"}
                    </span>
                  </div>
                  <svg className="h-4 w-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
