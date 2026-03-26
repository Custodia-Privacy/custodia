"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AIAssistant } from "@/components/dashboard/ai-assistant";
import { api } from "@/lib/trpc";
import { PLANS } from "@/lib/stripe";

export function DashboardAppShell({ children }: { children: ReactNode }) {
  const { data: me } = api.user.me.useQuery();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const planKey = me?.org?.plan;
  const planName =
    planKey && planKey in PLANS
      ? PLANS[planKey as keyof typeof PLANS].name
      : "Free";

  const displayName = me?.name?.trim() || me?.email || "Account";

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          userName={displayName}
          planName={planName}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-600 text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Custodia</span>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900">
          {children}
        </main>
      </div>

      {/* Floating AI assistant */}
      <AIAssistant />
    </div>
  );
}
