"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/format-relative";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface Proposal {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  label: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name: string | null | undefined, email: string | undefined): string {
  if (name?.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "there";
}

function riskColor(score: number | null) {
  if (score == null) return { ring: "text-slate-700", text: "text-slate-400", bg: "bg-slate-500/10" };
  if (score >= 80) return { ring: "text-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (score >= 60) return { ring: "text-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" };
  return { ring: "text-red-500", text: "text-red-400", bg: "bg-red-500/10" };
}

function riskLabel(score: number | null) {
  if (score == null) return "No data";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs work";
  if (score >= 40) return "At risk";
  return "Critical";
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: me } = api.user.me.useQuery();
  const { data, isLoading } = api.dashboard.overview.useQuery();

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const chat = api.assistant.chat.useMutation();
  const utils = api.useUtils();

  const createSite = api.site.create.useMutation({ onSuccess: () => { void utils.site.list.invalidate(); } });
  const triggerScan = api.scan.trigger.useMutation();
  const recordAction = api.assistant.recordConfirmedAction.useMutation();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text || chat.isPending) return;
    const msgs: ChatMsg[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(msgs);
    setChatInput("");
    setProposals([]);
    chat.mutate(
      { messages: msgs.slice(-20) },
      {
        onSuccess: (d) => {
          setChatMessages((prev) => [...prev, { role: "assistant", content: d.reply }]);
          if (d.proposals.length) setProposals(d.proposals);
          setTimeout(() => chatInputRef.current?.focus(), 50);
        },
        onError: (err) => {
          setChatMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${err.message}` }]);
        },
      },
    );
  }, [chatInput, chatMessages, chat]);

  const handleConfirmProposal = useCallback(async (p: Proposal) => {
    try {
      if (p.tool === "propose_create_site") {
        const result = await createSite.mutateAsync(p.input as { domain: string; name: string });
        void recordAction.mutate({ action: p.tool, success: true, payload: { ...p.input, siteId: result.id } });
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Site **${(p.input as { domain: string }).domain}** added successfully!` }]);
        router.push(`/sites/${result.id}`);
      } else if (p.tool === "propose_trigger_scan") {
        await triggerScan.mutateAsync(p.input as { siteId: string });
        void recordAction.mutate({ action: p.tool, success: true, payload: p.input });
        setChatMessages((prev) => [...prev, { role: "assistant", content: "Scan triggered! You can check progress on the site page." }]);
      } else if (p.tool === "suggest_navigation") {
        const path = (p.input as { path: string }).path;
        router.push(path);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
    }
    setProposals((prev) => prev.filter((x) => x.id !== p.id));
  }, [createSite, triggerScan, recordAction, router]);

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const quickChip = (text: string) => {
    setChatInput(text);
    setTimeout(() => chatInputRef.current?.focus(), 10);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-80 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-8 h-14 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-8 grid grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { stats, recentActivity, siteCount } = data;
  const score = stats.complianceScore;
  const rc = riskColor(score);

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-8">
      {/* ── Welcome Hero ── */}
      <section>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {greeting()}, {firstName(me?.name, me?.email)}
        </h1>
        <p className="mt-1.5 text-base text-slate-500 dark:text-slate-400">
          {siteCount > 0
            ? `Monitoring ${siteCount} site${siteCount > 1 ? "s" : ""} for ${me?.org?.name ?? "your organization"}`
            : "Let\u2019s set up your first site and start monitoring"}
        </p>
      </section>

      {/* ── Inline Chat ── */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Messages area */}
        {chatMessages.length > 0 && (
          <div className="max-h-80 overflow-y-auto px-5 pt-4 pb-2 space-y-3">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-navy-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-md"
                }`}>
                  {m.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{m.content}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {/* Proposals */}
            {proposals.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {proposals.map((p) => (
                  <button key={p.id} type="button" onClick={() => handleConfirmProposal(p)}
                    className="rounded-lg border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-100 dark:border-navy-800 dark:bg-navy-950/30 dark:text-navy-300 dark:hover:bg-navy-900/40">
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input bar */}
        <div className={`flex items-end gap-2 px-4 ${chatMessages.length > 0 ? "border-t border-slate-100 dark:border-slate-800 py-3" : "py-4"}`}>
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKey}
            placeholder="Ask anything — scan a site, check compliance, build a policy…"
            rows={1}
            disabled={chat.isPending}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:focus:bg-slate-800"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!chatInput.trim() || chat.isPending}
            className="shrink-0 rounded-xl bg-navy-600 p-3 text-white hover:bg-navy-700 disabled:opacity-40 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>

        {/* Quick action chips (shown when no messages) */}
        {chatMessages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-5 pb-4 -mt-1">
            {[
              { label: "Run a scan on my sites", icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" },
              { label: "Check my compliance status", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" },
              { label: "Create a privacy policy", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" },
            ].map((chip) => (
              <button key={chip.label} type="button" onClick={() => quickChip(chip.label)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-navy-300 hover:text-navy-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-navy-600 dark:hover:text-navy-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={chip.icon} /></svg>
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Stats Grid ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Compliance Score */}
        <div className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900`}>
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
              {score != null && (
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6"
                  strokeDasharray={`${(score / 100) * 251.33} 251.33`}
                  strokeLinecap="round" transform="rotate(-90 48 48)"
                  className={rc.ring} style={{ transition: "stroke-dasharray 1s ease" }} />
              )}
            </svg>
            <span className={`text-xl font-bold ${rc.text}`}>{score ?? "—"}</span>
          </div>
          <p className={`mt-2 text-xs font-semibold ${rc.text}`}>{riskLabel(score)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Compliance Score</p>
        </div>

        {/* Open Trackers */}
        <Link href="/sites"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Open Trackers</p>
            <span className={`h-2 w-2 rounded-full ${stats.trackerCount === 0 ? "bg-emerald-500" : "bg-red-500"}`} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{stats.trackerCount}</p>
          <p className={`mt-1 text-[11px] ${stats.trackerCount === 0 ? "text-emerald-500" : "text-red-400"}`}>
            {stats.trackerCount === 0 ? "All clear" : "Unresolved findings"}
          </p>
        </Link>

        {/* Data Requests */}
        <Link href="/dsars"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Requests</p>
            <span className={`h-2 w-2 rounded-full ${stats.openDsars === 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{stats.openDsars}</p>
          <p className={`mt-1 text-[11px] ${stats.openDsars === 0 ? "text-emerald-500" : "text-amber-400"}`}>
            {stats.openDsars === 0 ? "No pending requests" : "Awaiting action"}
          </p>
        </Link>

        {/* Privacy Policy */}
        <Link href="/sites"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Privacy Policy</p>
            <span className={`h-2 w-2 rounded-full ${stats.policyStatus === "Up to date" ? "bg-emerald-500" : "bg-amber-500"}`} />
          </div>
          <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{stats.policyStatus}</p>
          <p className={`mt-1 text-[11px] ${stats.policyStatus === "Up to date" ? "text-emerald-500" : "text-amber-400"}`}>
            {stats.policySubtext}
          </p>
        </Link>
      </section>

      {/* ── Bottom: Actions + Activity ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Priority Actions */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Priority Actions</h2>
          <div className="space-y-3">
            {siteCount === 0 && (
              <ActionCard color="navy" icon="plus" title="Add your first website" description="Start monitoring your privacy compliance" href="/sites" />
            )}
            {stats.trackerCount > 0 && (
              <ActionCard color="red" icon="alert" title={`Fix ${stats.trackerCount} tracker issue${stats.trackerCount > 1 ? "s" : ""}`} description="Unresolved trackers could violate privacy regulations" href="/sites" />
            )}
            {stats.openDsars > 0 && (
              <ActionCard color="amber" icon="inbox" title={`Respond to ${stats.openDsars} data request${stats.openDsars > 1 ? "s" : ""}`} description="Open requests need your attention" href="/dsars" />
            )}
            {stats.policyStatus !== "Up to date" && (
              <ActionCard color="navy" icon="doc"
                title={stats.policyStatus === "No policy" ? "Create a privacy policy" : "Review your privacy policy"}
                description={stats.policyStatus === "No policy" ? "Required by most privacy regulations" : "Your policy draft needs publishing"} href="/sites" />
            )}
            {siteCount > 0 && stats.trackerCount === 0 && stats.openDsars === 0 && stats.policyStatus === "Up to date" && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <svg className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">All caught up</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400/70">No urgent compliance actions needed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500">No activity yet. Run a scan or add a site to see events here.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              {recentActivity.slice(0, 8).map((item, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-100 dark:border-slate-800/50" : ""}`}>
                  <div className="relative mt-1 flex flex-col items-center">
                    <span className={`h-2 w-2 rounded-full ${
                      item.type === "compliant" ? "bg-emerald-500" :
                      item.type === "warning" ? "bg-amber-500" :
                      item.type === "violation" ? "bg-red-500" : "bg-slate-400"
                    }`} />
                    {i < Math.min(recentActivity.length, 8) - 1 && (
                      <span className="absolute top-3 h-full w-px bg-slate-100 dark:bg-slate-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{item.action}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                    {formatRelativeTime(item.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ─── Local components ─── */

const BORDER_COLORS = {
  red: "border-l-red-500",
  amber: "border-l-amber-500",
  navy: "border-l-navy-500",
  emerald: "border-l-emerald-500",
};

const ICON_COLORS = {
  red: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  navy: "bg-navy-100 text-navy-600 dark:bg-navy-950/40 dark:text-navy-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
};

const ICON_PATHS = {
  plus: "M12 4.5v15m7.5-7.5h-15",
  alert: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
  inbox: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859",
  doc: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z",
};

function ActionCard({ color, icon, title, description, href }: {
  color: keyof typeof BORDER_COLORS;
  icon: keyof typeof ICON_PATHS;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}
      className={`flex items-center gap-4 rounded-xl border border-slate-200 border-l-[3px] ${BORDER_COLORS[color]} bg-white p-4 transition-all hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_COLORS[color]}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[icon]} />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <svg className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

const mdComponents: Record<string, React.ComponentType<React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>> = {
  p: ({ children, ...props }) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
  strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
  ul: ({ children, ...props }) => <ul className="mb-2 ml-3 list-disc space-y-0.5 last:mb-0" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="mb-2 ml-3 list-decimal space-y-0.5 last:mb-0" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="pl-0.5" {...props}>{children}</li>,
  a: ({ children, ...props }) => (
    <a className="font-medium text-navy-600 underline dark:text-navy-400" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  code: ({ children, className, ...props }) => {
    if (className?.includes("language-")) {
      return <pre className="my-2 overflow-x-auto rounded-md bg-slate-900 px-2.5 py-2 text-[11px] text-slate-200 dark:bg-black/40"><code {...props}>{children}</code></pre>;
    }
    return <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px] font-mono dark:bg-slate-700" {...props}>{children}</code>;
  },
  pre: ({ children }) => <>{children}</>,
};
