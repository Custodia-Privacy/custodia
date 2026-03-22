/**
 * tRPC server initialization.
 * Creates the router, context, and middleware for the API layer.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Session shape with org info embedded by JWT callback */
interface SessionWithOrg {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  orgId?: string;
  orgRole?: string;
  orgSlug?: string;
}

/**
 * Context creation — runs for every tRPC request.
 * Provides the authenticated user session and database client.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = (await auth()) as SessionWithOrg | null;
  return {
    db,
    session,
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
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session as NonNullable<typeof ctx.session>,
      userId: ctx.session.user.id,
    },
  });
});

/** Org-scoped procedure — requires auth + org membership */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const orgId = ctx.session.orgId;
  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must belong to an organization",
    });
  }

  return next({
    ctx: {
      ...ctx,
      orgId,
      orgRole: ctx.session.orgRole as string,
    },
  });
});
