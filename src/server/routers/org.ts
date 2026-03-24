import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";

export const orgRouter = createRouter({
  /** Org profile + rollups for settings and AI context */
  summary: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUniqueOrThrow({
      where: { id: ctx.orgId },
      include: {
        _count: {
          select: {
            sites: true,
            members: true,
            dsarRequests: true,
            assessments: true,
          },
        },
      },
    });

    const sites = await ctx.db.site.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, domain: true, name: true, complianceScore: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      role: ctx.orgRole,
      stripeCustomerId: org.stripeCustomerId != null,
      counts: {
        sites: org._count.sites,
        members: org._count.members,
        dsars: org._count.dsarRequests,
        assessments: org._count.assessments,
      },
      sites,
    };
  }),

  update: orgProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.orgRole !== "owner" && ctx.orgRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update organization details.",
        });
      }

      return ctx.db.organization.update({
        where: { id: ctx.orgId },
        data: { name: input.name },
        select: { id: true, name: true, slug: true, plan: true },
      });
    }),
});
