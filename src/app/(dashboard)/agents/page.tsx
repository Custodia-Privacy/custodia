"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

type AgentTypeKey =
  | "scanner"
  | "dsar_processor"
  | "policy_generator"
  | "compliance_monitor"
  | "data_mapper"
  | "pia_assessor"
  | "vendor_reviewer";

function durationMs(startedAt: Date | null, completedAt: Date | null): string {
  if (!startedAt || !completedAt) return "—";
  const s = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function outputSummary(output: unknown): string {
  if (output && typeof output === "object" && "message" in output) {
    return String((output as { message?: string }).message ?? "").slice(0, 120);
  }
  return "—";
}

const runStatusClasses: Record<string, string> = {
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  running: "bg-navy-100 text-navy-700 dark:bg-navy-900/50 dark:text-navy-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  queued: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export default function AgentsPage() {
  const utils = api.useUtils();
  const { data: types } = api.agents.listAgentTypes.useQuery();
  const { data: runsData, isLoading } = api.agents.listRuns.useQuery(
    { limit: 50 },
    {
      refetchInterval: (query) => {
        const items = query.state.data?.items;
        if (items?.some((r) => r.status === "queued" || r.status === "running")) return 3000;
        return false;
      },
    },
  );
  const trigger = api.agents.trigger.useMutation({
    onSuccess: () => void utils.agents.listRuns.invalidate(),
  });

  const [dropdown, setDropdown] = useState(false);

  const runs = runsData?.items ?? [];

  const lastByType = useMemo(() => {
    const map = new Map<string, (typeof runs)[number]>();
    for (const r of runs) {
      if (!map.has(r.agentType)) map.set(r.agentType, r);
    }
    return map;
  }, [runs]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Agents</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Types are static; runs are rows in <code className="text-xs">agent_runs</code>. Use{" "}
            <strong>Run Agent</strong> or the tRPC / MCP <code className="text-xs">agents.trigger</code>{" "}
            procedure.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdown((d) => !d)}
            className="flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-navy-600"
          >
            Run Agent
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {dropdown && types && (
            <div className="absolute right-0 z-10 mt-2 max-h-72 w-64 overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {types.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  disabled={trigger.isPending}
                  onClick={() => {
                    trigger.mutate({ agentType: t.type as AgentTypeKey, input: {} });
                    setDropdown(false);
                  }}
                  className="flex w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {trigger.error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{trigger.error.message}</p>
      )}

      {runs.some((r) => r.status === "queued" || r.status === "running") && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-navy-200 bg-navy-50/50 px-4 py-3 dark:border-navy-900 dark:bg-navy-950/30">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-navy-500" />
          <p className="text-sm text-navy-700 dark:text-navy-300">
            Agent runs in progress. This page refreshes automatically.
          </p>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(types ?? []).map((t) => {
          const last = lastByType.get(t.type);
          const active = last?.status === "running";
          return (
            <div
              key={t.type}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${active ? "animate-pulse bg-green-500" : "bg-slate-400"}`}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {active ? "Active" : "Idle"}
                  </span>
                </div>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">{t.name}</h3>
              <p className="mb-4 flex-1 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Last: {last ? formatRelativeTime(last.createdAt) : "never"}
                </span>
                <button
                  type="button"
                  disabled={trigger.isPending}
                  onClick={() => trigger.mutate({ agentType: t.type as AgentTypeKey, input: {} })}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Run Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Agent Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {["Agent", "Trigger", "Status", "Started", "Duration", "Tokens", "Cost", "Output"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No runs yet. Trigger an agent above.
                  </td>
                </tr>
              ) : (
                runs.map((run) => {
                  const st =
                    runStatusClasses[run.status] ??
                    "bg-slate-100 text-slate-600 dark:bg-slate-800";
                  return (
                    <tr
                      key={run.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {run.agentType.replace(/_/g, " ")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {run.trigger}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st}`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {run.startedAt
                          ? new Date(run.startedAt).toLocaleString()
                          : formatRelativeTime(run.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {durationMs(
                          run.startedAt ? new Date(run.startedAt) : null,
                          run.completedAt ? new Date(run.completedAt) : null,
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {run.tokensUsed.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        ${(run.costCents / 100).toFixed(3)}
                      </td>
                      <td className="max-w-[240px] truncate px-6 py-4 text-slate-500 dark:text-slate-400">
                        {outputSummary(run.output)}
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
