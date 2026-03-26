"use client";

import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

const AGENT_LABELS: Record<string, string> = {
  scanner: "Site Scanner",
  dsar_processor: "Data Request Processor",
  policy_generator: "Policy Generator",
  compliance_monitor: "Compliance Monitor",
  data_mapper: "Data Mapper",
  pia_assessor: "Assessment AI",
  vendor_reviewer: "Vendor Reviewer",
};

const statusStyle: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  running: "bg-navy-100 text-navy-700 dark:bg-navy-950 dark:text-navy-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  queued: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function outputSummary(output: unknown): string {
  if (output && typeof output === "object" && "message" in output) {
    return String((output as { message?: string }).message ?? "").slice(0, 150);
  }
  return "";
}

export default function AIActivityPage() {
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

  const runs = runsData?.items ?? [];
  const running = runs.filter((r) => r.status === "queued" || r.status === "running");

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Activity</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Recent activity from your AI agents — scans, analyses, and automated tasks
        </p>
      </div>

      {/* Active tasks */}
      {running.length > 0 && (
        <div className="mb-6 space-y-2">
          {running.map((run) => (
            <div key={run.id} className="flex items-center gap-3 rounded-xl border border-navy-200 bg-navy-50/50 px-4 py-3 dark:border-navy-800 dark:bg-navy-950/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-navy-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-navy-700 dark:text-navy-300">
                  {AGENT_LABELS[run.agentType] ?? run.agentType} is {run.status === "running" ? "running" : "queued"}...
                </p>
              </div>
              <span className="text-[10px] text-navy-500">{formatRelativeTime(run.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Activity list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-slate-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : !runs.length ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No AI activity yet. Agents run automatically when you trigger scans, process data requests, or generate policies.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.filter((r) => r.status !== "queued" && r.status !== "running").map((run) => {
            const summary = outputSummary(run.output);
            return (
              <div key={run.id} className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {AGENT_LABELS[run.agentType] ?? run.agentType}
                    </p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[run.status] ?? statusStyle.queued}`}>
                      {run.status === "completed" ? "Done" : run.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatRelativeTime(run.createdAt)}</span>
                </div>
                {summary && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{summary}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
