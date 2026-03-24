"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { DEFAULT_BANNER_CONFIG } from "@/lib/banner-defaults";

type BannerDraft = typeof DEFAULT_BANNER_CONFIG;

function deepMergeDraft(raw: unknown): BannerDraft {
  const base = structuredClone(DEFAULT_BANNER_CONFIG);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Record<string, unknown>;
  if (typeof r.position === "string") base.position = r.position as BannerDraft["position"];
  if (typeof r.theme === "string") base.theme = r.theme as BannerDraft["theme"];
  if (typeof r.primaryColor === "string") base.primaryColor = r.primaryColor;
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
        cookies: Array.isArray(o.cookies) ? (o.cookies.filter((x) => typeof x === "string") as string[]) : d.cookies,
      };
    });
    if (base.categories.length === 0) base.categories = structuredClone(DEFAULT_BANNER_CONFIG.categories);
  }
  return base;
}

export default function BannerPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const utils = api.useUtils();

  const [draft, setDraft] = useState<BannerDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: banner, isLoading, error } = api.banner.get.useQuery({ siteId }, { enabled: !!siteId });

  const { data: preview } = api.banner.preview.useQuery({ siteId }, { enabled: !!siteId && !!banner });

  const update = api.banner.update.useMutation({
    onSuccess: () => {
      setFormError(null);
      void utils.banner.get.invalidate({ siteId });
      void utils.banner.preview.invalidate({ siteId });
    },
    onError: (e) => setFormError(e.message),
  });

  const publish = api.banner.publish.useMutation({
    onSuccess: () => {
      setFormError(null);
      void utils.banner.get.invalidate({ siteId });
    },
    onError: (e) => setFormError(e.message),
  });

  const cdnBase =
    typeof process.env.NEXT_PUBLIC_BANNER_CDN_URL === "string"
      ? process.env.NEXT_PUBLIC_BANNER_CDN_URL.replace(/\/$/, "")
      : `${typeof window !== "undefined" ? window.location.origin : ""}/api/banner`;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading banner…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Link href={`/sites/${siteId}`} className="text-sm text-navy-600 hover:underline dark:text-navy-400">
          ← Back to site
        </Link>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error.message}</p>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">No banner record.</p>
      </div>
    );
  }

  const effectiveDraft = draft ?? deepMergeDraft(banner.config);

  const setEffectiveDraft = (next: BannerDraft) => {
    setDraft(next);
  };

  const previewDoc =
    preview &&
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${preview.css}</style></head><body>${preview.html}<script>${preview.js}</script></body></html>`;

  return (
    <div className="p-6 lg:p-8">
      <Link
        href={`/sites/${siteId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cookie consent banner</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Draft is saved to <code className="text-xs">banners.config</code>. Publish copies it to{" "}
            <code className="text-xs">published_config</code>.
          </p>
          {banner?.publishedAt && (
            <p className="mt-1 text-xs text-slate-400">
              Last published {new Date(banner.publishedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => update.mutate({ siteId, config: effectiveDraft })}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {update.isPending ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={publish.isPending}
            onClick={() => publish.mutate({ siteId })}
            className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600 dark:hover:bg-navy-500"
          >
            {publish.isPending ? "Publishing…" : "Publish changes"}
          </button>
        </div>
      </div>

      {formError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Position</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={effectiveDraft.position}
                  onChange={(e) =>
                    setEffectiveDraft({
                      ...effectiveDraft,
                      position: e.target.value as BannerDraft["position"],
                    })
                  }
                >
                  <option value="bottom">Bottom banner</option>
                  <option value="bottom-left">Bottom left popup</option>
                  <option value="bottom-right">Bottom right popup</option>
                  <option value="center">Center modal</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Theme</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={effectiveDraft.theme}
                  onChange={(e) =>
                    setEffectiveDraft({
                      ...effectiveDraft,
                      theme: e.target.value as BannerDraft["theme"],
                    })
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Primary color
                </label>
                <input
                  type="color"
                  value={effectiveDraft.primaryColor.length === 7 ? effectiveDraft.primaryColor : "#4F46E5"}
                  onChange={(e) =>
                    setEffectiveDraft({ ...effectiveDraft, primaryColor: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Copy</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Title</label>
                <input
                  type="text"
                  value={effectiveDraft.content.title}
                  onChange={(e) =>
                    setEffectiveDraft({
                      ...effectiveDraft,
                      content: { ...effectiveDraft.content, title: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  value={effectiveDraft.content.description}
                  onChange={(e) =>
                    setEffectiveDraft({
                      ...effectiveDraft,
                      content: { ...effectiveDraft.content, description: e.target.value },
                    })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Consent categories</h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              From the database config. Cookie names per category appear after scans enrich the banner.
            </p>
            <div className="space-y-3">
              {effectiveDraft.categories.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{cat.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.cookies.length} cookies listed
                    </p>
                  </div>
                  {cat.required ? (
                    <span className="text-xs text-slate-400">Always on</span>
                  ) : (
                    <span className="text-xs text-slate-500">Optional</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Live preview</h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Server-rendered from the last saved config. Click <strong>Save draft</strong> to refresh after edits.
          </p>
          <div className="relative min-h-[400px] overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="pointer-events-none p-4 opacity-30">
              <div className="mb-3 h-4 w-32 rounded bg-slate-300" />
              <div className="mb-2 h-3 w-full rounded bg-slate-200" />
              <div className="mb-2 h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>
            {previewDoc ? (
              <iframe
                title="Banner preview"
                className="absolute inset-0 h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={previewDoc}
              />
            ) : (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                No preview yet.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-navy-50 p-3 dark:bg-navy-950/30">
            <p className="text-xs text-navy-700 dark:text-navy-300">
              <strong>Embed:</strong> serve the banner script from your app or CDN.
            </p>
            <code className="mt-2 block break-all rounded bg-navy-100 px-3 py-2 font-mono text-[11px] text-navy-800 dark:bg-navy-900 dark:text-navy-200">
              {`<script src="${cdnBase}/${siteId}.js" async></script>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
