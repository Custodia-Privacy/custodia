import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Custodia",
};

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
      {/* TODO: Profile settings, team management, billing */}
    </div>
  );
}
