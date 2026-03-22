import { z } from "zod";
import { createRouter, orgProcedure, publicProcedure } from "../trpc";

export const scanRouter = createRouter({
  /** List scans for a site (paginated) */
  list: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // TODO: Paginated scan list
      return { items: [], nextCursor: null };
    }),

  /** Get scan details with findings */
  get: orgProcedure
    .input(z.object({ scanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // TODO: Return scan with findings
      return null;
    }),

  /** Trigger a new scan for a site */
  trigger: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        type: z.enum(["full", "quick", "monitoring"]).default("full"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Create scan record, enqueue BullMQ job
      return null;
    }),

  /** Public quick scan — free lead-gen scan (homepage only) */
  quick: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO: Enqueue quick scan job, return scan ID for polling
      return { scanId: null, status: "queued" as const };
    }),

  /** Compare two scans side by side */
  compare: orgProcedure
    .input(
      z.object({
        scanId1: z.string().uuid(),
        scanId2: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // TODO: Diff two scans
      return { added: [], removed: [], changed: [] };
    }),
});
