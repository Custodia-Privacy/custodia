import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sites — Custodia",
};

export default function SitesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Your Sites</h1>
        {/* TODO: Add site button */}
      </div>
      {/* TODO: Site list with compliance scores */}
    </div>
  );
}
