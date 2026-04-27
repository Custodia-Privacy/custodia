"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { api } from "@/lib/trpc";
import superjson from "superjson";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        // Verbose tRPC logging uses console.*; Next/Turbopack often surfaces those as "Console Error".
        // Enable only when debugging: NEXT_PUBLIC_VERBOSE_TRPC=true
        loggerLink({
          enabled: () => process.env.NEXT_PUBLIC_VERBOSE_TRPC === "true",
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          // Force POST for queries too. Cloudflare's managed WAF flags the
          // URL-encoded JSON pattern tRPC puts in GET query strings
          // (input=%7B%220%22%3A%7B%22json%22%3A...) as potential injection
          // and returns 403. POST bodies aren't inspected the same way.
          // See: scan.quickResult was returning CF 403 in prod even though
          // origin responded 200 in ~13ms.
          methodOverride: "POST",
        }),
      ],
    }),
  );

  return (
    <SessionProvider>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}
