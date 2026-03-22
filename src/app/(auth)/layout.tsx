import type { ReactNode } from "react";

/**
 * Auth layout — centered card layout for login/signup pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
