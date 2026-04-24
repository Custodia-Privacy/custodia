/**
 * tRPC HTTP handler — serves all tRPC routes at /api/trpc/*
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root";
import { createTRPCContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    // Allow queries to be sent as POST (paired with `methodOverride: "POST"`
    // on the client's httpBatchLink). Required because Cloudflare's managed
    // WAF blocks tRPC's URL-encoded GET query strings as suspected injection.
    allowMethodOverride: true,
  });

export { handler as GET, handler as POST };
