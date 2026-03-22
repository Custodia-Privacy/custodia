import { z } from "zod";
import { createRouter, protectedProcedure } from "../trpc";

export const billingRouter = createRouter({
  /** Get current subscription details */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Fetch from Stripe via stripe_subscription_id
    return null;
  }),

  /** Create a Stripe Checkout session for upgrading */
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Create Stripe Checkout session, return URL
      return { url: "" };
    }),

  /** Create a Stripe Customer Portal session */
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    // TODO: Create Stripe portal session, return URL
    return { url: "" };
  }),

  /** Get current usage vs plan limits */
  usage: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Count sites, scans this month, compare to plan limits
    return {
      sites: { used: 0, limit: 1 },
      scans: { used: 0, limit: 1 },
      teamMembers: { used: 1, limit: 1 },
    };
  }),
});
