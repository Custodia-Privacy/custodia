import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";

/**
 * Dashboard layout — authenticated app shell with sidebar navigation.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
}
