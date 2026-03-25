"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

const RISK: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function dataSharedSummary(raw: unknown): string {
  if (raw == null) return "—";
  if (Array.isArray(raw)) return raw.slice(0, 3).join(", ") + (raw.length > 3 ? "…" : "");
  if (typeof raw === "object") return JSON.stringify(raw).slice(0, 80) + "…";
  return String(raw).slice(0, 80);
}

export default function VendorsPage() {
  const utils = api.useUtils();
  const { data: vendors, isLoading } = api.governance.listVendors.useQuery();
  const createVendor = api.governance.createVendor.useMutation({
    onSuccess: () => {
      void utils.governance.listVendors.invalidate();
      setOpen(false);
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const total = vendors?.length ?? 0;
  const compliant = vendors?.filter((v) => v.complianceStatus === "compliant").length ?? 0;
  const review = vendors?.filter((v) => v.complianceStatus === "under_review" || v.complianceStatus === "review").length ?? 0;
  const bad =
    vendors?.filter((v) => v.complianceStatus === "non_compliant" || v.complianceStatus === "non-compliant").length ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendors</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track third-party vendors, assess their privacy risk, and monitor compliance status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-navy-600"
        >
          {open ? "Cancel" : "+ Add Vendor"}
        </button>
      </div>

      {open && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(e) => {
            e.preventDefault();
            createVendor.mutate({
              name: name.trim(),
              category: category.trim() || "general",
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
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
              <label className="mb-1 block text-xs text-slate-500">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Analytics, CRM, …"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          {createVendor.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createVendor.error.message}</p>
          )}
          <button
            type="submit"
            disabled={createVendor.isPending}
            className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
          >
            {createVendor.isPending ? "Saving…" : "Create"}
          </button>
        </form>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Vendors", value: total, color: "text-navy-600 dark:text-navy-400" },
          { label: "Compliant", value: compliant, color: "text-compliant" },
          { label: "Under Review", value: review, color: "text-warning" },
          { label: "Non-Compliant", value: bad, color: "text-violation" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {["Vendor", "Category", "Data shared", "Risk", "Compliance", "Reviewed"].map((h) => (
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
              ) : !vendors?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No vendors yet.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => {
                  const risk = v.riskLevel ? RISK[v.riskLevel] ?? RISK.medium! : RISK.medium!;
                  return (
                    <tr
                      key={v.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {v.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {v.category}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-slate-600 dark:text-slate-300">
                        {dataSharedSummary(v.dataShared)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${risk}`}
                        >
                          {v.riskLevel ?? "unassessed"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {v.complianceStatus ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">
                        {v.lastReviewedAt ? formatRelativeTime(v.lastReviewedAt) : "—"}
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
