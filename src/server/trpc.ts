/**
 * tRPC server initialization.
 * Creates the router, context, and middleware for the API layer.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * Context creation — runs for every tRPC request.
 * Provides the authenticated user session and database client.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // TODO: Get session from NextAuth
  // const session = await auth();
  return {
    // db: prisma,
    // session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/** Create a new tRPC router */
export const createRouter = t.router;

/** Create a caller factory for server-side calls */
export const createCallerFactory = t.createCallerFactory;

/** Public procedure — no auth required */
export const publicProcedure = t.procedure;

/** Protected procedure — requires authenticated session */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  // TODO: Check session from context
  // if (!ctx.session?.user) {
  //   throw new TRPCError({ code: "UNAUTHORIZED" });
  // }
  return next({
    ctx: {
      ...ctx,
      // session: ctx.session,
    },
  });
});

/** Org-scoped procedure — requires auth + org membership */
export const orgProcedure = protectedProcedure.use(({ ctx, next }) => {
  // TODO: Resolve org from request and verify membership
  return next({ ctx });
});
