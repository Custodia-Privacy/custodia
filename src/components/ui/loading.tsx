export function LoadingSpinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-navy-500 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingPage({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <LoadingSpinner className="h-8 w-8" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
