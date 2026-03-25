"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/trpc";

export default function PolicyPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const utils = api.useUtils();
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: policy, isLoading, error } = api.policy.get.useQuery(
    { siteId },
    { enabled: !!siteId },
  );

  const generate = api.policy.generate.useMutation({
    onSuccess: () => {
      setSaveError(null);
      void utils.policy.get.invalidate({ siteId });
      void utils.policy.versions.invalidate({ siteId });
    },
    onError: (e) => setSaveError(e.message),
  });

  const publish = api.policy.publish.useMutation({
    onSuccess: () => {
      setSaveError(null);
      void utils.policy.get.invalidate({ siteId });
    },
    onError: (e) => setSaveError(e.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading policy…</p>
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

  const html = policy?.contentHtml?.trim();
  const markdownFallback = policy?.contentMarkdown;

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

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy policy</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stored in <code className="text-xs">policies</code> for this site. Generate uses your latest completed
            scan + AI.
          </p>
          {policy && (
            <p className="mt-2 text-xs text-slate-400">
              Version {policy.version}
              {policy.generatedAt && ` · Generated ${new Date(policy.generatedAt).toLocaleString()}`}
              {policy.publishedAt && ` · Published ${new Date(policy.publishedAt).toLocaleString()}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={generate.isPending}
            onClick={() => generate.mutate({ siteId })}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {generate.isPending ? "Regenerating…" : "Regenerate"}
          </button>
          <button
            type="button"
            disabled={!policy || publish.isPending}
            onClick={() => publish.mutate({ siteId })}
            className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600 dark:hover:bg-navy-500"
          >
            {publish.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {saveError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {saveError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
            {!policy ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No policy row yet. Run a completed scan, then click <strong>Regenerate</strong> to create one in the
                database.
              </p>
            ) : html ? (
              <article
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 dark:text-slate-200">
                {markdownFallback ?? "(empty)"}
              </pre>
            )}
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="font-medium text-slate-900 dark:text-white">How it works</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>Run a scan on this site to detect trackers and cookies</li>
              <li>Click <strong>Regenerate</strong> to create or update the policy using AI</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
