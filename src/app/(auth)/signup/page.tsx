import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up — Custodia",
};

export default function SignupPage() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy-900">Create your account</h1>
      {/* TODO: Signup form with email/password + OAuth buttons */}
    </div>
  );
}
