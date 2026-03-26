"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/trpc";

const REQUEST_LABELS: Record<string, string> = {
  access: "Data access",
  deletion: "Data deletion",
  rectification: "Rectification",
  portability: "Portability",
  opt_out: "Opt-out",
  restrict_processing: "Restrict processing",
};

const STATUS_PIPELINE = [
  { key: "received", label: "Received" },
  { key: "identity_verified", label: "Verified" },
  { key: "processing", label: "Processing" },
  { key: "data_collected", label: "Data collected" },
  { key: "review", label: "In review" },
  { key: "fulfilled", label: "Fulfilled" },
] as const;

const STATUS_CLASSES: Record<string, string> = {
  received: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  identity_verified: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  processing: "bg-navy-100 text-navy-700 dark:bg-navy-900/50 dark:text-navy-300",
  data_collected: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  review: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  fulfilled: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  appealed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const ACTIVITY_LABELS: Record<string, string> = {
  request_received: "Request received",
  status_changed: "Status changed",
  ai_processing_started: "AI processing started",
  ai_processing_completed: "AI processing completed",
  request_fulfilled: "Request fulfilled",
  request_rejected: "Request rejected",
  portal_submission: "Portal submission",
};

export default function DsarDetailPage() {
  const params = useParams();
  const requestId = params.requestId as string;
  const utils = api.useUtils();

  const { data: dsar, isLoading, error } = api.dsar.get.useQuery({ id: requestId });

  const updateStatus = api.dsar.updateStatus.useMutation({
    onSuccess: () => {
      void utils.dsar.get.invalidate({ id: requestId });
      void utils.dsar.list.invalidate();
      void utils.dsar.stats.invalidate();
    },
  });

  const processAI = api.dsar.process.useMutation({
    onSuccess: () => {
      void utils.dsar.get.invalidate({ id: requestId });
    },
  });

  const fulfill = api.dsar.fulfill.useMutation({
    onSuccess: () => {
      void utils.dsar.get.invalidate({ id: requestId });
      void utils.dsar.list.invalidate();
      void utils.dsar.stats.invalidate();
    },
  });

  const reject = api.dsar.reject.useMutation({
    onSuccess: () => {
      void utils.dsar.get.invalidate({ id: requestId });
      void utils.dsar.list.invalidate();
      void utils.dsar.stats.invalidate();
    },
  });

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error || !dsar) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/dsars" className="text-sm text-navy-600 hover:underline dark:text-navy-400">
          Data Requests
        </Link>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error?.message ?? "DSAR request not found"}
        </p>
      </div>
    );
  }

  const currentIdx = STATUS_PIPELINE.findIndex((s) => s.key === dsar.status);
  const isTerminal = dsar.status === "fulfilled" || dsar.status === "rejected";

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/dsars"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to DSARs
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {dsar.requesterName}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {REQUEST_LABELS[dsar.requestType] ?? dsar.requestType} · {dsar.jurisdiction.toUpperCase()} ·
            ID: <code className="text-xs">{dsar.id.slice(0, 8)}…</code>
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[dsar.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {STATUS_PIPELINE.find((s) => s.key === dsar.status)?.label ?? dsar.status}
        </span>
      </div>

      {/* Status pipeline stepper */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Progress</h2>
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_PIPELINE.map((step, idx) => {
            const done = idx <= currentIdx && !isTerminal;
            const isCurrent = step.key === dsar.status;
            return (
              <div key={step.key} className="flex items-center gap-1">
                {idx > 0 && (
                  <div className={`h-0.5 w-6 ${done ? "bg-navy-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isCurrent
                        ? "bg-navy-500 text-white"
                        : done
                          ? "bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-300"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}
                  >
                    {done && !isCurrent ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`whitespace-nowrap text-[10px] ${isCurrent ? "font-semibold text-navy-700 dark:text-navy-300" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {dsar.status === "rejected" && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            Rejected{dsar.rejectedReason ? `: ${dsar.rejectedReason}` : ""}
          </div>
        )}
      </div>

      {/* Requester info + details grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Requester</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{dsar.requesterName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{dsar.requesterEmail}</dd>
            </div>
            {dsar.requesterPhone && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{dsar.requesterPhone}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Received</dt>
              <dd className="text-slate-900 dark:text-white">
                {new Date(dsar.receivedAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Due</dt>
              <dd className={`font-medium ${new Date(dsar.dueDate) < new Date() && !isTerminal ? "text-red-600" : "text-slate-900 dark:text-white"}`}>
                {new Date(dsar.dueDate).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Actions</h2>

          {!isTerminal && (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Change status</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={dsar.status}
                  disabled={updateStatus.isPending}
                  onChange={(e) => updateStatus.mutate({ id: dsar.id, status: e.target.value as any })}
                >
                  {STATUS_PIPELINE.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {updateStatus.error && (
                <p className="text-xs text-red-600">{updateStatus.error.message}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={processAI.isPending}
                  onClick={() => processAI.mutate({ id: dsar.id })}
                  className="rounded-lg bg-navy-950 px-3 py-2 text-xs font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
                >
                  {processAI.isPending ? "Processing…" : "Run AI Processing"}
                </button>

                <button
                  type="button"
                  disabled={fulfill.isPending}
                  onClick={() => fulfill.mutate({ id: dsar.id })}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {fulfill.isPending ? "Fulfilling…" : "Mark fulfilled"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectForm((s) => !s)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Reject
                </button>
              </div>

              {showRejectForm && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={reject.isPending || !rejectReason.trim()}
                    onClick={() => reject.mutate({ id: dsar.id, reason: rejectReason.trim() })}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {reject.isPending ? "Rejecting…" : "Confirm rejection"}
                  </button>
                </div>
              )}

              {processAI.error && (
                <p className="text-xs text-red-600">{processAI.error.message}</p>
              )}
            </div>
          )}

          {isTerminal && (
            <p className="text-sm text-slate-500">
              This request is {dsar.status}. No further actions available.
            </p>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {dsar.aiSummary && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">AI Summary</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{dsar.aiSummary}</p>
        </div>
      )}

      {/* Notes */}
      {dsar.notes && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{dsar.notes}</p>
        </div>
      )}

      {/* Activity timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Activity log</h2>
        {!dsar.activities.length ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {dsar.activities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {ACTIVITY_LABELS[a.action] ?? a.action}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">by {a.actor}</p>
                  {a.details != null && (
                    <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
