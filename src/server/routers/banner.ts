import { z } from "zod";
import { createRouter, orgProcedure } from "../trpc";

const bannerConfigSchema = z.object({
  position: z.enum(["bottom", "bottom-left", "bottom-right", "center"]).default("bottom"),
  theme: z.enum(["light", "dark", "auto"]).default("light"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4F46E5"),
  showLogo: z.boolean().default(true),
  customCss: z.string().max(10000).default(""),
  content: z.object({
    title: z.string().max(200).default("We value your privacy"),
    description: z.string().max(1000).default(""),
    acceptAllText: z.string().max(50).default("Accept All"),
    rejectAllText: z.string().max(50).default("Reject All"),
    customizeText: z.string().max(50).default("Customize"),
    privacyPolicyUrl: z.string().max(500).default("/privacy"),
  }),
  categories: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
      cookies: z.array(z.string()),
    }),
  ),
  regulations: z.object({
    gdpr: z.object({ enabled: z.boolean(), mode: z.literal("opt-in") }).optional(),
    ccpa: z.object({ enabled: z.boolean(), mode: z.literal("opt-out") }).optional(),
  }),
});

export const bannerRouter = createRouter({
  /** Get banner config for a site */
  get: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // TODO: Return banner config
      return null;
    }),

  /** Update banner config (draft) */
  update: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        config: bannerConfigSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Update banner draft config
      return null;
    }),

  /** Publish banner — copies draft to published_config */
  publish: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Publish banner
      return null;
    }),

  /** Get HTML/CSS/JS preview of the banner */
  preview: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // TODO: Generate preview snippet
      return { html: "", css: "", js: "" };
    }),
});
