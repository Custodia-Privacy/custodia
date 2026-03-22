import { z } from "zod";
import { createRouter, orgProcedure, protectedProcedure } from "../trpc";

export const siteRouter = createRouter({
  /** List all sites in the user's organization */
  list: orgProcedure.query(async ({ ctx }) => {
    // TODO: return db.site.findMany({ where: { orgId, deletedAt: null } })
    return [];
  }),

  /** Get a single site with its latest scan, banner, and policy */
  get: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // TODO: return site with relations
      return null;
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
      // TODO: Create site, enqueue initial scan
      return null;
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
      // TODO: Update site
      return null;
    }),

  /** Soft-delete a site */
  delete: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Soft delete (set deletedAt)
    }),

  /** Verify domain ownership via DNS TXT or meta tag */
  verify: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Check DNS TXT record or meta tag
      return { verified: false, method: "dns" as const };
    }),
});
