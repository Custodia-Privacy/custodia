"use client";

import Link from "next/link";
import { api } from "@/lib/trpc";

export default function InventoryFindingsPage() {
  const { data: findings, isLoading } = api.inventory.listFindings.useQuery({ limit: 150 });

  return (
    <div className="p-6 lg:p-8">
      <Link href="/inventory" className="text-sm text-navy-600 hover:underline dark:text-navy-400">
        ← Inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">PII findings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Labels follow the OpenAI Privacy Filter taxonomy (e.g. private_email, private_person).
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Avg score</th>
              <th className="px-4 py-3">Hits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading &&
              (findings ?? []).map((f) => (
                <tr key={f.id} className="bg-white dark:bg-slate-950">
                  <td className="px-4 py-3 font-mono text-xs">{f.label}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{f.asset.name}</td>
                  <td className="px-4 py-3">{f.avgScore.toFixed(3)}</td>
                  <td className="px-4 py-3">{f.hitCount}</td>
                </tr>
              ))}
            {!isLoading && findings?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  No findings yet. Run a scan from the Inventory home page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
