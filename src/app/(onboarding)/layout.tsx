import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started — Custodia",
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Minimal header */}
      <header className="flex items-center gap-2.5 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-600 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <span className="text-base font-semibold text-slate-900 tracking-tight dark:text-white">
          Custodia
        </span>
      </header>

      {/* Page content */}
      <main className="flex flex-1 items-start justify-center px-6 pb-12 pt-8">
        {children}
      </main>
    </div>
  );
}
