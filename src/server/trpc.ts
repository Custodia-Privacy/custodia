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
 * Validates Origin header for CSRF defense-in-depth.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = (await auth()) as SessionWithOrg | null;

  const origin = opts.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const allowedOrigin = new URL(appUrl).origin;
  const csrfOk = !origin || origin === allowedOrigin;

  return {
    db,
    session,
    csrfOk,
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

/** Protected procedure — requires authenticated session + CSRF check */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  if (!ctx.csrfOk) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Invalid request origin" });
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

/** Admin procedure — requires org admin or owner role */
export const adminProcedure = orgProcedure.use(({ ctx, next }) => {
  if (ctx.orgRole !== "admin" && ctx.orgRole !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires admin privileges",
    });
  }
  return next({ ctx });
});

/** Owner procedure — requires org owner role */
export const ownerProcedure = orgProcedure.use(({ ctx, next }) => {
  if (ctx.orgRole !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires owner privileges",
    });
  }
  return next({ ctx });
});
