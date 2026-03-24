"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { api } from "@/lib/trpc";
import { PLANS } from "@/lib/stripe";

export function DashboardAppShell({ children }: { children: ReactNode }) {
  const { data: me } = api.user.me.useQuery();

  const planKey = me?.org?.plan;
  const planName =
    planKey && planKey in PLANS
      ? PLANS[planKey as keyof typeof PLANS].name
      : "Free";

  const displayName = me?.name?.trim() || me?.email || "Account";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={displayName} planName={planName} />
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
}
