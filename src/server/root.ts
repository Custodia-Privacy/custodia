import { createRouter, createCallerFactory } from "./trpc";
import { siteRouter } from "./routers/site";
import { scanRouter } from "./routers/scan";
import { bannerRouter } from "./routers/banner";
import { policyRouter } from "./routers/policy";
import { billingRouter } from "./routers/billing";
import { userRouter } from "./routers/user";

/**
 * Root tRPC router — all API routes are defined here.
 * Each sub-router is a feature module.
 */
export const appRouter = createRouter({
  site: siteRouter,
  scan: scanRouter,
  banner: bannerRouter,
  policy: policyRouter,
  billing: billingRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
