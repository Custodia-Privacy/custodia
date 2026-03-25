"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc";

const REQUEST_LABELS: Record<string, string> = {
  access: "Data access",
  deletion: "Data deletion",
  rectification: "Rectification",
  portability: "Portability",
  opt_out: "Opt-out",
  restrict_processing: "Restrict processing",
};

function statusBadge(
  status: string,
  dueDate: Date,
): { label: string; classes: string } {
  const now = new Date();
  const open = !["fulfilled", "rejected"].includes(status);
  if (open && dueDate < now) {
    return {
      label: "Overdue",
      classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  }
  const map: Record<string, { label: string; classes: string }> = {
    received: {
      label: "Received",
      classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    identity_verified: {
      label: "Verified",
      classes: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    processing: {
      label: "Processing",
      classes: "bg-navy-100 text-navy-700 dark:bg-navy-900/50 dark:text-navy-300",
    },
    data_collected: {
      label: "Data collected",
      classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    },
    review: {
      label: "In review",
      classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    fulfilled: {
      label: "Fulfilled",
      classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    rejected: {
      label: "Rejected",
      classes: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    },
    appealed: {
      label: "Appealed",
      classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    },
  };
  return (
    map[status] ?? {
      label: status,
      classes: "bg-slate-100 text-slate-600 dark:bg-slate-800",
    }
  );
}

function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silently fail */
    }
  }, []);
  return { copy, copied };
}

export default function DsarsPage() {
  const utils = api.useUtils();
  const { data: sites } = api.site.list.useQuery();
  const { data: list, isLoading } = api.dsar.list.useQuery({});
  const { data: stats } = api.dsar.stats.useQuery();
  const create = api.dsar.create.useMutation({
    onSuccess: () => {
      void utils.dsar.list.invalidate();
      void utils.dsar.stats.invalidate();
      setShowForm(false);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState<
    "access" | "deletion" | "rectification" | "portability" | "opt_out" | "restrict_processing"
  >("access");
  const [jurisdiction, setJurisdiction] = useState("gdpr");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [publicSiteId, setPublicSiteId] = useState("");
  const [origin, setOrigin] = useState("");
  const { copy: copyUrl, copied: urlCopied } = useCopyToClipboard();

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (sites?.length && !publicSiteId) {
      setPublicSiteId(sites[0]!.id);
    }
  }, [sites, publicSiteId]);

  const publicFormUrl =
    origin && publicSiteId ? `${origin}/request/${publicSiteId}` : "";
  const embedUrl =
    origin && publicSiteId ? `${origin}/embed/dsar/${publicSiteId}` : "";
  const embedSnippet = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border:none;max-width:560px;"></iframe>`
    : "";
  const { copy: copyEmbed, copied: embedCopied } = useCopyToClipboard();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">DSAR Requests</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Rows are stored in <code className="text-xs">dsar_requests</code>. Use{" "}
            <strong>New Request</strong> or <code className="text-xs">npm run db:seed</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500"
        >
          {showForm ? "Cancel" : "+ New Request"}
        </button>
      </div>

      {sites && sites.length > 0 && (
        <div className="mb-6 rounded-xl border border-navy-200 bg-navy-50/50 p-4 dark:border-navy-900 dark:bg-navy-950/30">
          <h2 className="text-sm font-semibold text-navy-950 dark:text-white">Public DSAR form</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Share this link on your privacy policy or contact page. Submissions create rows in{" "}
            <code className="text-[11px]">dsar_requests</code> and email the org owner when{" "}
            <code className="text-[11px]">RESEND_API_KEY</code> is set.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              Site
              <select
                value={publicSiteId}
                onChange={(e) => setPublicSiteId(e.target.value)}
                className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.domain}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {publicFormUrl && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="max-w-full break-all rounded bg-white px-2 py-1 text-[11px] dark:bg-slate-900">
                {publicFormUrl}
              </code>
              <button
                type="button"
                onClick={() => void copyUrl(publicFormUrl)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-white dark:border-slate-600 dark:hover:bg-slate-900"
              >
                {urlCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          {embedSnippet && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Embed on your site
              </p>
              <div className="flex flex-wrap items-start gap-2">
                <code className="block max-w-full break-all rounded bg-white px-2 py-1 text-[11px] dark:bg-slate-900">
                  {embedSnippet}
                </code>
                <button
                  type="button"
                  onClick={() => void copyEmbed(embedSnippet)}
                  className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-white dark:border-slate-600 dark:hover:bg-slate-900"
                >
                  {embedCopied ? "Copied!" : "Copy embed"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              requestType,
              jurisdiction,
              requesterName: requesterName.trim(),
              requesterEmail: requesterEmail.trim(),
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Type</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as typeof requestType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {Object.keys(REQUEST_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {REQUEST_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Jurisdiction code</label>
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="gdpr, ccpa, …"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Requester name</label>
              <input
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Requester email</label>
              <input
                required
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          {create.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{create.error.message}</p>
          )}
          <button
            type="submit"
            disabled={create.isPending}
            className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
          >
            {create.isPending ? "Saving…" : "Create DSAR"}
          </button>
        </form>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open", value: stats?.openCount ?? "—", color: "text-navy-600 dark:text-navy-400" },
          {
            label: "Processing",
            value: stats?.processingCount ?? "—",
            color: "text-navy-600 dark:text-navy-400",
          },
          { label: "Overdue", value: stats?.overdueCount ?? "—", color: "text-violation" },
          {
            label: "Fulfilled (this month)",
            value: stats?.fulfilledThisMonth ?? "—",
            color: "text-compliant",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {["ID", "Requester", "Type", "Jurisdiction", "Status", "Due", "Activities"].map(
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : !list?.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No DSARs yet. Create one above or run the seed script.
                  </td>
                </tr>
              ) : (
                list.map((row) => {
                  const badge = statusBadge(row.status, row.dueDate);
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        <Link href={`/dsars/${row.id}`} className="hover:underline">
                          {row.id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <Link href={`/dsars/${row.id}`}>
                          {row.requesterName}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {REQUEST_LABELS[row.requestType] ?? row.requestType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {row.jurisdiction}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                        {new Date(row.dueDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {row._count.activities}
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
