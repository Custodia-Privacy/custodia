"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { DEFAULT_BANNER_CONFIG, type CookieDetail, type BannerCategory } from "@/lib/banner-defaults";

type BannerDraft = typeof DEFAULT_BANNER_CONFIG;

function deepMergeDraft(raw: unknown): BannerDraft {
  const base = structuredClone(DEFAULT_BANNER_CONFIG);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Record<string, unknown>;
  if (typeof r.position === "string") base.position = r.position as BannerDraft["position"];
  if (typeof r.theme === "string") base.theme = r.theme as BannerDraft["theme"];
  if (typeof r.primaryColor === "string") base.primaryColor = r.primaryColor;
  if (typeof r.backgroundColor === "string") base.backgroundColor = r.backgroundColor;
  if (typeof r.textColor === "string") base.textColor = r.textColor;
  if (typeof r.logoUrl === "string") base.logoUrl = r.logoUrl;
  if (typeof r.showLogo === "boolean") base.showLogo = r.showLogo;
  if (typeof r.customCss === "string") base.customCss = r.customCss;
  if (r.content && typeof r.content === "object" && !Array.isArray(r.content)) {
    const c = r.content as Record<string, unknown>;
    if (typeof c.title === "string") base.content.title = c.title;
    if (typeof c.description === "string") base.content.description = c.description;
    if (typeof c.acceptAllText === "string") base.content.acceptAllText = c.acceptAllText;
    if (typeof c.rejectAllText === "string") base.content.rejectAllText = c.rejectAllText;
    if (typeof c.customizeText === "string") base.content.customizeText = c.customizeText;
    if (typeof c.privacyPolicyUrl === "string") base.content.privacyPolicyUrl = c.privacyPolicyUrl;
  }
  if (Array.isArray(r.categories)) {
    base.categories = r.categories.map((cat, i) => {
      const d = base.categories[i] ?? DEFAULT_BANNER_CONFIG.categories[0];
      if (!cat || typeof cat !== "object") return d;
      const o = cat as Record<string, unknown>;
      return {
        key: typeof o.key === "string" ? o.key : d.key,
        name: typeof o.name === "string" ? o.name : d.name,
        description: typeof o.description === "string" ? o.description : d.description,
        required: typeof o.required === "boolean" ? o.required : d.required,
        cookies: Array.isArray(o.cookies) ? o.cookies.map((c: any) => ({
          name: typeof c === "string" ? c : (c?.name ?? ""),
          purpose: c?.purpose ?? "",
          provider: c?.provider ?? "",
          expiry: c?.expiry ?? "",
          type: c?.type ?? "cookie",
        })) : d.cookies,
      };
    });
    if (base.categories.length === 0) base.categories = structuredClone(DEFAULT_BANNER_CONFIG.categories);
  }
  if (Array.isArray(r.vendors)) {
    base.vendors = r.vendors.map((v: any) => ({
      name: v?.name ?? "",
      purpose: v?.purpose ?? "",
      privacyUrl: v?.privacyUrl ?? "",
      country: v?.country ?? "",
    }));
  }
  return base;
}

export default function BannerPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const utils = api.useUtils();

  const [draft, setDraft] = useState<BannerDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const { data: banner, isLoading, error } = api.banner.get.useQuery({ siteId }, { enabled: !!siteId });

  const update = api.banner.update.useMutation({
    onSuccess: () => { setFormError(null); void utils.banner.get.invalidate({ siteId }); },
    onError: (e) => setFormError(e.message),
  });

  const publish = api.banner.publish.useMutation({
    onSuccess: () => { setFormError(null); void utils.banner.get.invalidate({ siteId }); },
    onError: (e) => setFormError(e.message),
  });

  const magicStyle = api.banner.magicStyle.useMutation({
    onSuccess: (data) => {
      setFormError(null);
      const d = draft ?? deepMergeDraft(banner?.config);
      set({
        ...d,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        theme: data.theme,
        logoUrl: data.logoUrl || d.logoUrl,
      });
    },
    onError: (e) => setFormError(e.message),
  });

  const cdnBase =
    typeof process.env.NEXT_PUBLIC_BANNER_CDN_URL === "string"
      ? process.env.NEXT_PUBLIC_BANNER_CDN_URL.replace(/\/$/, "")
      : `${typeof window !== "undefined" ? window.location.origin : ""}/api/banner`;

  if (isLoading) {
    return <div className="p-6 lg:p-8"><div className="h-6 w-48 rounded bg-slate-200 animate-pulse dark:bg-slate-800" /></div>;
  }

  if (error || !banner) {
    return (
      <div className="p-6 lg:p-8">
        <Link href={`/sites/${siteId}`} className="text-sm text-navy-600 hover:underline dark:text-navy-400">Back to site</Link>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error?.message ?? "No banner record."}</p>
      </div>
    );
  }

  const effectiveDraft = draft ?? deepMergeDraft(banner.config);
  const set = (next: BannerDraft) => setDraft(next);

  const updateCat = (key: string, patch: Partial<BannerCategory>) => {
    set({ ...effectiveDraft, categories: effectiveDraft.categories.map((c) => c.key === key ? { ...c, ...patch } : c) });
  };

  const addCategory = () => {
    const key = `custom_${Date.now()}`;
    set({ ...effectiveDraft, categories: [...effectiveDraft.categories, { key, name: "New Category", description: "", required: false, cookies: [] }] });
    setExpandedCat(key);
  };

  const removeCategory = (key: string) => {
    set({ ...effectiveDraft, categories: effectiveDraft.categories.filter((c) => c.key !== key) });
    if (expandedCat === key) setExpandedCat(null);
  };

  const addCookie = (catKey: string) => {
    const cat = effectiveDraft.categories.find((c) => c.key === catKey);
    if (!cat) return;
    updateCat(catKey, { cookies: [...cat.cookies, { name: "", purpose: "", provider: "", expiry: "", type: "cookie" }] });
  };

  const updateCookie = (catKey: string, idx: number, patch: Partial<CookieDetail>) => {
    const cat = effectiveDraft.categories.find((c) => c.key === catKey);
    if (!cat) return;
    const cookies = cat.cookies.map((c, i) => i === idx ? { ...c, ...patch } : c);
    updateCat(catKey, { cookies });
  };

  const removeCookie = (catKey: string, idx: number) => {
    const cat = effectiveDraft.categories.find((c) => c.key === catKey);
    if (!cat) return;
    updateCat(catKey, { cookies: cat.cookies.filter((_, i) => i !== idx) });
  };

  const addVendor = () => {
    set({ ...effectiveDraft, vendors: [...effectiveDraft.vendors, { name: "", purpose: "", privacyUrl: "", country: "" }] });
  };

  const updateVendor = (idx: number, patch: Partial<BannerDraft["vendors"][0]>) => {
    set({ ...effectiveDraft, vendors: effectiveDraft.vendors.map((v, i) => i === idx ? { ...v, ...patch } : v) });
  };

  const removeVendor = (idx: number) => {
    set({ ...effectiveDraft, vendors: effectiveDraft.vendors.filter((_, i) => i !== idx) });
  };

  const totalCookies = effectiveDraft.categories.reduce((s, c) => s + c.cookies.length, 0);
  const previewDoc = buildLivePreview(effectiveDraft);

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/sites/${siteId}?tab=banner`} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Consent Banner Editor</h1>
            {banner.publishedAt && (
              <p className="mt-0.5 text-xs text-slate-400">Last published {new Date(banner.publishedAt).toLocaleDateString()}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={magicStyle.isPending}
              onClick={() => magicStyle.mutate({ siteId })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/30"
            >
              {magicStyle.isPending ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM19.5 9.75l-.271-.949a2.5 2.5 0 0 0-1.716-1.716L16.563 6.813l.949-.27a2.5 2.5 0 0 0 1.716-1.717l.272-.949.271.949a2.5 2.5 0 0 0 1.716 1.716l.95.271-.95.272a2.5 2.5 0 0 0-1.716 1.716L19.5 9.75Z" />
                </svg>
              )}
              Magic Style
            </button>
            <button type="button" disabled={update.isPending} onClick={() => update.mutate({ siteId, config: effectiveDraft })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
              {update.isPending ? "Saving..." : "Save Draft"}
            </button>
            <button type="button" disabled={publish.isPending} onClick={() => publish.mutate({ siteId })}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50">
              {publish.isPending ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{formError}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor column */}
        <div className="space-y-5">
          {/* Script Blocking */}
          <div className="rounded-xl border border-navy-200 bg-navy-50/50 p-5 dark:border-navy-800 dark:bg-navy-950/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-4 w-4 text-navy-600 dark:text-navy-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <h2 className="text-sm font-semibold text-navy-700 dark:text-navy-300">Real Script Blocking</h2>
            </div>
            <p className="text-xs text-navy-600/80 dark:text-navy-400/80">
              When enabled, analytics and marketing scripts are blocked until the visitor gives consent. This is required for GDPR compliance.
            </p>
          </div>

          {/* Branding */}
          <Section title="Branding">
            <Field label="Logo URL" hint="PNG, SVG, or JPEG link. Leave empty for no logo.">
              <input type="url" value={effectiveDraft.logoUrl} placeholder="https://example.com/logo.png"
                onChange={(e) => set({ ...effectiveDraft, logoUrl: e.target.value })} className={inputCls} />
            </Field>
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <Field label="Position">
              <select value={effectiveDraft.position} onChange={(e) => set({ ...effectiveDraft, position: e.target.value as BannerDraft["position"] })} className={inputCls}>
                <option value="bottom">Bottom banner</option>
                <option value="bottom-left">Bottom left popup</option>
                <option value="bottom-right">Bottom right popup</option>
                <option value="center">Center modal</option>
              </select>
            </Field>
            <Field label="Theme">
              <select value={effectiveDraft.theme} onChange={(e) => set({ ...effectiveDraft, theme: e.target.value as BannerDraft["theme"] })} className={inputCls}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Button color">
                <input type="color" value={effectiveDraft.primaryColor.length === 7 ? effectiveDraft.primaryColor : "#4F46E5"}
                  onChange={(e) => set({ ...effectiveDraft, primaryColor: e.target.value })} className={colorCls} />
              </Field>
              <Field label="Background">
                <ColorWithReset value={effectiveDraft.backgroundColor} fallback={effectiveDraft.theme === "dark" ? "#1e293b" : "#ffffff"}
                  onChange={(v) => set({ ...effectiveDraft, backgroundColor: v })} />
              </Field>
              <Field label="Text color">
                <ColorWithReset value={effectiveDraft.textColor} fallback={effectiveDraft.theme === "dark" ? "#f1f5f9" : "#1e293b"}
                  onChange={(v) => set({ ...effectiveDraft, textColor: v })} />
              </Field>
            </div>
          </Section>

          {/* Banner Text */}
          <Section title="Banner Text">
            <Field label="Title">
              <input type="text" value={effectiveDraft.content.title}
                onChange={(e) => set({ ...effectiveDraft, content: { ...effectiveDraft.content, title: e.target.value } })} className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={effectiveDraft.content.description} rows={3}
                onChange={(e) => set({ ...effectiveDraft, content: { ...effectiveDraft.content, description: e.target.value } })} className={inputCls} />
            </Field>
            <Field label="Privacy policy URL">
              <input type="text" value={effectiveDraft.content.privacyPolicyUrl}
                onChange={(e) => set({ ...effectiveDraft, content: { ...effectiveDraft.content, privacyPolicyUrl: e.target.value } })} className={inputCls} />
            </Field>
          </Section>

          {/* Consent Categories — fully editable */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Consent Categories</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">{effectiveDraft.categories.length} categories · {totalCookies} cookies tracked</p>
              </div>
              <button type="button" onClick={addCategory}
                className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:border-navy-400 hover:text-navy-600 dark:border-slate-600 dark:text-slate-400">
                + Add category
              </button>
            </div>
            <div className="space-y-2">
              {effectiveDraft.categories.map((cat) => {
                const isOpen = expandedCat === cat.key;
                return (
                  <div key={cat.key} className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <button type="button" onClick={() => setExpandedCat(isOpen ? null : cat.key)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{cat.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{cat.cookies.length} cookies · {cat.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-medium ${cat.required ? "text-slate-400" : "text-navy-600 dark:text-navy-400"}`}>
                          {cat.required ? "Required" : "Optional"}
                        </span>
                        <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-4 py-3 space-y-3 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Name">
                            <input type="text" value={cat.name} onChange={(e) => updateCat(cat.key, { name: e.target.value })} className={inputCls} />
                          </Field>
                          <Field label="Key">
                            <input type="text" value={cat.key} disabled className={`${inputCls} opacity-50`} />
                          </Field>
                        </div>
                        <Field label="Description">
                          <input type="text" value={cat.description} onChange={(e) => updateCat(cat.key, { description: e.target.value })} className={inputCls} />
                        </Field>
                        {!cat.required && (
                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <input type="checkbox" checked={cat.required} onChange={(e) => updateCat(cat.key, { required: e.target.checked })}
                              className="rounded border-slate-300 text-navy-600 dark:border-slate-600" />
                            Mark as required (always on)
                          </label>
                        )}

                        {/* Per-cookie details */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cookies / trackers</p>
                            <button type="button" onClick={() => addCookie(cat.key)}
                              className="text-[10px] font-medium text-navy-600 hover:text-navy-700 dark:text-navy-400">+ Add</button>
                          </div>
                          {cat.cookies.length === 0 && (
                            <p className="text-[10px] italic text-slate-400">No cookies added yet. They&apos;ll be detected automatically by scans, or add manually.</p>
                          )}
                          {cat.cookies.map((ck, ci) => (
                            <div key={ci} className="mb-2 rounded-md border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                                <input type="text" value={ck.name} placeholder="Cookie name" onChange={(e) => updateCookie(cat.key, ci, { name: e.target.value })} className={miniInput} />
                                <input type="text" value={ck.provider} placeholder="Provider" onChange={(e) => updateCookie(cat.key, ci, { provider: e.target.value })} className={miniInput} />
                              </div>
                              <input type="text" value={ck.purpose} placeholder="Purpose" onChange={(e) => updateCookie(cat.key, ci, { purpose: e.target.value })} className={`${miniInput} w-full mb-1.5`} />
                              <div className="flex items-center gap-1.5">
                                <input type="text" value={ck.expiry} placeholder="Expiry (e.g. 1 year)" onChange={(e) => updateCookie(cat.key, ci, { expiry: e.target.value })} className={`${miniInput} flex-1`} />
                                <select value={ck.type} onChange={(e) => updateCookie(cat.key, ci, { type: e.target.value as CookieDetail["type"] })} className={`${miniInput} w-28`}>
                                  <option value="cookie">Cookie</option>
                                  <option value="localStorage">Local Storage</option>
                                  <option value="sessionStorage">Session Storage</option>
                                  <option value="pixel">Pixel</option>
                                  <option value="fingerprint">Fingerprint</option>
                                </select>
                                <button type="button" onClick={() => removeCookie(cat.key, ci)} className="text-slate-400 hover:text-red-500" title="Remove">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {!cat.required && (
                          <button type="button" onClick={() => removeCategory(cat.key)}
                            className="text-[11px] text-red-500 hover:text-red-600">Remove this category</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vendors / Subprocessors */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Vendors &amp; Subprocessors</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Listed in the consent preferences for GDPR transparency</p>
              </div>
              <button type="button" onClick={addVendor}
                className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:border-navy-400 hover:text-navy-600 dark:border-slate-600 dark:text-slate-400">
                + Add vendor
              </button>
            </div>
            {effectiveDraft.vendors.length === 0 && (
              <p className="text-[11px] italic text-slate-400">No vendors added. Add third-party services that process visitor data (e.g. Google Analytics, Hotjar).</p>
            )}
            {effectiveDraft.vendors.map((v, vi) => (
              <div key={vi} className="mb-2 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <input type="text" value={v.name} placeholder="Vendor name" onChange={(e) => updateVendor(vi, { name: e.target.value })} className={miniInput} />
                  <input type="text" value={v.country} placeholder="Country (e.g. US)" onChange={(e) => updateVendor(vi, { country: e.target.value })} className={miniInput} />
                </div>
                <input type="text" value={v.purpose} placeholder="Purpose (e.g. Web analytics)" onChange={(e) => updateVendor(vi, { purpose: e.target.value })} className={`${miniInput} w-full mb-1.5`} />
                <div className="flex items-center gap-1.5">
                  <input type="url" value={v.privacyUrl} placeholder="Privacy policy URL" onChange={(e) => updateVendor(vi, { privacyUrl: e.target.value })} className={`${miniInput} flex-1`} />
                  <button type="button" onClick={() => removeVendor(vi)} className="text-slate-400 hover:text-red-500" title="Remove vendor">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview column */}
        <div className="space-y-4">
          <div className="sticky top-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Live Preview</h2>
              <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <div className="pointer-events-none p-4 opacity-20">
                  <div className="mb-3 h-4 w-32 rounded bg-slate-300" />
                  <div className="mb-2 h-3 w-full rounded bg-slate-200" />
                  <div className="mb-2 h-3 w-3/4 rounded bg-slate-200" />
                </div>
                <iframe title="Banner preview" className="absolute inset-0 h-full w-full border-0" sandbox="allow-scripts allow-same-origin" srcDoc={previewDoc} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Embed Code</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Add this before the closing &lt;/head&gt; tag.</p>
              <code className="block rounded-lg bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 break-all">
                {`<script src="${cdnBase}/${siteId}.js" async></script>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- style constants ---------- */
const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const miniInput = "rounded-md border border-slate-200 px-2 py-1.5 text-[11px] dark:border-slate-600 dark:bg-slate-800 dark:text-white";
const colorCls = "h-9 w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700";

/* ---------- helper components ---------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function ColorWithReset({ value, fallback, onChange }: { value: string; fallback: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input type="color" value={value.length === 7 ? value : fallback} onChange={(e) => onChange(e.target.value)} className={colorCls} />
      {value && (
        <button type="button" onClick={() => onChange("")} className="shrink-0 text-slate-400 hover:text-red-500" title="Reset to theme default">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

/* ---------- Live preview generator ---------- */
function buildLivePreview(d: BannerDraft): string {
  const isDark = d.theme === "dark";
  const bannerBg = d.backgroundColor && /^#[0-9a-fA-F]{6}$/.test(d.backgroundColor) ? d.backgroundColor : (isDark ? "#1e293b" : "#ffffff");
  const bannerText = d.textColor && /^#[0-9a-fA-F]{6}$/.test(d.textColor) ? d.textColor : (isDark ? "#f1f5f9" : "#1e293b");
  const muted = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const accent = d.primaryColor || "#4F46E5";
  const pageBg = isDark ? "#f1f5f9" : "#1e293b";
  const isPopup = d.position.startsWith("bottom-");
  const isCenter = d.position === "center";

  let positionCss = "bottom:0;left:0;right:0;";
  if (d.position === "bottom-left") positionCss = "bottom:12px;left:12px;max-width:380px;border-radius:12px;";
  else if (d.position === "bottom-right") positionCss = "bottom:12px;right:12px;max-width:380px;border-radius:12px;";
  else if (isCenter) positionCss = "top:50%;left:50%;transform:translate(-50%,-50%);max-width:440px;border-radius:12px;";
  else positionCss += "border-top:1px solid " + border + ";";

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const proxiedLogo = d.logoUrl ? `/api/image-proxy?url=${encodeURIComponent(d.logoUrl)}` : "";
  const logoHtml = d.logoUrl ? `<img class="logo" src="${esc(proxiedLogo)}" alt="" onerror="this.style.display='none'" />` : "";

  const catHtml = d.categories.filter(c => !c.required).map(c =>
    `<label class="cat"><input type="checkbox" checked /><span class="cat-name">${esc(c.name)}</span><span class="cat-desc">${esc(c.description)}</span>${c.cookies.length ? `<span class="cat-count">${c.cookies.length} cookie${c.cookies.length > 1 ? "s" : ""}</span>` : ""}</label>`
  ).join("");

  const cookieTableRows = d.categories.flatMap(c => c.cookies.map(ck =>
    `<tr><td>${esc(ck.name || "—")}</td><td>${esc(c.name)}</td><td>${esc(ck.provider || "—")}</td><td>${esc(ck.purpose || "—")}</td><td>${esc(ck.expiry || "—")}</td></tr>`
  ));

  const vendorRows = d.vendors.map(v =>
    `<tr><td>${esc(v.name)}</td><td>${esc(v.purpose)}</td><td>${esc(v.country)}</td><td>${v.privacyUrl ? `<a href="${esc(v.privacyUrl)}" target="_blank">Policy</a>` : "—"}</td></tr>`
  );

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;background:${pageBg}}
.page-lines{position:absolute;inset:0;opacity:0.07;pointer-events:none}
.page-lines div{height:10px;margin:18px 24px;border-radius:4px;background:${isDark ? "#1e293b" : "#e2e8f0"}}
.page-lines div:nth-child(1){width:35%}.page-lines div:nth-child(2){width:80%}.page-lines div:nth-child(3){width:65%}.page-lines div:nth-child(4){width:45%}.page-lines div:nth-child(5){width:70%}
.banner{position:fixed;${positionCss}background:${bannerBg};color:${bannerText};padding:18px 22px;z-index:9999;${(isPopup || isCenter) ? `box-shadow:0 8px 32px rgba(0,0,0,${isDark ? "0.5" : "0.25"});border:1px solid ${border};` : `box-shadow:0 -4px 24px rgba(0,0,0,0.12);`}}
.header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.logo{height:24px;width:auto;object-fit:contain;flex-shrink:0}
.title{font-size:14px;font-weight:600}
.desc{font-size:12px;color:${muted};line-height:1.5;margin-bottom:14px}
.buttons{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:none;transition:opacity 0.15s}
.btn-accept{background:${accent};color:#fff}
.btn-reject{background:transparent;color:${bannerText};border:1px solid ${border}}
.btn-customize{background:transparent;color:${accent};border:none;font-size:12px;cursor:pointer;text-decoration:underline;padding:7px 4px}
.btn:hover{opacity:0.85}
${isCenter ? `.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998}` : ""}
.prefs{display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.4);justify-content:center;align-items:center}
.prefs.show{display:flex}
.prefs-panel{background:${bannerBg};color:${bannerText};border-radius:12px;padding:20px;max-width:520px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,0.3)}
.prefs-title{font-size:15px;font-weight:600;margin-bottom:12px}
.cat{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid ${border};cursor:pointer;font-size:12px}
.cat input{accent-color:${accent}}
.cat-name{font-weight:600;font-size:12px}
.cat-desc{width:100%;font-size:11px;color:${muted};padding-left:22px}
.cat-count{font-size:10px;color:${muted};margin-left:auto}
.section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${muted};margin:14px 0 6px;padding-top:8px;border-top:1px solid ${border}}
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
th{text-align:left;font-weight:600;padding:4px 6px;border-bottom:2px solid ${border};color:${muted}}
td{padding:4px 6px;border-bottom:1px solid ${border}}
a{color:${accent}}
.prefs-footer{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
${d.customCss || ""}
</style></head><body>
<div class="page-lines"><div></div><div></div><div></div><div></div><div></div></div>
${isCenter ? '<div class="overlay" id="overlay"></div>' : ""}
<div class="banner" id="banner">
<div class="header">${logoHtml}<div class="title">${esc(d.content.title)}</div></div>
<div class="desc">${esc(d.content.description)}</div>
<div class="buttons">
<button class="btn btn-accept">${esc(d.content.acceptAllText)}</button>
<button class="btn btn-reject">${esc(d.content.rejectAllText)}</button>
<button class="btn-customize" onclick="document.getElementById('prefs').classList.add('show');document.getElementById('banner').style.display='none';if(document.getElementById('overlay'))document.getElementById('overlay').style.display='none'">${esc(d.content.customizeText)}</button>
</div>
</div>
<div class="prefs" id="prefs">
<div class="prefs-panel">
<div class="prefs-title">Cookie preferences</div>
<p style="font-size:12px;color:${muted};margin-bottom:12px">Choose which categories of cookies you allow. Required cookies are always active.</p>
<label class="cat" style="opacity:0.6"><input type="checkbox" checked disabled /><span class="cat-name">Necessary</span><span class="cat-desc">Essential for the website to function. Always active.</span></label>
${catHtml}
${cookieTableRows.length ? `<div class="section-label">Cookie details</div><table><tr><th>Name</th><th>Category</th><th>Provider</th><th>Purpose</th><th>Expiry</th></tr>${cookieTableRows.join("")}</table>` : ""}
${vendorRows.length ? `<div class="section-label">Third-party vendors</div><table><tr><th>Vendor</th><th>Purpose</th><th>Country</th><th>Privacy</th></tr>${vendorRows.join("")}</table>` : ""}
<div class="prefs-footer">
<button class="btn btn-reject" onclick="document.getElementById('prefs').classList.remove('show');document.getElementById('banner').style.display=''">Cancel</button>
<button class="btn btn-accept">Save preferences</button>
</div>
</div>
</div>
</body></html>`;
}
