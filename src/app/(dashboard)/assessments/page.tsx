"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  assigned: "Assigned",
  unassigned: "Unassigned",
  questions_generated: "Questions generated",
  answers_submitted: "Answers submitted",
  analyzed: "AI analysis complete",
  approved: "Approved",
  rejected: "Rejected",
};

const PROJECT_LABELS: Record<string, string> = {
  new_product: "New product",
  new_vendor: "New vendor",
  data_migration: "Data migration",
  marketing_campaign: "Marketing campaign",
  feature_change: "Feature change",
  other: "Other",
};

function progressFromStatus(status: string): number {
  switch (status) {
    case "draft":
      return 15;
    case "in_progress":
      return 45;
    case "ai_review":
      return 70;
    case "human_review":
      return 90;
    case "approved":
    case "rejected":
      return 100;
    case "archived":
      return 100;
    default:
      return 0;
  }
}

const statusUi: Record<
  string,
  { label: string; classes: string }
> = {
  draft: {
    label: "Draft",
    classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  in_progress: {
    label: "In progress",
    classes: "bg-navy-100 text-navy-700 dark:bg-navy-900/50 dark:text-navy-300",
  },
  ai_review: {
    label: "AI review",
    classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  human_review: {
    label: "Awaiting review",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  archived: {
    label: "Archived",
    classes: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  },
};

const riskUi: Record<string, { label: string; classes: string }> = {
  low: {
    label: "Low",
    classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  high: {
    label: "High",
    classes: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function AssessmentsPage() {
  const utils = api.useUtils();
  const { data: list, isLoading } = api.pia.list.useQuery({});
  const { data: stats } = api.pia.stats.useQuery();
  const { data: teamMembers } = api.user.listTeamMembers.useQuery();
  const create = api.pia.create.useMutation({
    onSuccess: () => {
      void utils.pia.list.invalidate();
      void utils.pia.stats.invalidate();
      setShowForm(false);
    },
  });

  const assign = api.pia.assign.useMutation({
    onSuccess: () => {
      void utils.pia.list.invalidate();
      void utils.pia.listActivities.invalidate();
    },
  });

  const [activityForId, setActivityForId] = useState<string | null>(null);
  const { data: activities, isLoading: activitiesLoading } = api.pia.listActivities.useQuery(
    { id: activityForId! },
    { enabled: !!activityForId },
  );

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<
    | "new_product"
    | "new_vendor"
    | "data_migration"
    | "marketing_campaign"
    | "feature_change"
    | "other"
  >("feature_change");

  const byStatus = stats?.byStatus ?? {};
  const draft = byStatus.draft ?? 0;
  const inProgress =
    (byStatus.in_progress ?? 0) + (byStatus.ai_review ?? 0);
  const awaitingReview =
    (byStatus.human_review ?? 0);
  const approved = byStatus.approved ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Assessments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stored in <code className="text-xs">assessments</code>. Create below or seed the database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500"
        >
          {showForm ? "Cancel" : "+ New Assessment"}
        </button>
      </div>

      {showForm && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ title: title.trim(), description: description.trim() || undefined, projectType });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Project type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as typeof projectType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {Object.entries(PROJECT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          {create.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{create.error.message}</p>
          )}
          <button
            type="submit"
            disabled={create.isPending}
            className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
          >
            {create.isPending ? "Creating…" : "Create assessment"}
          </button>
        </form>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Draft", value: draft, color: "text-slate-600 dark:text-slate-300" },
          { label: "In progress", value: inProgress, color: "text-navy-600 dark:text-navy-400" },
          { label: "Awaiting review", value: awaitingReview, color: "text-warning" },
          { label: "Approved", value: approved, color: "text-compliant" },
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

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !list?.length ? (
        <p className="text-sm text-slate-500">No assessments yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => {
            const status = statusUi[a.status] ?? {
              label: a.status,
              classes: "bg-slate-100 text-slate-600 dark:bg-slate-800",
            };
            const risk = a.riskLevel
              ? (riskUi[a.riskLevel] ?? riskUi.medium!)
              : {
                  label: "Unset",
                  classes: "bg-slate-100 text-slate-500 dark:bg-slate-800",
                };
            const progress = progressFromStatus(a.status);
            return (
              <div
                key={a.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    {a.id.slice(0, 8)}…
                  </span>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${risk.classes}`}
                  >
                    {risk.label} risk
                  </span>
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  {PROJECT_LABELS[a.projectType] ?? a.projectType}
                </p>
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Progress (derived)</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-navy-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mb-3 space-y-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor={`assign-${a.id}`}>
                    Assignee
                  </label>
                  <select
                    id={`assign-${a.id}`}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    value={a.assignedToUserId ?? ""}
                    disabled={assign.isPending}
                    onChange={(e) => {
                      const v = e.target.value;
                      assign.mutate({
                        id: a.id,
                        assignedToUserId: v === "" ? null : v,
                      });
                    }}
                  >
                    <option value="">Unassigned</option>
                    {(teamMembers ?? []).map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name?.trim() || m.user.email}
                      </option>
                    ))}
                  </select>
                  {a.assignedTo && (
                    <p className="text-[10px] text-slate-400">
                      Currently: {a.assignedTo.name?.trim() || a.assignedTo.email}
                    </p>
                  )}
                </div>
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setActivityForId(a.id)}
                    className="text-xs font-medium text-navy-700 hover:underline dark:text-navy-400"
                  >
                    View activity…
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activityForId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-title"
        >
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 id="activity-title" className="text-sm font-semibold text-slate-900 dark:text-white">
                Assessment activity
              </h2>
              <button
                type="button"
                onClick={() => setActivityForId(null)}
                className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {activitiesLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : !activities?.length ? (
                <p className="text-sm text-slate-500">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {activities.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {ACTION_LABELS[row.action] ?? row.action}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {new Date(row.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {row.actor && (
                        <p className="mt-1 text-xs text-slate-500">
                          By {row.actor.name?.trim() || row.actor.email}
                        </p>
                      )}
                      {row.details != null && (
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                          {JSON.stringify(row.details, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
