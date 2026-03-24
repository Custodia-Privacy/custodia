import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { createRouter, protectedProcedure } from "../trpc";
import { PLANS } from "@/lib/stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia" as any,
  });
}

export const billingRouter = createRouter({
  /** Get current subscription details */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.orgMember.findFirst({
      where: { userId: ctx.userId },
      include: { org: true },
    });
    if (!membership) return null;

    const org = membership.org;
    const plan = PLANS[org.plan as keyof typeof PLANS];

    let stripeSubscription: Stripe.Subscription | null = null;
    if (org.stripeSubscriptionId) {
      try {
        stripeSubscription = await getStripe().subscriptions.retrieve(org.stripeSubscriptionId);
      } catch {
        // Subscription may have been deleted
      }
    }

    return {
      plan: org.plan,
      planName: plan.name,
      status: stripeSubscription?.status ?? (org.plan === "free" ? "active" : "unknown"),
      currentPeriodEnd: stripeSubscription?.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end ?? false,
    };
  }),

  /** Create a Stripe Checkout session for upgrading */
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "growth", "business"]) }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.orgMember.findFirst({
        where: { userId: ctx.userId },
        include: { org: true },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No organization found" });
      }
      if (membership.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the organization owner can manage billing",
        });
      }

      const org = membership.org;
      const planConfig = PLANS[input.plan];
      const priceId = planConfig.stripePriceId;

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe price not configured for this plan",
        });
      }

      // Create or retrieve Stripe customer
      let customerId = org.stripeCustomerId;
      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: ctx.session.user.email ?? undefined,
          name: org.name,
          metadata: { orgId: org.id },
        });
        customerId = customer.id;
        await ctx.db.organization.update({
          where: { id: org.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?checkout=success`,
        cancel_url: `${appUrl}/pricing?checkout=cancel`,
        metadata: { orgId: org.id, plan: input.plan },
      });

      return { url: session.url! };
    }),

  /** Create a Stripe Customer Portal session */
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const membership = await ctx.db.orgMember.findFirst({
      where: { userId: ctx.userId },
      include: { org: true },
    });
    if (!membership?.org.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No billing account found. Subscribe to a plan first.",
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await getStripe().billingPortal.sessions.create({
      customer: membership.org.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return { url: session.url };
  }),

  /** Get current usage vs plan limits */
  usage: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.orgMember.findFirst({
      where: { userId: ctx.userId },
      include: { org: true },
    });
    if (!membership) {
      return {
        sites: { used: 0, limit: 1 },
        scans: { used: 0, limit: 1 },
        teamMembers: { used: 1, limit: 1 },
      };
    }

    const org = membership.org;
    const planLimits = PLANS[org.plan as keyof typeof PLANS];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [siteCount, scanCount, memberCount] = await Promise.all([
      ctx.db.site.count({ where: { orgId: org.id, deletedAt: null } }),
      ctx.db.scan.count({
        where: { site: { orgId: org.id }, createdAt: { gte: startOfMonth } },
      }),
      ctx.db.orgMember.count({ where: { orgId: org.id } }),
    ]);

    return {
      sites: { used: siteCount, limit: planLimits.sites },
      scans: { used: scanCount, limit: planLimits.scansPerMonth },
      teamMembers: { used: memberCount, limit: planLimits.teamMembers },
    };
  }),
});
