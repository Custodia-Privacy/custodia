# Shareable Scan Reports — Implementation Spec

## Concept
After running a free scan in the hero/scan page, show a "Share your results" button. The link lets anyone see the scan report without logging in. Creates a viral loop: founders share their compliance score with their team or on social media.

## Routes Needed

### `/report/[scanId]` (new public page)
- Shows the full quick scan results for a given scanId
- No auth required
- Uses the existing `api.scan.quickResult` endpoint (already public)
- Graceful "scan not found" fallback

### Hero/scan page change
- After scan completes, add a "Share results" button below the scan output
- Copies `/report/[scanId]` URL to clipboard on click
- Shows "Link copied!" confirmation

## Implementation Plan

### 1. `src/app/(marketing)/report/[scanId]/page.tsx`

```tsx
"use client";

import { useParams } from "next/navigation";
import { api } from "@/lib/trpc";

// Reuse FindingRow component (copy from hero.tsx or scan/page.tsx)
// SEVERITY_STYLE and CATEGORY_STYLE constants

export default function ReportPage() {
  const params = useParams();
  const scanId = params.scanId as string;

  const result = api.scan.quickResult.useQuery({ scanId });
  const data = result.data;

  if (result.isLoading) return <div className="...">Loading report…</div>;
  if (!data || data.status === "failed") return <div className="...">Report not found.</div>;
  if (data.status !== "completed") return <div className="...">Scan in progress…</div>;

  const issueCount = data.findings.filter(f => f.severity === "critical" || f.severity === "warning").length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Privacy Scan Report</p>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">{data.domain}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {issueCount === 0 ? "No compliance issues detected." : `${issueCount} issue${issueCount > 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {data.findings.map(f => (
            <FindingRow key={f.id} severity={f.severity} title={f.title} subtitle={f.description} category={f.category} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-navy-200 bg-navy-50 p-6 text-center dark:border-navy-800 dark:bg-navy-950/40">
          <p className="text-sm font-semibold text-navy-900 dark:text-navy-200">Want to fix these issues?</p>
          <p className="mt-1 text-xs text-navy-600 dark:text-navy-400">Custodia handles consent banners, privacy policies, and DSAR management from $29/mo.</p>
          <a href="/signup" className="mt-4 inline-block rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-900">
            Get Started Free →
          </a>
          <p className="mt-3 text-xs text-navy-500">Or <a href="/scan" className="underline">scan your own website</a> — free, no signup required</p>
        </div>
      </div>
    </main>
  );
}
```

### 2. Hero/scan page — add share button after results

In `src/components/landing/hero.tsx` and `src/app/(marketing)/scan/page.tsx`, after the results CTA block, add:

```tsx
{/* Share */}
<div className="mt-4 flex items-center gap-2">
  <button
    onClick={() => {
      const url = `${window.location.origin}/report/${scanId}`;
      void navigator.clipboard.writeText(url);
      // show "Copied!" briefly
    }}
    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy-700"
  >
    <svg className="h-3.5 w-3.5" ...share icon... />
    Share these results
  </button>
</div>
```

## Why This Matters
1. **Viral loop**: People share their compliance report with team members or on social → new visitors see the report → click "scan your own website" → enter the funnel
2. **Trust builder**: Seeing real results from a real site is more credible than any marketing copy
3. **Low implementation cost**: The data model already exists (quick scans are in the DB, already publicly accessible via tRPC)

## Priority
High — implement in the next available build window.
