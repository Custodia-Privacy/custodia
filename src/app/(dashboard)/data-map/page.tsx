"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

const SENS_CLASSES: Record<string, string> = {
  public: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  internal: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  confidential: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  restricted: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  pii: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  sensitive_pii: "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function DataMapPage() {
  const utils = api.useUtils();
  const { data: storesData, isLoading } = api.governance.listStores.useQuery({});
  const stores = storesData?.items ?? [];
  const { data: flowsData } = api.governance.listFlows.useQuery();
  const flows = flowsData?.items ?? [];
  const exportInventory = api.governance.exportDataInventory.useQuery(undefined, {
    enabled: false,
  });
  const createStore = api.governance.createStore.useMutation({
    onSuccess: () => {
      void utils.governance.listStores.invalidate();
      setOpen(false);
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [storeType, setStoreType] = useState("database");
  const [provider, setProvider] = useState("");

  const preview = stores.slice(0, 8);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Map</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Map where personal data lives across your organization and track how it flows between systems.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              const r = await exportInventory.refetch();
              if (!r.data) return;
              const blob = new Blob([JSON.stringify(r.data, null, 2)], {
                type: "application/json",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `custodia-data-inventory-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            disabled={exportInventory.isFetching}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {exportInventory.isFetching ? "Exporting…" : "Export inventory JSON"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {open ? "Cancel" : "+ Add Data Store"}
          </button>
        </div>
      </div>

      {open && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(e) => {
            e.preventDefault();
            createStore.mutate({
              name: name.trim(),
              type: storeType as
                | "database"
                | "api"
                | "file_storage"
                | "saas_app"
                | "crm"
                | "analytics"
                | "email_platform"
                | "cdn"
                | "payment_processor"
                | "other",
              provider: provider.trim() || undefined,
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Type</label>
              <select
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {[
                  "database",
                  "api",
                  "file_storage",
                  "saas_app",
                  "crm",
                  "analytics",
                  "email_platform",
                  "cdn",
                  "payment_processor",
                  "other",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Provider</label>
              <input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="AWS, Stripe, …"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          {createStore.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createStore.error.message}</p>
          )}
          <button
            type="submit"
            disabled={createStore.isPending}
            className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
          >
            {createStore.isPending ? "Saving…" : "Create store"}
          </button>
        </form>
      )}

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
          Registered stores (preview)
        </h2>
        {preview.length === 0 ? (
          <p className="text-sm text-slate-500">No data stores yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {preview.map((s) => (
              <span
                key={s.id}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
        {flows.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Flows</p>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {flows.slice(0, 10).map((f) => (
                <li key={f.id}>
                  {f.source.name} → {f.target.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Data Stores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {["Name", "Type", "Provider", "Sensitivity", "PII fields", "Last synced"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No data stores registered yet. Add one above to start mapping your data.
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  const piiArr = store.piiFields as unknown;
                  const piiCount = Array.isArray(piiArr) ? piiArr.length : store.recordCount ?? "—";
                  const sensClass =
                    SENS_CLASSES[store.sensitivity] ?? SENS_CLASSES.internal!;
                  return (
                    <tr
                      key={store.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {store.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {store.type}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {store.provider ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${sensClass}`}
                        >
                          {store.sensitivity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {piiCount}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">
                        {store.lastSyncedAt ? formatRelativeTime(store.lastSyncedAt) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
