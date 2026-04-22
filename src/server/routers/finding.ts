import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createRouter, orgProcedure } from "../trpc";

export const findingRouter = createRouter({
  /** Mark a finding as resolved */
  resolve: orgProcedure
    .input(
      z.object({
        findingId: z.string().uuid(),
        note: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const finding = await ctx.db.finding.findUnique({
        where: { id: input.findingId },
        include: { site: { select: { orgId: true } } },
      });

      if (!finding || finding.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found" });
      }

      if (finding.resolvedAt) {
        return finding;
      }

      return ctx.db.finding.update({
        where: { id: input.findingId },
        data: {
          resolvedAt: new Date(),
          details: {
            ...(typeof finding.details === "object" && finding.details !== null ? finding.details as Record<string, unknown> : {}),
            resolvedBy: ctx.userId,
            resolveNote: input.note ?? null,
          },
        },
      });
    }),

  /** Reopen a previously resolved finding */
  unresolve: orgProcedure
    .input(z.object({ findingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const finding = await ctx.db.finding.findUnique({
        where: { id: input.findingId },
        include: { site: { select: { orgId: true } } },
      });

      if (!finding || finding.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found" });
      }

      if (!finding.resolvedAt) {
        return finding;
      }

      const existingDetails = typeof finding.details === "object" && finding.details !== null
        ? finding.details as Record<string, unknown>
        : {};
      const { resolvedBy: _, resolveNote: __, ...restDetails } = existingDetails;

      return ctx.db.finding.update({
        where: { id: input.findingId },
        data: {
          resolvedAt: null,
          details: Object.keys(restDetails).length > 0 ? (restDetails as Prisma.InputJsonObject) : undefined,
        },
      });
    }),

  /** Bulk resolve findings by IDs */
  bulkResolve: orgProcedure
    .input(
      z.object({
        findingIds: z.array(z.string().uuid()).min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const findings = await ctx.db.finding.findMany({
        where: { id: { in: input.findingIds } },
        include: { site: { select: { orgId: true } } },
      });

      const authorized = findings.filter((f) => f.site.orgId === ctx.orgId);
      if (authorized.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No findings found" });
      }

      const idsToResolve = authorized
        .filter((f) => !f.resolvedAt)
        .map((f) => f.id);

      if (idsToResolve.length === 0) return { resolved: 0 };

      const result = await ctx.db.finding.updateMany({
        where: { id: { in: idsToResolve } },
        data: { resolvedAt: new Date() },
      });

      return { resolved: result.count };
    }),
});
