/**
 * Stripe client configuration + plan limits aligned with Prisma `Plan` enum.
 */

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    sites: 1,
    scansPerMonth: 1,
    monitoring: false,
    banner: false,
    policy: false,
    teamMembers: 1,
    consentLogRetention: 0,
  },
  starter: {
    name: "Starter",
    price: 2900,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    sites: 1,
    scansPerMonth: 10,
    monitoring: true,
    monitoringFrequency: "weekly" as const,
    banner: true,
    policy: true,
    teamMembers: 3,
    consentLogRetention: 90,
  },
  growth: {
    name: "Growth",
    price: 7900,
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID,
    sites: 5,
    scansPerMonth: 50,
    monitoring: true,
    monitoringFrequency: "daily" as const,
    banner: true,
    policy: true,
    teamMembers: 10,
    consentLogRetention: 365,
  },
  business: {
    name: "Business",
    price: 14900,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    sites: 25,
    scansPerMonth: 200,
    monitoring: true,
    monitoringFrequency: "daily" as const,
    banner: true,
    policy: true,
    teamMembers: 50,
    consentLogRetention: 730,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
