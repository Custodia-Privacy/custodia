import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Custodia",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
      <p className="mt-2 text-navy-600">
        Overview of your sites and compliance status.
      </p>
      {/* TODO: Compliance overview cards, recent alerts, site list */}
    </div>
  );
}
