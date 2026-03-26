"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/trpc";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Proposal {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  label: string;
}

const mdComponents: Record<string, React.ComponentType<React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>> = {
  p: ({ children, ...props }) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
  strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
  em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
  ul: ({ children, ...props }) => <ul className="mb-2 ml-3 list-disc space-y-0.5 last:mb-0" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="mb-2 ml-3 list-decimal space-y-0.5 last:mb-0" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="pl-0.5" {...props}>{children}</li>,
  h1: ({ children, ...props }) => <h1 className="mb-1.5 text-sm font-bold" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="mb-1.5 text-[13px] font-bold" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="mb-1 text-xs font-bold" {...props}>{children}</h3>,
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-md bg-slate-900 px-2.5 py-2 text-[11px] leading-relaxed text-slate-200 dark:bg-black/40">
          <code {...props}>{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px] font-mono dark:bg-slate-700" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ children, ...props }) => (
    <a className="font-medium text-navy-600 underline dark:text-navy-400" target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-1.5 border-l-2 border-slate-300 pl-2 italic text-slate-500 dark:border-slate-600 dark:text-slate-400" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-2 border-slate-200 dark:border-slate-700" {...props} />,
  table: ({ children, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full text-[11px]" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }) => <th className="border-b border-slate-200 px-1.5 py-1 text-left font-semibold dark:border-slate-700" {...props}>{children}</th>,
  td: ({ children, ...props }) => <td className="border-b border-slate-100 px-1.5 py-1 dark:border-slate-800" {...props}>{children}</td>,
};

const TOOL_ICON: Record<string, string> = {
  propose_create_site: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418",
  propose_trigger_scan: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
  suggest_navigation: "M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3",
  propose_create_dsar: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  propose_update_dsar_status: "M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21l3.75-3.75",
};

export function AIAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = api.assistant.chat.useMutation();
  const utils = api.useUtils();

  const createSite = api.site.create.useMutation({
    onSuccess: () => { void utils.site.list.invalidate(); },
  });
  const triggerScan = api.scan.trigger.useMutation();
  const createDsar = api.dsar.create.useMutation({
    onSuccess: () => { void utils.dsar.list.invalidate(); void utils.dsar.stats.invalidate(); },
  });
  const updateDsarStatus = api.dsar.updateStatus.useMutation({
    onSuccess: () => { void utils.dsar.list.invalidate(); void utils.dsar.stats.invalidate(); },
  });
  const recordAction = api.assistant.recordConfirmedAction.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || chat.isPending) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setProposals([]);

    chat.mutate(
      { messages: newMessages.slice(-20) },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
          if (data.proposals.length) setProposals(data.proposals);
        },
        onError: (err) => {
          setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
        },
      },
    );
  }, [input, messages, chat]);

  const handleConfirmProposal = useCallback(async (p: Proposal) => {
    setProposals((prev) => prev.filter((x) => x.id !== p.id));
    try {
      if (p.tool === "propose_create_site") {
        const domain = String(p.input.domain);
        await createSite.mutateAsync({ domain, name: String(p.input.name ?? domain) });
        setMessages((prev) => [...prev, { role: "assistant", content: `**Done.** Site \`${domain}\` added and a scan has been queued.` }]);
        await recordAction.mutateAsync({ action: "assistant_create_site", payload: p.input as any, success: true });
      } else if (p.tool === "propose_trigger_scan") {
        await triggerScan.mutateAsync({ siteId: String(p.input.siteId), type: "full" });
        setMessages((prev) => [...prev, { role: "assistant", content: "**Done.** Scan queued. Check results in **My Sites**." }]);
        await recordAction.mutateAsync({ action: "assistant_trigger_scan", payload: p.input as any, success: true });
      } else if (p.tool === "suggest_navigation") {
        router.push(String(p.input.path));
        await recordAction.mutateAsync({ action: "assistant_navigate", payload: p.input as any, success: true });
      } else if (p.tool === "propose_create_dsar") {
        await createDsar.mutateAsync(p.input as any);
        setMessages((prev) => [...prev, { role: "assistant", content: `**Done.** Data request created for **${p.input.requesterName}** (${p.input.requestType}).` }]);
        await recordAction.mutateAsync({ action: "assistant_create_dsar", payload: p.input as any, success: true });
      } else if (p.tool === "propose_update_dsar_status") {
        await updateDsarStatus.mutateAsync({ id: String(p.input.id), status: String(p.input.status) as any });
        setMessages((prev) => [...prev, { role: "assistant", content: `**Done.** Request status updated to **${p.input.status}**.` }]);
        await recordAction.mutateAsync({ action: "assistant_update_dsar", payload: p.input as any, success: true });
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `**Failed:** ${err?.message ?? "Unknown error"}` }]);
      void recordAction.mutateAsync({ action: p.tool as any, payload: p.input as any, success: false, errorMessage: err?.message });
    }
  }, [createSite, triggerScan, createDsar, updateDsarStatus, recordAction, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating trigger — hidden when drawer is open */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-navy-600 text-white shadow-lg ring-2 ring-white/20 transition-all hover:bg-navy-700 hover:scale-105 active:scale-95 dark:ring-slate-800"
          aria-label="Open AI assistant"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </button>
      )}

      {/* Backdrop (mobile) */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-950 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-900">
            <svg className="h-3.5 w-3.5 text-navy-600 dark:text-navy-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Custodia AI</p>
            <p className="text-[10px] text-slate-400">Can run scans, create requests, navigate &mdash; ask anything</p>
          </div>
          <button
            type="button"
            onClick={() => { setMessages([]); setProposals([]); }}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Clear conversation"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-900">
                <svg className="h-5 w-5 text-navy-600 dark:text-navy-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">How can I help?</p>
              <p className="mt-1 max-w-[260px] text-xs text-slate-400">
                I can run scans, create data requests, update statuses, explain compliance topics, and more.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {["Run a scan on my site", "Create a data request", "What's my compliance status?", "Explain GDPR consent"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0); }}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 transition-colors hover:border-navy-300 hover:bg-navy-50 hover:text-navy-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-navy-700 dark:hover:bg-navy-950 dark:hover:text-navy-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-navy-600 text-white"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}>
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {chat.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Proposals */}
          {proposals.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Suggested actions</p>
              {proposals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void handleConfirmProposal(p)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-navy-200 bg-navy-50/70 px-3.5 py-2.5 text-left text-[13px] font-medium text-navy-700 transition-colors hover:bg-navy-100 dark:border-navy-800 dark:bg-navy-950/50 dark:text-navy-300 dark:hover:bg-navy-900/60"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={TOOL_ICON[p.tool] ?? "m4.5 12.75 6 6 9-13.5"} />
                  </svg>
                  <span className="flex-1">{p.label}</span>
                  <span className="text-[10px] font-normal text-navy-500 dark:text-navy-400">Run</span>
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or request an action..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-navy-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              style={{ maxHeight: 120 }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={chat.isPending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-600 text-white transition-colors hover:bg-navy-700 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
