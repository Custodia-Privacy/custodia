import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";

export const orgRouter = createRouter({
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
      branding: {
        brandName: org.brandName,
        brandLogoUrl: org.brandLogoUrl,
        brandColor: org.brandColor,
        brandWebsite: org.brandWebsite,
      },
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
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        brandName: z.string().max(255).nullish(),
        brandLogoUrl: z.string().url().max(2048).nullish(),
        brandColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #4f46e5")
          .nullish(),
        brandWebsite: z.string().url().max(2048).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.orgRole !== "owner" && ctx.orgRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update organization details.",
        });
      }

      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.brandName !== undefined) data.brandName = input.brandName ?? null;
      if (input.brandLogoUrl !== undefined) data.brandLogoUrl = input.brandLogoUrl ?? null;
      if (input.brandColor !== undefined) data.brandColor = input.brandColor ?? null;
      if (input.brandWebsite !== undefined) data.brandWebsite = input.brandWebsite ?? null;

      return ctx.db.organization.update({
        where: { id: ctx.orgId },
        data,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          brandName: true,
          brandLogoUrl: true,
          brandColor: true,
          brandWebsite: true,
        },
      });
    }),
});
