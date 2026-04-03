"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc";

function categoriesCount(config: unknown): number {
  if (config && typeof config === "object" && "categories" in config) {
    const c = (config as { categories?: unknown[] }).categories;
    return Array.isArray(c) ? c.length : 0;
  }
  return 0;
}

export default function PreferencesPage() {
  const utils = api.useUtils();
  const { data: centersData, isLoading } = api.preferences.listCenters.useQuery();
  const centers = centersData?.items ?? [];
  const [prefWebhookUrl, setPrefWebhookUrl] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!centers) return;
    setPrefWebhookUrl((prev) => {
      const next = { ...prev };
      for (const c of centers) {
        if (next[c.id] === undefined) {
          next[c.id] = c.privacyWebhookUrl ?? "";
        }
      }
      return next;
    });
  }, [centers]);

  const patchCenter = api.preferences.updateCenter.useMutation({
    onSuccess: async (data, vars) => {
      await utils.preferences.listCenters.invalidate();
      if (data.revealSecretOnce) {
        window.alert(
          `Preference webhook signing secret (copy now; shown once):\n\n${data.revealSecretOnce}`,
        );
      }
      if (vars.privacyWebhookUrl !== undefined) {
        setPrefWebhookUrl((p) => ({ ...p, [vars.centerId]: vars.privacyWebhookUrl ?? "" }));
      }
    },
  });

  const rotatePrefSecret = api.preferences.rotateCenterWebhookSecret.useMutation({
    onSuccess: async (data) => {
      await utils.preferences.listCenters.invalidate();
      if (data.revealSecretOnce) {
        window.alert(`New preference webhook secret (copy now):\n\n${data.revealSecretOnce}`);
      }
    },
  });

  const createCenter = api.preferences.createCenter.useMutation({
    onSuccess: () => {
      void utils.preferences.listCenters.invalidate();
      setOpen(false);
    },
  });

  const publishCenter = api.preferences.publishCenter.useMutation({
    onSuccess: () => void utils.preferences.listCenters.invalidate(),
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Preference Centers</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stored in <code className="text-xs">preference_centers</code> with JSON{" "}
            <code className="text-xs">config</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-navy-600"
        >
          {open ? "Cancel" : "+ New Center"}
        </button>
      </div>

      {open && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(e) => {
            e.preventDefault();
            createCenter.mutate({
              name: name.trim(),
              config: {
                categories: [
                  {
                    key: "marketing_email",
                    name: "Marketing email",
                    description: "Product updates and offers",
                    required: false,
                  },
                  {
                    key: "analytics",
                    name: "Analytics",
                    description: "Usage analytics",
                    required: false,
                  },
                ],
              },
            });
          }}
        >
          <label className="mb-1 block text-xs text-slate-500">Center name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <p className="mt-2 text-xs text-slate-500">
            Default categories (marketing + analytics) are added; edit via API or future UI.
          </p>
          {createCenter.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createCenter.error.message}</p>
          )}
          <button
            type="submit"
            disabled={createCenter.isPending}
            className="mt-3 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-navy-600"
          >
            {createCenter.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !centers?.length ? (
        <p className="text-sm text-slate-500">No preference centers yet.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {centers.map((center) => {
            const subs = center._count.preferences;
            const cats = categoriesCount(center.config);
            const published = !!center.publishedAt;
            return (
              <div
                key={center.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {center.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {center.site?.domain ?? "Org-wide (no site)"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      published
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    {published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {subs.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">Subscribers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{cats}</p>
                    <p className="text-xs text-slate-500">Categories</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {center.updatedAt.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">Updated</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {!published ? (
                    <button
                      type="button"
                      disabled={publishCenter.isPending}
                      onClick={() => publishCenter.mutate({ centerId: center.id })}
                      className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-900"
                    >
                      {publishCenter.isPending ? "Publishing…" : "Publish for public page"}
                    </button>
                  ) : origin ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Public link</p>
                      <code className="block break-all rounded bg-slate-50 px-2 py-1 text-[10px] dark:bg-slate-900">
                        {origin}/preference-center/{center.id}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          void navigator.clipboard.writeText(
                            `${origin}/preference-center/${center.id}`,
                          )
                        }
                        className="text-xs font-medium text-navy-700 hover:underline dark:text-navy-400"
                      >
                        Copy link
                      </button>
                    </div>
                  ) : null}
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Preference webhook
                    </p>
                    <p className="mb-2 text-[10px] text-slate-500 dark:text-slate-400">
                      Signed POST when a subscriber saves choices. Same{" "}
                      <code className="text-[10px]">X-Custodia-Signature</code> scheme as site consent webhooks.
                    </p>
                    <input
                      type="url"
                      className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="https://…"
                      value={prefWebhookUrl[center.id] ?? ""}
                      onChange={(e) =>
                        setPrefWebhookUrl((p) => ({ ...p, [center.id]: e.target.value }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={patchCenter.isPending}
                        onClick={() =>
                          patchCenter.mutate({
                            centerId: center.id,
                            privacyWebhookUrl: (prefWebhookUrl[center.id] ?? "").trim() || null,
                          })
                        }
                        className="rounded border border-slate-200 px-2 py-1 text-xs font-medium dark:border-slate-600"
                      >
                        Save webhook URL
                      </button>
                      {center.privacyWebhookSecretConfigured && center.privacyWebhookUrl ? (
                        <button
                          type="button"
                          disabled={rotatePrefSecret.isPending}
                          onClick={() => rotatePrefSecret.mutate({ centerId: center.id })}
                          className="rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                        >
                          Rotate secret
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
