import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { PLANS } from "@/lib/stripe";

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
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      let banner = await ctx.db.banner.findUnique({ where: { siteId: input.siteId } });

      // Auto-create banner with defaults if none exists
      if (!banner) {
        banner = await ctx.db.banner.create({
          data: {
            siteId: input.siteId,
            config: {
              position: "bottom",
              theme: "light",
              primaryColor: "#4F46E5",
              showLogo: true,
              customCss: "",
              content: {
                title: "We value your privacy",
                description:
                  "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
                acceptAllText: "Accept All",
                rejectAllText: "Reject All",
                customizeText: "Customize",
                privacyPolicyUrl: "/privacy",
              },
              categories: [
                {
                  key: "necessary",
                  name: "Necessary",
                  description: "Essential cookies required for the website to function properly.",
                  required: true,
                  cookies: [],
                },
                {
                  key: "analytics",
                  name: "Analytics",
                  description: "Help us understand how visitors interact with our website.",
                  required: false,
                  cookies: [],
                },
                {
                  key: "marketing",
                  name: "Marketing",
                  description: "Used to deliver relevant advertisements.",
                  required: false,
                  cookies: [],
                },
              ],
              regulations: {
                gdpr: { enabled: true, mode: "opt-in" },
                ccpa: { enabled: true, mode: "opt-out" },
              },
            },
          },
        });
      }

      return banner;
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
      // Check plan allows banners
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.banner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cookie banners are not available on the Free plan. Upgrade to Starter or Pro.",
        });
      }

      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      return ctx.db.banner.upsert({
        where: { siteId: input.siteId },
        create: { siteId: input.siteId, config: input.config as any },
        update: { config: input.config as any },
      });
    }),

  /** Publish banner — copies draft to published_config */
  publish: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.banner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cookie banners require a Starter or Pro plan.",
        });
      }

      const banner = await ctx.db.banner.findUnique({ where: { siteId: input.siteId } });
      if (!banner) throw new TRPCError({ code: "NOT_FOUND", message: "Banner not found" });

      return ctx.db.banner.update({
        where: { siteId: input.siteId },
        data: {
          publishedConfig: banner.config as any,
          publishedAt: new Date(),
          enabled: true,
        },
      });
    }),

  /** Get HTML/CSS/JS preview of the banner */
  preview: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const banner = await ctx.db.banner.findUnique({ where: { siteId: input.siteId } });
      if (!banner) throw new TRPCError({ code: "NOT_FOUND", message: "Banner not found" });

      return generateBannerPreview(banner.config as any, input.siteId);
    }),
});

/** Generate HTML/CSS/JS preview for the banner editor */
function generateBannerPreview(config: any, siteId: string) {
  const { position, theme, primaryColor, content, categories } = config;
  const isDark = theme === "dark";

  const css = `
.custodia-banner {
  position: fixed;
  ${position === "center" ? "top: 50%; left: 50%; transform: translate(-50%, -50%);" : "bottom: 0; left: 0; right: 0;"}
  ${position === "bottom-left" ? "right: auto; max-width: 420px; margin: 16px;" : ""}
  ${position === "bottom-right" ? "left: auto; max-width: 420px; margin: 16px;" : ""}
  background: ${isDark ? "#1a1a2e" : "#ffffff"};
  color: ${isDark ? "#e0e0e0" : "#333333"};
  padding: 24px;
  box-shadow: 0 -2px 20px rgba(0,0,0,0.15);
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  border-radius: ${position === "bottom" ? "0" : "12px"};
}
.custodia-banner h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
.custodia-banner p { margin: 0 0 16px; font-size: 14px; line-height: 1.5; opacity: 0.85; }
.custodia-banner-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.custodia-btn { padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; }
.custodia-btn-accept { background: ${primaryColor}; color: #fff; }
.custodia-btn-reject { background: transparent; color: ${isDark ? "#e0e0e0" : "#555"}; border: 1px solid ${isDark ? "#444" : "#ddd"}; }
.custodia-btn-customize { background: transparent; color: ${primaryColor}; text-decoration: underline; border: none; }
${config.customCss || ""}`;

  const html = `
<div class="custodia-banner" id="custodia-banner-${siteId}">
  <h3>${escapeHtml(content.title)}</h3>
  <p>${escapeHtml(content.description)}</p>
  <div class="custodia-banner-actions">
    <button class="custodia-btn custodia-btn-accept" onclick="custodiaAcceptAll()">${escapeHtml(content.acceptAllText)}</button>
    <button class="custodia-btn custodia-btn-reject" onclick="custodiaRejectAll()">${escapeHtml(content.rejectAllText)}</button>
    <button class="custodia-btn custodia-btn-customize" onclick="custodiaCustomize()">${escapeHtml(content.customizeText)}</button>
  </div>
</div>`;

  const js = `
(function() {
  var categories = ${JSON.stringify(categories.map((c: any) => ({ key: c.key, name: c.name, required: c.required })))};
  window.custodiaAcceptAll = function() {
    var consent = {};
    categories.forEach(function(c) { consent[c.key] = true; });
    custodiaSetConsent(consent, 'accept_all');
  };
  window.custodiaRejectAll = function() {
    var consent = {};
    categories.forEach(function(c) { consent[c.key] = c.required; });
    custodiaSetConsent(consent, 'reject_all');
  };
  window.custodiaCustomize = function() {
    // Open customization modal
  };
  function custodiaSetConsent(consent, action) {
    document.cookie = 'custodia_consent=' + JSON.stringify(consent) + ';path=/;max-age=31536000;SameSite=Lax';
    var banner = document.getElementById('custodia-banner-${siteId}');
    if (banner) banner.style.display = 'none';
    fetch('/api/banner/${siteId}/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: consent, action: action })
    }).catch(function() {});
  }
})();`;

  return { html, css, js };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
