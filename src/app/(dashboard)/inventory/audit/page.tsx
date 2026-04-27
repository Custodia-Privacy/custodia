"use client";

import Link from "next/link";
import { api } from "@/lib/trpc";

export default function InventoryAuditPage() {
  const { data: receipts, isLoading } = api.inventory.listReceipts.useQuery({ limit: 80 });

  return (
    <div className="p-6 lg:p-8">
      <Link href="/inventory" className="text-sm text-navy-600 hover:underline dark:text-navy-400">
        ← Inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Deletion audit ledger</h1>
      <p className="mt-1 text-sm text-slate-500">
        Hash-chained receipts for dry-run and live deletion tasks (HMAC over payload + previous hash).
      </p>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {(receipts ?? []).map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span>{new Date(r.createdAt).toISOString()}</span>
              <span className="text-slate-500">prev: {r.prevHash?.slice(0, 16) ?? "∅"}…</span>
            </div>
            <p className="mt-2 break-all">hash: {r.payloadHash}</p>
            <p className="mt-1 break-all text-slate-500">sig: {r.signature}</p>
          </article>
        ))}
        {!isLoading && receipts?.length === 0 && (
          <p className="text-sm text-slate-500">No receipts yet. Run a DSAR deletion dry-run or retention dry-run.</p>
        )}
      </div>
    </div>
  );
}
