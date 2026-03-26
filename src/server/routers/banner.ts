import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { PLANS } from "@/lib/stripe";
import { DEFAULT_BANNER_CONFIG } from "@/lib/banner-defaults";
import { hexToRgb, relativeLuminance, contrastRatio, ensureContrast } from "@/lib/color-utils";

const cookieDetailSchema = z.object({
  name: z.string().max(200),
  purpose: z.string().max(500),
  provider: z.string().max(200),
  expiry: z.string().max(100),
  type: z.enum(["cookie", "localStorage", "sessionStorage", "pixel", "fingerprint"]).default("cookie"),
});

const vendorSchema = z.object({
  name: z.string().max(200),
  purpose: z.string().max(500),
  privacyUrl: z.string().max(1000),
  country: z.string().max(100),
});

const bannerConfigSchema = z.object({
  position: z.enum(["bottom", "bottom-left", "bottom-right", "center"]).default("bottom"),
  theme: z.enum(["light", "dark", "auto"]).default("light"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4F46E5"),
  backgroundColor: z.string().max(7).default(""),
  textColor: z.string().max(7).default(""),
  logoUrl: z.string().max(1000).default(""),
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
      cookies: z.array(cookieDetailSchema),
    }),
  ),
  vendors: z.array(vendorSchema).default([]),
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
            config: DEFAULT_BANNER_CONFIG as unknown as object,
          },
        });
      } else {
        const parsed = bannerConfigSchema.safeParse(banner.config);
        if (!parsed.success) {
          banner = await ctx.db.banner.update({
            where: { siteId: input.siteId },
            data: { config: DEFAULT_BANNER_CONFIG as unknown as object },
          });
        }
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
          message: "Cookie banners are not available on the Free plan. Upgrade to Starter, Growth, or Business.",
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
          message: "Cookie banners require a Starter, Growth, or Business plan.",
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

  /** Magic Style — auto-detect site brand and generate an accessible banner config */
  magicStyle: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const url = site.domain.startsWith("http") ? site.domain : `https://${site.domain}`;
      let html = "";
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "CustodiaBot/1.0 (banner-style-detector)" },
        });
        clearTimeout(timeout);
        html = await res.text();
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Could not fetch ${url}. Make sure the site is accessible.` });
      }

      const extract = (pattern: RegExp): string | null => {
        const match = html.match(pattern);
        return match?.[1]?.trim() ?? null;
      };

      let primaryColor = extract(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
        ?? extract(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);

      const cssColors: string[] = [];
      const hexPattern = /#[0-9a-fA-F]{6}/g;
      let match: RegExpExecArray | null;
      while ((match = hexPattern.exec(html)) !== null) {
        const hex = match[0].toLowerCase();
        if (hex !== "#ffffff" && hex !== "#000000" && hex !== "#f8f9fa" && hex !== "#e9ecef") {
          cssColors.push(hex);
        }
      }

      if (!primaryColor && cssColors.length > 0) {
        const freq = new Map<string, number>();
        for (const c of cssColors) freq.set(c, (freq.get(c) ?? 0) + 1);
        const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
        primaryColor = sorted[0]?.[0] ?? "#4F46E5";
      }

      if (!primaryColor || !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
        primaryColor = "#4F46E5";
      }

      let logoUrl = extract(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
        ?? extract(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);

      const ogImage = extract(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        ?? extract(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

      if (logoUrl && !logoUrl.startsWith("http")) {
        try {
          logoUrl = new URL(logoUrl, url).href;
        } catch {
          logoUrl = null;
        }
      }

      const finalLogo = logoUrl ?? ogImage ?? "";

      const primaryRgb = hexToRgb(primaryColor) ?? [79, 70, 229];
      const primaryLum = relativeLuminance(primaryRgb);

      let backgroundColor: string;
      let textColor: string;
      let theme: "light" | "dark";

      if (primaryLum > 0.4) {
        backgroundColor = "#1e293b";
        textColor = "#f1f5f9";
        theme = "dark";
      } else {
        backgroundColor = "#ffffff";
        textColor = "#1e293b";
        theme = "light";
      }

      const bgRgb = hexToRgb(backgroundColor)!;
      const textRgb = hexToRgb(textColor)!;

      if (contrastRatio(textRgb, bgRgb) < 4.5) {
        textColor = backgroundColor === "#ffffff" ? "#0f172a" : "#f8fafc";
      }

      const buttonTextOnPrimary = ensureContrast([255, 255, 255], primaryRgb, 4.5);

      return {
        primaryColor,
        backgroundColor,
        textColor,
        theme,
        logoUrl: finalLogo,
        buttonTextColor: buttonTextOnPrimary,
        source: {
          colorsFound: cssColors.length,
          hadThemeColor: !!extract(/<meta[^>]*name=["']theme-color["']/i),
          hadFavicon: !!logoUrl,
          hadOgImage: !!ogImage,
        },
      };
    }),

  /** Get HTML/CSS/JS preview of the banner */
  preview: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const banner = await ctx.db.banner.findUnique({ where: { siteId: input.siteId } });
      if (!banner) throw new TRPCError({ code: "NOT_FOUND", message: "Banner not found" });

      const parsed = bannerConfigSchema.safeParse(banner.config);
      const config = parsed.success ? parsed.data : DEFAULT_BANNER_CONFIG;

      return generateBannerPreview(config as any, input.siteId);
    }),
});

/** Generate HTML/CSS/JS preview for the banner editor */
function generateBannerPreview(config: any, siteId: string) {
  const { position, theme, primaryColor, content, categories, backgroundColor, textColor, logoUrl } = config;
  const isDark = theme === "dark";
  const bg = backgroundColor && /^#[0-9a-fA-F]{6}$/.test(backgroundColor) ? backgroundColor : (isDark ? "#1a1a2e" : "#ffffff");
  const fg = textColor && /^#[0-9a-fA-F]{6}$/.test(textColor) ? textColor : (isDark ? "#e0e0e0" : "#333333");
  const muted = isDark ? "#999" : "#555";
  const border = isDark ? "#444" : "#ddd";

  const css = `
.custodia-banner {
  position: fixed;
  ${position === "center" ? "top: 50%; left: 50%; transform: translate(-50%, -50%);" : "bottom: 0; left: 0; right: 0;"}
  ${position === "bottom-left" ? "right: auto; max-width: 420px; margin: 16px;" : ""}
  ${position === "bottom-right" ? "left: auto; max-width: 420px; margin: 16px;" : ""}
  background: ${bg};
  color: ${fg};
  padding: 24px;
  box-shadow: 0 -2px 20px rgba(0,0,0,0.15);
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  border-radius: ${position === "bottom" ? "0" : "12px"};
}
.custodia-banner-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.custodia-banner-logo { height: 28px; width: auto; object-fit: contain; }
.custodia-banner h3 { margin: 0; font-size: 16px; font-weight: 600; }
.custodia-banner p { margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: ${muted}; }
.custodia-banner-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.custodia-btn { padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; }
.custodia-btn-accept { background: ${primaryColor}; color: #fff; }
.custodia-btn-reject { background: transparent; color: ${fg}; border: 1px solid ${border}; }
.custodia-btn-customize { background: transparent; color: ${primaryColor}; text-decoration: underline; border: none; }
${config.customCss || ""}`;

  const logoHtml = logoUrl ? `<img class="custodia-banner-logo" src="${escapeHtml(logoUrl)}" alt="Logo" />` : "";

  const html = `
<div class="custodia-banner" id="custodia-banner-${siteId}">
  <div class="custodia-banner-header">
    ${logoHtml}
    <h3>${escapeHtml(content.title)}</h3>
  </div>
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
