"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/trpc";
import { DEFAULT_POLICY_PAGE_STYLE, type PolicyPageStyle } from "@/lib/policy-page-defaults";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type ChatMsg = { role: "user" | "assistant"; content: string };
type Stage = "list" | "choose" | "chat" | "edit" | "view" | "style";
type PolicyTypeVal =
  | "privacy_policy"
  | "cookie_policy"
  | "terms_of_service"
  | "acceptable_use"
  | "data_processing"
  | "custom";

const POLICY_TYPES: { value: PolicyTypeVal; label: string }[] = [
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "cookie_policy", label: "Cookie Policy" },
  { value: "terms_of_service", label: "Terms of Service" },
  { value: "acceptable_use", label: "Acceptable Use Policy" },
  { value: "data_processing", label: "Data Processing Agreement" },
  { value: "custom", label: "Custom Policy" },
];

function typeLabel(t: string) {
  return POLICY_TYPES.find((p) => p.value === t)?.label ?? t.replace(/_/g, " ");
}

export default function PolicyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const siteId = params.siteId as string;
  const utils = api.useUtils();

  const typeFromUrl = (searchParams.get("type") as PolicyTypeVal) || null;
  const [activeType, setActiveType] = useState<PolicyTypeVal | null>(typeFromUrl);
  const [stage, setStage] = useState<Stage>(typeFromUrl ? "view" : "list");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [policyDraft, setPolicyDraft] = useState("");
  const [existingPolicy, setExistingPolicy] = useState("");
  const [input, setInput] = useState("");
  const [editBuffer, setEditBuffer] = useState("");
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");
  const [formError, setFormError] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [newType, setNewType] = useState<PolicyTypeVal>("privacy_policy");
  const [showPublishUrl, setShowPublishUrl] = useState(false);

  const [styleDraft, setStyleDraft] = useState<PolicyPageStyle | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: policyList, isLoading: listLoading } = api.policy.list.useQuery({ siteId }, { enabled: !!siteId });

  const { data: policy, isLoading: policyLoading } = api.policy.get.useQuery(
    { siteId, type: activeType! },
    { enabled: !!siteId && !!activeType },
  );

  const { data: pageStyle } = api.policy.getPageStyle.useQuery(
    { siteId },
    {
      enabled: !!siteId,
      initialData: DEFAULT_POLICY_PAGE_STYLE,
    },
  );

  const updatePageStyle = api.policy.updatePageStyle.useMutation({
    onSuccess: (data) => {
      setStyleDraft(data);
      void utils.policy.getPageStyle.invalidate({ siteId });
    },
    onError: (e) => setFormError(e.message),
  });

  const magicPageStyle = api.policy.magicPageStyle.useMutation({
    onSuccess: (data) => {
      setStyleDraft(data);
      setFormError(null);
      void utils.policy.getPageStyle.invalidate({ siteId });
    },
    onError: (e) => setFormError(e.message),
  });

  const { data: versions } = api.policy.versions.useQuery(
    { siteId, type: activeType! },
    { enabled: !!siteId && !!activeType && showVersions },
  );

  useEffect(() => {
    if (!policyLoading && activeType && !policy && stage === "view") {
      setStage("choose");
    }
  }, [policyLoading, activeType, policy, stage]);

  const invalidate = useCallback(() => {
    void utils.policy.list.invalidate({ siteId });
    if (activeType) void utils.policy.get.invalidate({ siteId, type: activeType });
    if (activeType) void utils.policy.versions.invalidate({ siteId, type: activeType });
  }, [utils, siteId, activeType]);

  const chat = api.policy.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setPolicyDraft(data.policyDraft);
      setFormError(null);
      setTimeout(() => chatInputRef.current?.focus(), 50);
    },
    onError: (e) => setFormError(e.message),
  });

  const generate = api.policy.generate.useMutation({
    onSuccess: () => { setFormError(null); invalidate(); setStage("view"); },
    onError: (e) => setFormError(e.message),
  });

  const updateManual = api.policy.update.useMutation({
    onSuccess: () => { setFormError(null); invalidate(); setActiveType(null); setStage("list"); },
    onError: (e) => setFormError(e.message),
  });

  const publish = api.policy.publish.useMutation({
    onSuccess: () => { setFormError(null); invalidate(); setShowPublishUrl(true); },
    onError: (e) => setFormError(e.message),
  });

  const saveDraftAsPolicy = api.policy.update.useMutation({
    onSuccess: () => {
      setFormError(null);
      invalidate();
      setMessages([]);
      setPolicyDraft("");
      setActiveType(null);
      setStage("list");
    },
    onError: (e) => setFormError(e.message),
  });

  const restoreVersion = api.policy.restoreVersion.useMutation({
    onSuccess: () => { invalidate(); setShowVersions(false); },
    onError: (e) => setFormError(e.message),
  });

  const deletePolicy = api.policy.delete.useMutation({
    onSuccess: () => {
      invalidate();
      setActiveType(null);
      setStage("list");
    },
    onError: (e) => setFormError(e.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChatFromScratch = useCallback(() => {
    setExistingPolicy("");
    setPolicyDraft("");
    setMessages([]);
    setStage("chat");
    const firstMsg: ChatMsg = { role: "user", content: `I'd like to create a ${typeLabel(activeType ?? "privacy_policy")} from scratch.` };
    setMessages([firstMsg]);
    chat.mutate({ siteId, type: activeType ?? "privacy_policy", messages: [firstMsg], currentDraft: "", existingPolicy: "" });
  }, [siteId, activeType, chat]);

  const [pasteBuffer, setPasteBuffer] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const startChatFromExisting = useCallback(() => {
    if (!pasteBuffer.trim()) return;
    setExistingPolicy(pasteBuffer);
    setPolicyDraft(pasteBuffer);
    setShowPaste(false);
    setStage("chat");
    const firstMsg: ChatMsg = { role: "user", content: "I have an existing policy I'd like to improve. Please review it and ask me questions to fill in any gaps." };
    setMessages([firstMsg]);
    chat.mutate({ siteId, type: activeType ?? "privacy_policy", messages: [firstMsg], currentDraft: pasteBuffer, existingPolicy: pasteBuffer });
  }, [siteId, activeType, pasteBuffer, chat]);

  const startChatFromCurrent = useCallback(() => {
    const md = policy?.contentMarkdown ?? "";
    setExistingPolicy(md);
    setPolicyDraft(md);
    setMessages([]);
    setStage("chat");
    const firstMsg: ChatMsg = { role: "user", content: "I want to update my existing policy. Please review it and ask me questions to improve it." };
    setMessages([firstMsg]);
    chat.mutate({ siteId, type: activeType ?? "privacy_policy", messages: [firstMsg], currentDraft: md, existingPolicy: md });
  }, [siteId, activeType, policy, chat]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    const newMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    chat.mutate({ siteId, type: activeType ?? "privacy_policy", messages: newMessages, currentDraft: policyDraft, existingPolicy });
  }, [input, messages, policyDraft, existingPolicy, siteId, activeType, chat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectPolicy = (type: PolicyTypeVal) => {
    setActiveType(type);
    setStage("view");
    setShowVersions(false);
    setShowPublishUrl(false);
  };

  const startNewPolicy = () => {
    setActiveType(newType);
    setStage("choose");
  };

  if (listLoading) {
    return <div className="p-6 lg:p-8"><div className="h-6 w-48 rounded bg-slate-200 animate-pulse dark:bg-slate-800" /></div>;
  }

  /* ═══════════════════════ LIST STAGE ═══════════════════════ */
  if (stage === "list" && !activeType) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-6">
          <Link href={`/sites/${siteId}`} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            Back
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Policies</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage all your legal documents in one place.</p>
            </div>
            <button
              type="button"
              onClick={() => { setStyleDraft(pageStyle ?? { ...DEFAULT_POLICY_PAGE_STYLE }); setStage("style"); }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>
                Page Styling
              </span>
            </button>
          </div>
        </div>

        {/* Existing policies */}
        {policyList && policyList.length > 0 && (
          <div className="mb-6 space-y-2">
            {policyList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPolicy(p.type as PolicyTypeVal)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{p.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    v{p.version} · Updated {new Date(p.updatedAt).toLocaleDateString()}
                    {p.publishedAt && <span className="ml-2 text-emerald-600 dark:text-emerald-400">Published</span>}
                  </p>
                </div>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Create new policy */}
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Create a new policy</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Policy type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as PolicyTypeVal)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {POLICY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value} disabled={policyList?.some((p) => p.type === pt.value)}>
                    {pt.label} {policyList?.some((p) => p.type === pt.value) ? "(exists)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={startNewPolicy}
              className="rounded-lg bg-navy-600 px-5 py-2 text-sm font-medium text-white hover:bg-navy-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════ STYLE EDITOR ═══════════════════════ */
  if (stage === "style" && styleDraft) {
    return (
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => { setStage("list"); setActiveType(null); }}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-2"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                Back to Policies
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Policy Page Styling</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Customize how your published policies look to visitors.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={magicPageStyle.isPending}
                onClick={() => magicPageStyle.mutate({ siteId })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/30"
              >
                {magicPageStyle.isPending ? (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM19.5 9.75l-.271-.949a2.5 2.5 0 0 0-1.716-1.716L16.563 6.813l.949-.27a2.5 2.5 0 0 0 1.716-1.717l.272-.949.271.949a2.5 2.5 0 0 0 1.716 1.716l.95.271-.95.272a2.5 2.5 0 0 0-1.716 1.716L19.5 9.75Z" />
                  </svg>
                )}
                Magic Style
              </button>
              <button
                type="button"
                disabled={updatePageStyle.isPending}
                onClick={() => updatePageStyle.mutate({ siteId, style: styleDraft })}
                className={btnPrimary}
              >
                {updatePageStyle.isPending ? "Saving..." : "Save Styling"}
              </button>
            </div>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{formError}</div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Live preview */}
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              style={{ backgroundColor: styleDraft.backgroundColor }}
            >
              {/* Nav preview */}
              <div className="border-b px-4 py-2.5" style={{ borderColor: styleDraft.accentColor + "30", backgroundColor: styleDraft.backgroundColor }}>
                <div className="flex items-center gap-3">
                  {styleDraft.logoUrl && <img src={styleDraft.logoUrl} alt="Logo" className="h-5 w-auto" />}
                  <div className="flex gap-1">
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: styleDraft.accentColor, color: "#fff" }}>Privacy Policy</span>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium" style={{ color: styleDraft.accentColor, backgroundColor: styleDraft.accentColor + "12" }}>Cookie Policy</span>
                  </div>
                </div>
              </div>
              {/* Content preview */}
              <div className="flex gap-6 p-6" style={{ fontFamily: styleDraft.fontFamily }}>
                <div className="hidden md:block w-36 shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: styleDraft.accentColor }}>On this page</p>
                  <div className="space-y-0.5 text-[11px]" style={{ color: styleDraft.fontColor, opacity: 0.55 }}>
                    <p>1. Who We Are</p>
                    <p>2. Data We Collect</p>
                    <p className="pl-2.5">Personal Information</p>
                    <p>3. Your Rights</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-extrabold mb-1" style={{ color: styleDraft.headingColor }}>Privacy Policy</h1>
                  <p className="text-[11px] mb-4" style={{ color: styleDraft.fontColor, opacity: 0.5 }}>Last updated: March 2026</p>
                  <h2 className="text-sm font-bold mt-3 mb-1" style={{ color: styleDraft.headingColor }}>1. Who We Are</h2>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: styleDraft.fontColor }}>
                    Company Name (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website. For questions, contact{" "}
                    <span style={{ color: styleDraft.accentColor }}>privacy@example.com</span>.
                  </p>
                  <h2 className="text-sm font-bold mt-3 mb-1" style={{ color: styleDraft.headingColor }}>2. Data We Collect</h2>
                  <p className="text-xs leading-relaxed" style={{ color: styleDraft.fontColor }}>
                    We collect data as described in our{" "}
                    <span style={{ color: styleDraft.accentColor, textDecoration: "underline", textDecorationColor: styleDraft.accentColor + "40" }}>Cookie Policy</span>.
                  </p>
                </div>
              </div>
              {/* Footer preview */}
              <div className="border-t px-6 py-3 text-center" style={{ borderColor: styleDraft.fontColor + "15" }}>
                {styleDraft.showPoweredBy && (
                  <p className="text-[10px]" style={{ color: styleDraft.fontColor, opacity: 0.35 }}>Powered by Custodia</p>
                )}
              </div>
            </div>

            {/* Controls panel */}
            <div className="space-y-5">
              <StyleSection title="Colors">
                <ColorField label="Background" value={styleDraft.backgroundColor} onChange={(v) => setStyleDraft({ ...styleDraft, backgroundColor: v })} />
                <ColorField label="Text" value={styleDraft.fontColor} onChange={(v) => setStyleDraft({ ...styleDraft, fontColor: v })} />
                <ColorField label="Headings" value={styleDraft.headingColor} onChange={(v) => setStyleDraft({ ...styleDraft, headingColor: v })} />
                <ColorField label="Accent / Links" value={styleDraft.accentColor} onChange={(v) => setStyleDraft({ ...styleDraft, accentColor: v })} />
              </StyleSection>

              <StyleSection title="Typography">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Font Family</span>
                  <select
                    value={styleDraft.fontFamily}
                    onChange={(e) => setStyleDraft({ ...styleDraft, fontFamily: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>
              </StyleSection>

              <StyleSection title="Branding">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Logo URL</span>
                  <input
                    type="url"
                    value={styleDraft.logoUrl}
                    onChange={(e) => setStyleDraft({ ...styleDraft, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.svg"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Logo links to (homepage URL)</span>
                  <input
                    type="url"
                    value={styleDraft.logoLink}
                    onChange={(e) => setStyleDraft({ ...styleDraft, logoLink: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              </StyleSection>

              <StyleSection title="Options">
                <ToggleField
                  label="Show table of contents"
                  checked={styleDraft.showTableOfContents}
                  onChange={(v) => setStyleDraft({ ...styleDraft, showTableOfContents: v })}
                />
                <ToggleField
                  label='Show "Powered by Custodia"'
                  checked={styleDraft.showPoweredBy}
                  onChange={(v) => setStyleDraft({ ...styleDraft, showPoweredBy: v })}
                />
              </StyleSection>

              <button
                type="button"
                onClick={() => setStyleDraft({ ...DEFAULT_POLICY_PAGE_STYLE })}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════ SINGLE POLICY VIEWS ═══════════════════════ */
  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="shrink-0 border-b border-slate-200 px-6 py-3 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setActiveType(null); setStage("list"); }}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
              All Policies
            </button>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {typeLabel(activeType ?? "privacy_policy")}
            </h1>
            {policy && stage === "view" && (
              <span className="text-xs text-slate-400">
                v{policy.version}
                {policy.publishedAt && ` · Published ${new Date(policy.publishedAt).toLocaleDateString()}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {stage === "chat" && policyDraft && (
              <>
                <button type="button" onClick={() => setStage(policy ? "view" : "choose")} className={btnSec}>Cancel</button>
                <button
                  type="button"
                  disabled={saveDraftAsPolicy.isPending || !policyDraft.trim()}
                  onClick={() => saveDraftAsPolicy.mutate({ siteId, type: activeType ?? "privacy_policy", contentMarkdown: policyDraft, changeNote: "Built via AI Q&A" })}
                  className={btnPrimary}
                >
                  {saveDraftAsPolicy.isPending ? "Saving..." : "Save Policy"}
                </button>
              </>
            )}
            {stage === "view" && policy && (
              <>
                <button type="button" onClick={() => setShowVersions(!showVersions)} className={btnSec}>
                  {showVersions ? "Hide History" : `History (v${policy.version})`}
                </button>
                <button type="button" onClick={startChatFromCurrent} className={btnSec}>Improve with AI</button>
                <button
                  type="button"
                  onClick={() => { setEditBuffer(policy.contentMarkdown ?? ""); setPreviewTab("write"); setStage("edit"); }}
                  className={btnSec}
                >
                  Edit
                </button>
                <button type="button" disabled={publish.isPending} onClick={() => publish.mutate({ siteId, type: activeType ?? "privacy_policy" })} className={btnPrimary}>
                  {publish.isPending ? "Publishing..." : "Publish"}
                </button>
              </>
            )}
            {stage === "edit" && (
              <>
                <button type="button" onClick={() => setStage("view")} className={btnSec}>Cancel</button>
                <button
                  type="button"
                  disabled={updateManual.isPending}
                  onClick={() => editBuffer.trim() && updateManual.mutate({ siteId, type: activeType ?? "privacy_policy", contentMarkdown: editBuffer, changeNote: "Manual edit" })}
                  className={btnPrimary}
                >
                  {updateManual.isPending ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {formError && (
        <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{formError}</div>
      )}

      {showPublishUrl && activeType && (
        <div className="mx-6 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Policy published!</p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                Your {typeLabel(activeType)} is now live. Add this link to your website footer:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded bg-white/80 px-2 py-1 text-xs text-emerald-900 dark:bg-slate-800 dark:text-emerald-300">
                  {`${APP_URL}/p/${siteId}/${activeType}`}
                </code>
                <button
                  type="button"
                  onClick={() => { void navigator.clipboard.writeText(`${APP_URL}/p/${siteId}/${activeType}`); }}
                  className="shrink-0 rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Copy
                </button>
                <a
                  href={`/p/${siteId}/${activeType}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-400"
                >
                  Open
                </a>
              </div>
              <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-500">
                JSON API: <code className="text-[10px]">{`${APP_URL}/api/public/policy/${siteId}?type=${activeType}`}</code>
              </p>
            </div>
            <button type="button" onClick={() => setShowPublishUrl(false)} className="shrink-0 text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ──── CHOOSE stage ──── */}
      {stage === "choose" && (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-4">
            <div className="text-center mb-8">
              <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Create your {typeLabel(activeType ?? "privacy_policy")}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Our AI walks you through a simple Q&A to build a complete, compliant policy tailored to your site.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button type="button" onClick={startChatFromScratch} disabled={chat.isPending}
                className="group rounded-xl border-2 border-dashed border-slate-200 p-6 text-left transition-colors hover:border-navy-300 hover:bg-navy-50/30 dark:border-slate-700 dark:hover:border-navy-700 dark:hover:bg-navy-950/20">
                <svg className="h-7 w-7 text-slate-300 group-hover:text-navy-500 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Start from scratch</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">AI will ask you questions and build your policy step by step.</p>
              </button>

              <button type="button" onClick={() => setShowPaste(true)}
                className="group rounded-xl border-2 border-dashed border-slate-200 p-6 text-left transition-colors hover:border-navy-300 hover:bg-navy-50/30 dark:border-slate-700 dark:hover:border-navy-700 dark:hover:bg-navy-950/20">
                <svg className="h-7 w-7 text-slate-300 group-hover:text-navy-500 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Start from existing</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paste your current policy and AI will review it, ask about gaps, and improve it.</p>
              </button>
            </div>

            <div className="text-center pt-2">
              <button type="button" onClick={() => generate.mutate({ siteId, type: activeType ?? "privacy_policy" })} disabled={generate.isPending}
                className="text-xs text-slate-400 hover:text-navy-600 dark:hover:text-navy-400 underline underline-offset-2">
                {generate.isPending ? "Generating..." : "Or quick-generate without Q&A (uses scan data only)"}
              </button>
            </div>

            {showPaste && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Paste your existing policy</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Plain text, Markdown, or HTML — the AI will understand it.</p>
                  <textarea value={pasteBuffer} onChange={(e) => setPasteBuffer(e.target.value)} placeholder="Paste your policy here..." rows={12}
                    className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-transparent px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-navy-400 focus:outline-none dark:border-slate-700 dark:text-slate-200" />
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => { setShowPaste(false); setPasteBuffer(""); }} className={btnSec}>Cancel</button>
                    <button type="button" disabled={!pasteBuffer.trim() || chat.isPending} onClick={startChatFromExisting} className={btnPrimary}>Start Q&A</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── CHAT stage — split pane ──── */}
      {stage === "chat" && (
        <div className="flex flex-1 min-h-0">
          <div className="flex w-full flex-col border-r border-slate-200 dark:border-slate-800 lg:w-[45%]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="rounded-lg bg-navy-50/50 px-3 py-2.5 dark:bg-navy-950/20">
                <p className="text-[11px] text-navy-700 dark:text-navy-300 leading-relaxed">
                  Answer the questions below to build your policy. The preview updates live on the right. When satisfied, hit <strong>Save Policy</strong>.
                </p>
              </div>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-navy-600 text-white rounded-br-md" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-md"}`}>
                    {m.role === "assistant" ? (
                      <article className="prose prose-sm prose-slate max-w-none dark:prose-invert [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </article>
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
              <div ref={chatEndRef} />
            </div>
            <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
              <div className="flex gap-2">
                <textarea ref={chatInputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your answer..." rows={1} disabled={chat.isPending}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-400 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-200" />
                <button type="button" onClick={sendMessage} disabled={!input.trim() || chat.isPending}
                  className="shrink-0 rounded-xl bg-navy-600 px-3 py-2 text-white hover:bg-navy-700 disabled:opacity-40">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-3 px-1">
                <button type="button" disabled={chat.isPending}
                  onClick={() => { const newM: ChatMsg[] = [...messages, { role: "user", content: "I'm done, please finalize the policy." }]; setMessages(newM); chat.mutate({ siteId, type: activeType ?? "privacy_policy", messages: newM, currentDraft: policyDraft, existingPolicy }); }}
                  className="text-[11px] text-slate-400 hover:text-navy-600 dark:hover:text-navy-400">Finalize policy</button>
                <span className="text-slate-200 dark:text-slate-700">|</span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">Shift+Enter for new line</span>
              </div>
            </div>
          </div>

          <div className="hidden flex-1 flex-col lg:flex">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Policy Preview</p>
              {policyDraft && <span className="text-[10px] text-slate-400">{policyDraft.length.toLocaleString()} chars</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {policyDraft ? (
                <article className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{policyDraft}</ReactMarkdown>
                </article>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-slate-300 dark:text-slate-600">Your policy will appear here as you answer questions...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── EDIT stage ──── */}
      {stage === "edit" && (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setPreviewTab("write")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${previewTab === "write" ? "border-navy-600 text-navy-600 dark:text-navy-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>Write</button>
              <button type="button" onClick={() => setPreviewTab("preview")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${previewTab === "preview" ? "border-navy-600 text-navy-600 dark:text-navy-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>Preview</button>
              <span className="ml-auto pr-3 text-[10px] text-slate-400">{editBuffer.length.toLocaleString()} chars · Markdown</span>
            </div>
            {previewTab === "write" ? (
              <textarea value={editBuffer} onChange={(e) => setEditBuffer(e.target.value)} rows={28}
                className="w-full resize-y border-0 bg-transparent px-5 py-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200" />
            ) : (
              <div className="px-5 py-4 min-h-[400px]">
                <article className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{editBuffer}</ReactMarkdown>
                </article>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── VIEW stage ──── */}
      {stage === "view" && policy && (
        <div className="flex flex-1 min-h-0">
          <div className={`flex-1 overflow-y-auto p-6 lg:p-8 ${showVersions ? "lg:pr-0" : ""}`}>
            {policy.publishedAt && !showPublishUrl && (
              <div className="max-w-5xl mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Published
                </span>
                <code className="flex-1 min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                  {`${APP_URL}/p/${siteId}/${activeType}`}
                </code>
                <button
                  type="button"
                  onClick={() => { void navigator.clipboard.writeText(`${APP_URL}/p/${siteId}/${activeType}`); }}
                  className="shrink-0 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Copy link
                </button>
                <a
                  href={`/p/${siteId}/${activeType}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-navy-600 hover:text-navy-700 dark:text-navy-400"
                >
                  Open
                </a>
              </div>
            )}
            <div className="max-w-5xl rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
              <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-navy-600 dark:prose-a:text-navy-400 prose-strong:text-slate-900 dark:prose-strong:text-white prose-table:text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{policy.contentMarkdown ?? ""}</ReactMarkdown>
              </article>
            </div>
            {/* Danger zone */}
            <div className="max-w-5xl mt-8 rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900 dark:bg-red-950/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete this policy</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/60">Permanently remove this policy and all its version history.</p>
                </div>
                <button type="button" disabled={deletePolicy.isPending}
                  onClick={() => { if (confirm("Are you sure? This cannot be undone.")) deletePolicy.mutate({ siteId, type: activeType! }); }}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30">
                  {deletePolicy.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>

          {/* Version history sidebar */}
          {showVersions && (
            <div className="hidden w-72 shrink-0 border-l border-slate-200 lg:block dark:border-slate-800">
              <div className="p-4">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">Version History</h3>
                {!versions?.length ? (
                  <p className="text-[11px] text-slate-400">No previous versions.</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((v) => (
                      <div key={v.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-900 dark:text-white">v{v.version}</span>
                          <span className="text-[10px] text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</span>
                        </div>
                        {v.changeNote && <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{v.changeNote}</p>}
                        <button
                          type="button"
                          disabled={restoreVersion.isPending}
                          onClick={() => restoreVersion.mutate({ versionId: v.id })}
                          className="text-[11px] font-medium text-navy-600 hover:text-navy-700 dark:text-navy-400"
                        >
                          Restore this version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state while fetching single policy */}
      {stage === "view" && policyLoading && (
        <div className="flex-1 flex items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      )}
    </div>
  );
}

/* ─── Style editor helpers ─── */

const FONT_OPTIONS = [
  { value: "system-ui, -apple-system, sans-serif", label: "System Default" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Georgia', serif", label: "Georgia (serif)" },
  { value: "'Merriweather', serif", label: "Merriweather (serif)" },
  { value: "'Lora', serif", label: "Lora (serif)" },
  { value: "'Source Sans 3', sans-serif", label: "Source Sans" },
  { value: "'DM Sans', sans-serif", label: "DM Sans" },
  { value: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans" },
  { value: "'Literata', serif", label: "Literata (serif)" },
];

function StyleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold text-slate-900 dark:text-white mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded border border-slate-200 px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? "bg-navy-600" : "bg-slate-200 dark:bg-slate-700"}`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </label>
  );
}

const btnSec = "rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
const btnPrimary = "rounded-lg bg-navy-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50";
