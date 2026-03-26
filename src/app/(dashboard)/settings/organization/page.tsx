"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";

export default function OrganizationSettingsPage() {
  const utils = api.useUtils();
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#4f46e5");
  const [brandWebsite, setBrandWebsite] = useState("");

  const { data: summary, isLoading } = api.org.summary.useQuery();
  const { data: me } = api.user.me.useQuery();
  const { data: members, isLoading: membersLoading } = api.user.listTeamMembers.useQuery();

  const updateOrg = api.org.update.useMutation({
    onSuccess: () => {
      setBanner("Organization name saved.");
      void utils.org.summary.invalidate();
      void utils.user.me.invalidate();
    },
    onError: (e) => setBanner(e.message),
  });

  const invite = api.user.inviteTeamMember.useMutation({
    onSuccess: () => {
      setBanner("Invitation sent (if email is configured).");
      setInviteEmail("");
      void utils.user.listTeamMembers.invalidate();
    },
    onError: (e) => setBanner(e.message),
  });

  const removeMember = api.user.removeTeamMember.useMutation({
    onSuccess: () => {
      setBanner("Member removed.");
      void utils.user.listTeamMembers.invalidate();
      void utils.org.summary.invalidate();
    },
    onError: (e) => setBanner(e.message),
  });

  const setRole = api.user.updateTeamMemberRole.useMutation({
    onSuccess: () => {
      setBanner("Role updated.");
      void utils.user.listTeamMembers.invalidate();
    },
    onError: (e) => setBanner(e.message),
  });

  if (isLoading || !summary) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading organization…</p>
      </div>
    );
  }

  const [brandInitialized, setBrandInitialized] = useState(false);
  useEffect(() => {
    if (summary && !brandInitialized) {
      setBrandName(summary.branding?.brandName ?? "");
      setBrandLogoUrl(summary.branding?.brandLogoUrl ?? "");
      setBrandColor(summary.branding?.brandColor ?? "#4f46e5");
      setBrandWebsite(summary.branding?.brandWebsite ?? "");
      setBrandInitialized(true);
    }
  }, [summary, brandInitialized]);

  const updateBranding = api.org.update.useMutation({
    onSuccess: () => {
      setBanner("Branding saved. Your public forms will reflect the changes.");
      void utils.org.summary.invalidate();
    },
    onError: (e) => setBanner(e.message),
  });

  const displayName = orgName || summary.name;
  const canEditOrg = summary.role === "owner" || summary.role === "admin";
  const isOwner = summary.role === "owner";
  const isAdmin = summary.role === "admin";

  const firstSiteId = summary.sites?.[0]?.id;

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/settings"
        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        ← All settings
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        Organization &amp; team
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Org-wide settings and members. Data lives in <code className="text-xs">organizations</code> and{" "}
        <code className="text-xs">org_members</code>.
      </p>

      {banner && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {banner}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Organization</h2>
          <p className="mt-1 text-xs text-slate-500">Plan: {summary.plan}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Sites: <strong>{summary.counts.sites}</strong> · Members:{" "}
              <strong>{summary.counts.members}</strong>
            </p>
            <p>
              DSARs: <strong>{summary.counts.dsars}</strong> · Assessments:{" "}
              <strong>{summary.counts.assessments}</strong>
            </p>
          </div>

          {canEditOrg ? (
            <form
              className="mt-6 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setBanner(null);
                updateOrg.mutate({ name: displayName.trim() });
              }}
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setOrgName(e.target.value)}
                onFocus={() => {
                  if (!orgName) setOrgName(summary.name);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={updateOrg.isPending || !displayName.trim()}
                className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
              >
                {updateOrg.isPending ? "Saving…" : "Save organization"}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Only owners and admins can rename the organization.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Invite teammate</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Owners and admins can invite. Plan limits still apply.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setBanner(null);
              if (!inviteEmail.trim()) return;
              invite.mutate({ email: inviteEmail.trim(), role: "member" });
            }}
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={invite.isPending || !inviteEmail.trim()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-900"
            >
              {invite.isPending ? "Sending…" : "Invite"}
            </button>
          </form>
        </div>
      </div>

      {/* Branding section */}
      {canEditOrg && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Public branding</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Customize how your data request forms and public portals appear to visitors. No Custodia branding will be shown.
          </p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setBanner(null);
              updateBranding.mutate({
                brandName: brandName.trim() || null,
                brandLogoUrl: brandLogoUrl.trim() || null,
                brandColor: brandColor || null,
                brandWebsite: brandWebsite.trim() || null,
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Company name</label>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder={summary.name}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-400">Displayed on your public forms</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Website URL</label>
                <input
                  value={brandWebsite}
                  onChange={(e) => setBrandWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Logo URL</label>
                <input
                  value={brandLogoUrl}
                  onChange={(e) => setBrandLogoUrl(e.target.value)}
                  placeholder="https://yourcompany.com/logo.png"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-400">Direct link to your logo image</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Brand color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border border-slate-200 p-0.5 dark:border-slate-700"
                  />
                  <input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#4f46e5"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">Used for buttons and accents on your forms</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateBranding.isPending}
                className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
              >
                {updateBranding.isPending ? "Saving…" : "Save branding"}
              </button>
              {firstSiteId && (
                <a
                  href={`/request/${firstSiteId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-navy-600 hover:text-navy-700 dark:text-navy-400"
                >
                  Preview form →
                </a>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Members</h2>
        </div>
        {membersLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading members…</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(members ?? []).map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {m.user.name ?? m.user.email}
                  </p>
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{m.role}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isOwner && m.role !== "owner" && (
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      value={m.role === "admin" ? "admin" : "member"}
                      disabled={setRole.isPending}
                      onChange={(e) => {
                        setBanner(null);
                        setRole.mutate({
                          userId: m.user.id,
                          role: e.target.value as "admin" | "member",
                        });
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {me?.id &&
                    m.user.id !== me.id &&
                    m.role !== "owner" &&
                    (isOwner || (isAdmin && m.role === "member")) && (
                      <button
                        type="button"
                        disabled={removeMember.isPending}
                        onClick={() => {
                          setBanner(null);
                          if (confirm(`Remove ${m.user.email} from the organization?`)) {
                            removeMember.mutate({ userId: m.user.id });
                          }
                        }}
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
