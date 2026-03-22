/**
 * Stripe client configuration.
 * Initialized once dependencies are installed.
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
    price: 2900, // cents
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    sites: 1,
    scansPerMonth: 10,
    monitoring: true,
    monitoringFrequency: "weekly" as const,
    banner: true,
    policy: true,
    teamMembers: 3,
    consentLogRetention: 90, // days
  },
  pro: {
    name: "Pro",
    price: 4900, // cents
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    sites: 5,
    scansPerMonth: 50,
    monitoring: true,
    monitoringFrequency: "daily" as const,
    banner: true,
    policy: true,
    teamMembers: 10,
    consentLogRetention: 365, // days
  },
} as const;

export type PlanKey = keyof typeof PLANS;
