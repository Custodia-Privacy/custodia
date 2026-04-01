import { createRouter, createCallerFactory } from "./trpc";
import { siteRouter } from "./routers/site";
import { scanRouter } from "./routers/scan";
import { bannerRouter } from "./routers/banner";
import { policyRouter } from "./routers/policy";
import { billingRouter } from "./routers/billing";
import { userRouter } from "./routers/user";
import { dsarRouter } from "./routers/dsar";
import { piaRouter } from "./routers/pia";
import { governanceRouter } from "./routers/governance";
import { preferencesRouter } from "./routers/preferences";
import { agentsRouter } from "./routers/agents";
import { dashboardRouter } from "./routers/dashboard";
import { orgRouter } from "./routers/org";
import { assistantRouter } from "./routers/assistant";
import { apiKeyRouter } from "./routers/apiKey";
import { findingRouter } from "./routers/finding";
import { integrationsRouter } from "./routers/integrations";

export const appRouter = createRouter({
  site: siteRouter,
  scan: scanRouter,
  finding: findingRouter,
  banner: bannerRouter,
  policy: policyRouter,
  billing: billingRouter,
  user: userRouter,
  dsar: dsarRouter,
  pia: piaRouter,
  governance: governanceRouter,
  preferences: preferencesRouter,
  agents: agentsRouter,
  dashboard: dashboardRouter,
  org: orgRouter,
  assistant: assistantRouter,
  apiKey: apiKeyRouter,
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
