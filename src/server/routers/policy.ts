import { z } from "zod";
import { createRouter, orgProcedure } from "../trpc";

export const policyRouter = createRouter({
  /** Get the current privacy policy for a site */
  get: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // TODO: Return policy
      return null;
    }),

  /** Generate a new privacy policy from the latest scan using AI */
  generate: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Use Claude API to generate policy from scan findings
      return null;
    }),

  /** Manually update the policy content */
  update: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        contentMarkdown: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Update policy, increment version
      return null;
    }),

  /** Publish the policy (make it live) */
  publish: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Set publishedAt
      return null;
    }),

  /** Get version history */
  versions: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // TODO: Return policy version history
      return [];
    }),
});
