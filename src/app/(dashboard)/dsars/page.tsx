"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc";

const REQUEST_TYPES: Record<string, string> = {
  access: "Data Access",
  deletion: "Data Deletion",
  rectification: "Correction",
  portability: "Data Export",
  opt_out: "Opt Out",
  restrict_processing: "Restrict Processing",
};

const PIPELINE_STAGES = ["received", "identity_verified", "processing", "data_collected", "review", "fulfilled"] as const;
const STAGE_LABELS: Record<string, string> = {
  received: "Received",
  identity_verified: "Verified",
  processing: "Processing",
  data_collected: "Enriched",
  review: "Review",
  fulfilled: "Complete",
  rejected: "Rejected",
  appealed: "Appealed",
};

function statusStyle(status: string, dueDate: Date) {
  const overdue = !["fulfilled", "rejected"].includes(status) && new Date(dueDate) < new Date();
  if (overdue) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  const map: Record<string, string> = {
    received: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    identity_verified: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    processing: "bg-navy-100 text-navy-700 dark:bg-navy-950 dark:text-navy-300",
    data_collected: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    review: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    fulfilled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    rejected: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

function daysUntilDue(dueDate: Date) {
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function dueLabel(dueDate: Date, status: string) {
  if (["fulfilled", "rejected"].includes(status)) return "";
  const days = daysUntilDue(dueDate);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days <= 3) return `${days}d left`;
  return `${days}d left`;
}

function dueLabelColor(dueDate: Date, status: string) {
  if (["fulfilled", "rejected"].includes(status)) return "text-slate-400";
  const days = daysUntilDue(dueDate);
  if (days < 0) return "text-red-600 dark:text-red-400";
  if (days <= 3) return "text-orange-600 dark:text-orange-400";
  if (days <= 7) return "text-amber-600 dark:text-amber-400";
  return "text-slate-500 dark:text-slate-400";
}

export default function DataRequestsPage() {
  const utils = api.useUtils();
  const { data: sites } = api.site.list.useQuery();
  const { data: list, isLoading } = api.dsar.list.useQuery({});
  const { data: stats } = api.dsar.stats.useQuery();
  const [filter, setFilter] = useState<string>("all");

  const create = api.dsar.create.useMutation({
    onSuccess: () => {
      void utils.dsar.list.invalidate();
      void utils.dsar.stats.invalidate();
      setShowForm(false);
      setRequesterName("");
      setRequesterEmail("");
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState<keyof typeof REQUEST_TYPES>("access");
  const [jurisdiction, setJurisdiction] = useState("gdpr");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");

  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(typeof window !== "undefined" ? window.location.origin : ""); }, []);

  const filtered = list?.filter((r) => {
    if (filter === "all") return true;
    if (filter === "open") return !["fulfilled", "rejected"].includes(r.status);
    if (filter === "overdue") return !["fulfilled", "rejected"].includes(r.status) && new Date(r.dueDate) < new Date();
    return r.status === filter;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Data Requests</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage incoming data subject requests across all jurisdictions
          </p>
        </div>
        <button type="button" onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700">
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard label="Open" value={stats?.openCount ?? 0} accent={false} />
        <StatCard label="Processing" value={stats?.processingCount ?? 0} accent={false} />
        <StatCard label="Overdue" value={stats?.overdueCount ?? 0} accent={stats?.overdueCount ? true : false} />
        <StatCard label="Fulfilled (month)" value={stats?.fulfilledThisMonth ?? 0} accent={false} />
      </div>

      {/* Public form link */}
      {sites && sites.length > 0 && (
        <div className="mb-6 rounded-xl border border-navy-200/50 bg-navy-50/30 p-4 dark:border-navy-800/50 dark:bg-navy-950/20">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 text-navy-600 dark:text-navy-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <span className="text-xs font-semibold text-navy-700 dark:text-navy-300">Public Request Form</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Share this link on your privacy policy page. Submissions automatically create requests here.
          </p>
          {origin && sites[0] && (
            <code className="block rounded-lg bg-white/80 px-3 py-2 font-mono text-xs text-slate-700 dark:bg-slate-900/50 dark:text-slate-300 break-all">
              {origin}/request/{sites[0].id}
            </code>
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form className="mb-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ requestType: requestType as any, jurisdiction, requesterName: requesterName.trim(), requesterEmail: requesterEmail.trim() });
          }}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Create Request Manually</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Request Type">
              <select value={requestType} onChange={(e) => setRequestType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {Object.entries(REQUEST_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Jurisdiction">
              <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="gdpr">GDPR (EU)</option>
                <option value="ccpa">CCPA/CPRA (California)</option>
                <option value="vcdpa">VCDPA (Virginia)</option>
                <option value="cpa">CPA (Colorado)</option>
                <option value="ctdpa">CTDPA (Connecticut)</option>
                <option value="uk_gdpr">UK GDPR</option>
                <option value="pipeda">PIPEDA (Canada)</option>
              </select>
            </Field>
            <Field label="Requester Name">
              <input required value={requesterName} onChange={(e) => setRequesterName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </Field>
            <Field label="Requester Email">
              <input required type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </Field>
          </div>
          {create.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{create.error.message}</p>}
          <button type="submit" disabled={create.isPending}
            className="mt-3 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50">
            {create.isPending ? "Creating..." : "Create Request"}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-1.5">
        {["all", "open", "overdue", "fulfilled", "rejected"].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-navy-50 text-navy-700 dark:bg-navy-950 dark:text-navy-300"
                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl border border-slate-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filter === "all" ? "No data requests yet. Create one manually or share the public form link." : `No ${filter} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const isOverdue = !["fulfilled", "rejected"].includes(req.status) && new Date(req.dueDate) < new Date();
            return (
              <Link key={req.id} href={`/dsars/${req.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{req.requesterName}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(req.status, req.dueDate)}`}>
                      {isOverdue ? "Overdue" : STAGE_LABELS[req.status] ?? req.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {REQUEST_TYPES[req.requestType] ?? req.requestType} · {req.jurisdiction.toUpperCase()} · {req.requesterEmail}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {dueLabel(req.dueDate, req.status) && (
                    <span className={`text-xs font-medium ${dueLabelColor(req.dueDate, req.status)}`}>
                      {dueLabel(req.dueDate, req.status)}
                    </span>
                  )}
                  {/* Pipeline progress dots */}
                  <div className="hidden sm:flex items-center gap-0.5">
                    {PIPELINE_STAGES.map((stage) => {
                      const idx = PIPELINE_STAGES.indexOf(stage);
                      const currentIdx = PIPELINE_STAGES.indexOf(req.status as any);
                      const reached = req.status === "rejected" ? false : idx <= currentIdx;
                      return <div key={stage} className={`h-1.5 w-1.5 rounded-full ${reached ? "bg-navy-500" : "bg-slate-200 dark:bg-slate-700"}`} />;
                    })}
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

function StatCard({ label, value, accent }: { label: string; value: number; accent: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
