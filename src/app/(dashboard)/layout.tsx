import type { ReactNode } from "react";
import type { Metadata } from "next";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "App — Custodia",
};

/**
 * Dashboard layout — authenticated app shell with sidebar + live user/org from DB.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardAppShell>{children}</DashboardAppShell>;
}
