import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { enqueueScan } from "@/lib/queue";
import { PLANS } from "@/lib/stripe";

export const siteRouter = createRouter({
  /** List all sites in the user's organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.site.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      include: {
        _count: { select: { scans: true, findings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Get a single site with its latest scan, banner, and policy */
  get: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        include: {
          banner: true,
          policy: true,
          scans: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { _count: { select: { findings: true } } },
          },
          _count: { select: { findings: { where: { resolvedAt: null } } } },
        },
      });

      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      return {
        ...site,
        latestScan: site.scans[0] ?? null,
      };
    }),

  /** Add a new site and trigger initial scan */
  create: orgProcedure
    .input(
      z.object({
        domain: z
          .string()
          .min(1)
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check plan limits
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      const siteCount = await ctx.db.site.count({
        where: { orgId: ctx.orgId, deletedAt: null },
      });

      if (siteCount >= planLimits.sites) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your ${planLimits.name} plan allows up to ${planLimits.sites} site(s). Upgrade to add more.`,
        });
      }

      // Check for duplicate domain
      const existing = await ctx.db.site.findFirst({
        where: { orgId: ctx.orgId, domain: input.domain, deletedAt: null },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This domain is already added to your organization",
        });
      }

      const site = await ctx.db.site.create({
        data: {
          orgId: ctx.orgId,
          domain: input.domain,
          name: input.name,
        },
      });

      // Create initial scan and enqueue it
      const scan = await ctx.db.scan.create({
        data: { siteId: site.id, scanType: "full" },
      });

      await enqueueScan({
        scanId: scan.id,
        siteId: site.id,
        domain: input.domain,
        scanType: "full",
        maxPages: 20,
      });

      return site;
    }),

  /** Update site settings */
  update: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        monitoringEnabled: z.boolean().optional(),
        scanFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { siteId, ...data } = input;
      const site = await ctx.db.site.findFirst({
        where: { id: siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      return ctx.db.site.update({
        where: { id: siteId },
        data,
      });
    }),

  /** Soft-delete a site */
  delete: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      await ctx.db.site.update({
        where: { id: input.siteId },
        data: { deletedAt: new Date() },
      });
    }),

  /** Verify domain ownership via DNS TXT record */
  verify: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      // Check DNS TXT record for custodia-verify=<siteId>
      const { resolve } = await import("node:dns/promises");
      try {
        const records = await resolve(site.domain, "TXT");
        const verificationToken = `custodia-verify=${site.id}`;
        const verified = records.some((r) => r.join("").includes(verificationToken));

        if (verified) {
          await ctx.db.site.update({
            where: { id: input.siteId },
            data: { verified: true },
          });
        }

        return { verified, method: "dns" as const, token: verificationToken };
      } catch {
        return { verified: false, method: "dns" as const, token: `custodia-verify=${site.id}` };
      }
    }),
});
