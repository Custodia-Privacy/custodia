"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc";

export default function InventoryPoliciesPage() {
  const { data: policies, isLoading } = api.inventory.listRetentionPolicies.useQuery();
  const utils = api.useUtils();
  const createPolicy = api.inventory.createRetentionPolicy.useMutation({
    onSuccess: () => void utils.inventory.listRetentionPolicies.invalidate(),
  });
  const startRetention = api.inventory.startRetentionDeletion.useMutation();

  const [name, setName] = useState("");
  const [ruleDays, setRuleDays] = useState("");

  return (
    <div className="p-6 lg:p-8">
      <Link href="/inventory" className="text-sm text-navy-600 hover:underline dark:text-navy-400">
        ← Inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Retention policies</h1>
      <p className="mt-1 text-sm text-slate-500">
        Define retention intent (v1 records metadata + audit runs). Live row deletes extend in v2 with warehouse
        adapters.
      </p>

      <form
        className="mt-6 max-w-lg space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
        onSubmit={(e) => {
          e.preventDefault();
          createPolicy.mutate({
            name: name.trim(),
            ruleDays: ruleDays ? Number(ruleDays) : undefined,
          });
          setName("");
          setRuleDays("");
        }}
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">New policy (admin)</h2>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Policy name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          value={ruleDays}
          onChange={(e) => setRuleDays(e.target.value)}
          placeholder="Rule: max age in days (optional)"
          type="number"
          min={1}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={createPolicy.isPending}
          className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
        >
          {createPolicy.isPending ? "Saving…" : "Create policy"}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Existing policies</h2>
        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        <ul className="space-y-3">
          {(policies ?? []).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.enabled ? "Enabled" : "Disabled"} · Targets: {p.targets.length}
                  {p.ruleDays != null ? ` · Rule days: ${p.ruleDays}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
                  disabled={startRetention.isPending}
                  onClick={() => startRetention.mutate({ policyId: p.id, dryRun: true })}
                >
                  Dry-run deletion
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
