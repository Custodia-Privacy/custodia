"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppRouter } from "@/server/root";
import { api } from "@/lib/trpc";

type ChatMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      proposals: inferRouterOutputs<AppRouter>["assistant"]["chat"]["proposals"];
    };

export default function AssistantPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi — I’m your Custodia setup assistant. Ask how to add a site, run a scan, or open DSARs. When you’re ready, I can propose **actions** — you’ll confirm each one before anything changes.",
      proposals: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const { data: auditRows } = api.assistant.listAudit.useQuery({ limit: 20 });

  const recordAction = api.assistant.recordConfirmedAction.useMutation({
    onSettled: () => void utils.assistant.listAudit.invalidate(),
  });

  const createSite = api.site.create.useMutation({
    onSuccess: () => {
      void utils.site.list.invalidate();
      void utils.dashboard.overview.invalidate();
    },
  });
  const triggerScan = api.scan.trigger.useMutation({
    onSuccess: () => {
      void utils.dashboard.overview.invalidate();
    },
  });

  const chat = api.assistant.chat.useMutation({
    onSuccess: (data) => {
      setError(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, proposals: data.proposals },
      ]);
    },
    onError: (e) => setError(e.message),
  });

  function send() {
    const trimmed = input.trim();
    if (!trimmed || chat.isPending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    chat.mutate({
      messages: next.map((m) => ({ role: m.role, content: m.content })),
    });
  }

  async function runProposal(
    p: inferRouterOutputs<AppRouter>["assistant"]["chat"]["proposals"][number],
  ) {
    setError(null);
    const log = async (args: {
      action: "assistant_create_site" | "assistant_trigger_scan" | "assistant_navigate";
      payload?: Record<string, unknown>;
      success: boolean;
      errorMessage?: string;
    }) => {
      try {
        await recordAction.mutateAsync(args);
      } catch {
        // audit failure should not block UX
      }
    };

    try {
      if (p.tool === "propose_create_site") {
        const name = (p.input.name?.trim() || p.input.domain).slice(0, 255);
        const domain = p.input.domain.trim();
        await createSite.mutateAsync({ domain, name });
        await log({
          action: "assistant_create_site",
          payload: { domain, name },
          success: true,
        });
      } else if (p.tool === "propose_trigger_scan") {
        await triggerScan.mutateAsync({ siteId: p.input.siteId, type: "full" });
        await log({
          action: "assistant_trigger_scan",
          payload: { siteId: p.input.siteId },
          success: true,
        });
      } else if (p.tool === "suggest_navigation") {
        router.push(p.input.path);
        await log({
          action: "assistant_navigate",
          payload: { path: p.input.path, reason: p.input.reason },
          success: true,
        });
      }
      setDismissed((prev) => new Set(prev).add(p.id));
      void utils.org.summary.invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed";
      setError(msg);
      if (p.tool === "propose_create_site") {
        await log({
          action: "assistant_create_site",
          payload: { domain: p.input.domain },
          success: false,
          errorMessage: msg,
        });
      } else if (p.tool === "propose_trigger_scan") {
        await log({
          action: "assistant_trigger_scan",
          payload: { siteId: p.input.siteId },
          success: false,
          errorMessage: msg,
        });
      } else if (p.tool === "suggest_navigation") {
        await log({
          action: "assistant_navigate",
          payload: { path: p.input.path },
          success: false,
          errorMessage: msg,
        });
      }
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col p-6 lg:p-8">
      <div className="mb-6 shrink-0">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Setup assistant</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          AI-guided onboarding with <strong>confirmed</strong> actions only. Proposals below run only when you click
          Confirm. All actions are logged for your records.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent assistant confirmations</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Written when you click Confirm (success or failure).
        </p>
        {!auditRows?.length ? (
          <p className="mt-2 text-sm text-slate-500">No entries yet.</p>
        ) : (
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs">
            {auditRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800"
              >
                <span className={row.success ? "text-slate-700 dark:text-slate-300" : "text-red-600 dark:text-red-400"}>
                  {row.action.replace(/^assistant_/, "")}
                </span>
                <span className="text-slate-400">
                  {new Date(row.createdAt).toLocaleString()} · {row.user?.email ?? "system"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
          {messages.map((m, i) => (
            <div key={i}>
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-navy-950 text-white dark:bg-navy-600"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
              {m.role === "assistant" && m.proposals.length > 0 && (
                <div className="mt-3 ml-0 space-y-2 sm:ml-1">
                  {m.proposals
                    .filter((p) => !dismissed.has(p.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex max-w-[min(100%,42rem)] flex-col gap-2 rounded-xl border border-navy-200 bg-navy-50/80 p-3 dark:border-navy-900 dark:bg-navy-950/40"
                      >
                        <p className="text-xs font-medium text-navy-900 dark:text-navy-200">{p.label}</p>
                        <button
                          type="button"
                          disabled={createSite.isPending || triggerScan.isPending}
                          onClick={() => void runProposal(p)}
                          className="self-start rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
                        >
                          Confirm
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
          {chat.isPending && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Thinking…</p>
          )}
        </div>

        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="e.g. Add our site shop.example.com and run a scan"
              className="min-h-[44px] flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={chat.isPending || !input.trim()}
              onClick={send}
              className="shrink-0 rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600 dark:hover:bg-navy-500"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
