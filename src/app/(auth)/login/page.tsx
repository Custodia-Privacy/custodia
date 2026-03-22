import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — Custodia",
};

export default function LoginPage() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy-900">Log in to Custodia</h1>
      {/* TODO: Login form with email/password + OAuth buttons */}
    </div>
  );
}
