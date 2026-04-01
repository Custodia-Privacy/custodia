import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure, publicProcedure } from "../trpc";
import {
  deliverPrivacyWebhook,
  generatePrivacyWebhookSecret,
  isAllowedPrivacyWebhookUrl,
} from "@/lib/privacy-webhook";

function stripCenterWebhookSecrets<T extends { privacyWebhookSecret?: string | null }>(center: T) {
  const { privacyWebhookSecret: _s, ...rest } = center;
  return {
    ...rest,
    privacyWebhookSecretConfigured: Boolean(_s),
  };
}

export const preferencesRouter = createRouter({
  /** List all preference centers for the organization */
  listCenters: orgProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.preferenceCenter.findMany({
      where: { orgId: ctx.orgId },
      include: {
        _count: { select: { preferences: true } },
        site: { select: { id: true, domain: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((c) => stripCenterWebhookSecrets(c));
  }),

  /** Get a single preference center with subscription stats */
  getCenter: orgProcedure
    .input(z.object({ centerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const center = await ctx.db.preferenceCenter.findFirst({
        where: { id: input.centerId, orgId: ctx.orgId },
        include: {
          _count: { select: { preferences: true } },
        },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }

      const preferences = await ctx.db.userPreference.findMany({
        where: { centerId: input.centerId },
        select: { preferences: true },
      });

      const config = center.publishedConfig ?? center.config;
      const categories = extractCategories(config);
      const optInRates: Record<string, { total: number; optedIn: number; rate: number }> = {};

      for (const cat of categories) {
        let optedIn = 0;
        for (const pref of preferences) {
          const prefs = pref.preferences as Record<string, boolean>;
          if (prefs[cat]) optedIn++;
        }
        optInRates[cat] = {
          total: preferences.length,
          optedIn,
          rate: preferences.length > 0 ? Math.round((optedIn / preferences.length) * 100) : 0,
        };
      }

      return {
        ...stripCenterWebhookSecrets(center),
        optInRates,
      };
    }),

  /** Create a new preference center */
  createCenter: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        siteId: z.string().uuid().optional(),
        config: z.object({
          categories: z.array(
            z.object({
              key: z.string().min(1),
              name: z.string().min(1),
              description: z.string().optional(),
              required: z.boolean().default(false),
            }),
          ),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.siteId) {
        const site = await ctx.db.site.findFirst({
          where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        });
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      const created = await ctx.db.preferenceCenter.create({
        data: {
          orgId: ctx.orgId,
          siteId: input.siteId,
          name: input.name,
          config: input.config,
        },
      });
      return stripCenterWebhookSecrets(created);
    }),

  /** Update a preference center's configuration */
  updateCenter: orgProcedure
    .input(
      z.object({
        centerId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        config: z
          .object({
            categories: z.array(
              z.object({
                key: z.string().min(1),
                name: z.string().min(1),
                description: z.string().optional(),
                required: z.boolean().default(false),
              }),
            ),
          })
          .optional(),
        privacyWebhookUrl: z.string().url().max(2048).nullable().optional(),
        privacyWebhookSecret: z.string().min(16).max(255).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { centerId, privacyWebhookUrl, privacyWebhookSecret, ...rest } = input;
      const center = await ctx.db.preferenceCenter.findFirst({
        where: { id: centerId, orgId: ctx.orgId },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }

      const data: Record<string, unknown> = { ...rest };

      if (privacyWebhookUrl !== undefined) {
        if (privacyWebhookUrl === null || privacyWebhookUrl.trim() === "") {
          data.privacyWebhookUrl = null;
          data.privacyWebhookSecret = null;
        } else {
          if (!isAllowedPrivacyWebhookUrl(privacyWebhookUrl)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Webhook URL must use https (or http in development only).",
            });
          }
          data.privacyWebhookUrl = privacyWebhookUrl;
          if (privacyWebhookSecret === undefined) {
            data.privacyWebhookSecret =
              center.privacyWebhookSecret ?? generatePrivacyWebhookSecret();
          } else if (privacyWebhookSecret === null) {
            data.privacyWebhookSecret = null;
          } else {
            data.privacyWebhookSecret = privacyWebhookSecret;
          }
        }
      } else if (privacyWebhookSecret !== undefined) {
        if (!center.privacyWebhookUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Set a webhook URL before rotating the secret.",
          });
        }
        data.privacyWebhookSecret =
          privacyWebhookSecret === null ? null : privacyWebhookSecret;
      }

      const hadSecret = Boolean(center.privacyWebhookSecret);
      const autoGeneratedSecret =
        typeof data.privacyWebhookSecret === "string" &&
        !hadSecret &&
        privacyWebhookSecret === undefined;

      const updated = await ctx.db.preferenceCenter.update({
        where: { id: centerId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      return {
        ...stripCenterWebhookSecrets(updated),
        revealSecretOnce:
          autoGeneratedSecret && typeof data.privacyWebhookSecret === "string"
            ? (data.privacyWebhookSecret as string)
            : null,
      };
    }),

  /** Generate a new signing secret (webhook URL must already be set). */
  rotateCenterWebhookSecret: orgProcedure
    .input(z.object({ centerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const center = await ctx.db.preferenceCenter.findFirst({
        where: { id: input.centerId, orgId: ctx.orgId },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }
      if (!center.privacyWebhookUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Set a webhook URL before rotating the secret.",
        });
      }
      const secret = generatePrivacyWebhookSecret();
      const updated = await ctx.db.preferenceCenter.update({
        where: { id: input.centerId },
        data: { privacyWebhookSecret: secret },
      });
      return {
        ...stripCenterWebhookSecrets(updated),
        revealSecretOnce: secret,
      };
    }),

  /** Publish: copy config to publishedConfig and set publishedAt */
  publishCenter: orgProcedure
    .input(z.object({ centerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const center = await ctx.db.preferenceCenter.findFirst({
        where: { id: input.centerId, orgId: ctx.orgId },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }

      const published = await ctx.db.preferenceCenter.update({
        where: { id: input.centerId },
        data: {
          publishedConfig: center.config as any,
          publishedAt: new Date(),
        },
      });
      return stripCenterWebhookSecrets(published);
    }),

  /**
   * Public: published center metadata + categories (no auth).
   * Fails if the center has never been published.
   */
  getPublishedCenter: publicProcedure
    .input(z.object({ centerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const center = await ctx.db.preferenceCenter.findUnique({
        where: { id: input.centerId },
        select: {
          id: true,
          name: true,
          publishedAt: true,
          publishedConfig: true,
          site: { select: { domain: true } },
        },
      });

      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }

      if (!center.publishedAt || center.publishedConfig == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This preference center is not published yet.",
        });
      }

      const cfg = center.publishedConfig as {
        categories?: { key: string; name: string; description?: string; required?: boolean }[];
      };

      return {
        id: center.id,
        name: center.name,
        siteDomain: center.site?.domain ?? null,
        publishedAt: center.publishedAt,
        categories: Array.isArray(cfg.categories) ? cfg.categories : [],
      };
    }),

  /** Public: get a user's preferences by centerId + email or externalId */
  getPreferences: publicProcedure
    .input(
      z.object({
        centerId: z.string().uuid(),
        email: z.string().email().optional(),
        externalId: z.string().min(1).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.email && !input.externalId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either email or externalId is required",
        });
      }

      const center = await ctx.db.preferenceCenter.findUnique({
        where: { id: input.centerId },
        select: { id: true, publishedAt: true, publishedConfig: true },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }
      if (!center.publishedAt || center.publishedConfig == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preference center is not published.",
        });
      }

      const preference = await ctx.db.userPreference.findFirst({
        where: {
          centerId: input.centerId,
          ...(input.email ? { email: input.email } : {}),
          ...(input.externalId ? { externalId: input.externalId } : {}),
        },
      });

      return {
        config: center.publishedConfig,
        preferences: preference?.preferences ?? null,
        updatedAt: preference?.updatedAt ?? null,
      };
    }),

  /** Public: create or update user preferences for a center */
  updatePreferences: publicProcedure
    .input(
      z.object({
        centerId: z.string().uuid(),
        email: z.string().email().optional(),
        externalId: z.string().min(1).optional(),
        preferences: z.record(z.string(), z.boolean()),
        source: z.string().max(50).default("web"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.email && !input.externalId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either email or externalId is required",
        });
      }

      const center = await ctx.db.preferenceCenter.findUnique({
        where: { id: input.centerId },
        select: {
          id: true,
          orgId: true,
          name: true,
          publishedAt: true,
          publishedConfig: true,
          privacyWebhookUrl: true,
          privacyWebhookSecret: true,
        },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }
      if (!center.publishedAt || center.publishedConfig == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preference center is not published.",
        });
      }

      const allowedKeys = new Set(extractCategories(center.publishedConfig));
      for (const key of Object.keys(input.preferences)) {
        if (!allowedKeys.has(key)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unknown preference key: ${key}`,
          });
        }
      }

      const cfg = center.publishedConfig as {
        categories?: { key: string; required?: boolean }[];
      };
      for (const cat of cfg.categories ?? []) {
        if (cat.required && !input.preferences[cat.key]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Category "${cat.key}" must stay enabled.`,
          });
        }
      }

      const existing = await ctx.db.userPreference.findFirst({
        where: {
          centerId: input.centerId,
          ...(input.email ? { email: input.email } : {}),
          ...(input.externalId ? { externalId: input.externalId } : {}),
        },
      });

      const saved = existing
        ? await ctx.db.userPreference.update({
            where: { id: existing.id },
            data: {
              preferences: input.preferences,
              source: input.source,
            },
          })
        : await ctx.db.userPreference.create({
            data: {
              centerId: input.centerId,
              email: input.email,
              externalId: input.externalId,
              preferences: input.preferences,
              source: input.source,
            },
          });

      if (center.privacyWebhookUrl && center.privacyWebhookSecret) {
        void deliverPrivacyWebhook({
          url: center.privacyWebhookUrl,
          secret: center.privacyWebhookSecret,
          event: existing ? "preferences.updated" : "preferences.created",
          payload: {
            event: existing ? "preferences.updated" : "preferences.created",
            timestamp: new Date().toISOString(),
            orgId: center.orgId,
            centerId: center.id,
            centerName: center.name,
            userPreferenceId: saved.id,
            email: input.email ? "[provided]" : null,
            externalId: input.externalId ? "[provided]" : null,
            preferences: input.preferences,
            source: input.source,
          },
        });
      }

      return saved;
    }),

  /** Export all preferences for a center as JSON */
  exportPreferences: orgProcedure
    .input(z.object({ centerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const center = await ctx.db.preferenceCenter.findFirst({
        where: { id: input.centerId, orgId: ctx.orgId },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }

      const preferences = await ctx.db.userPreference.findMany({
        where: { centerId: input.centerId },
        orderBy: { createdAt: "desc" },
      });

      return {
        center: {
          id: center.id,
          name: center.name,
          config: center.publishedConfig ?? center.config,
          privacyWebhookConfigured: Boolean(center.privacyWebhookSecret),
        },
        exportedAt: new Date().toISOString(),
        count: preferences.length,
        preferences: preferences.map((p) => ({
          email: p.email,
          externalId: p.externalId,
          preferences: p.preferences,
          source: p.source,
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
        })),
      };
    }),

  /** Aggregate preference stats: total subscribers, opt-in rates by category */
  stats: orgProcedure
    .input(z.object({ centerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const center = await ctx.db.preferenceCenter.findFirst({
        where: { id: input.centerId, orgId: ctx.orgId },
      });
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preference center not found" });
      }

      const preferences = await ctx.db.userPreference.findMany({
        where: { centerId: input.centerId },
        select: { preferences: true },
      });

      const config = center.publishedConfig ?? center.config;
      const categories = extractCategories(config);
      const optInRates: Record<string, { optedIn: number; total: number; rate: number }> = {};

      for (const cat of categories) {
        let optedIn = 0;
        for (const pref of preferences) {
          const prefs = pref.preferences as Record<string, boolean>;
          if (prefs[cat]) optedIn++;
        }
        optInRates[cat] = {
          optedIn,
          total: preferences.length,
          rate: preferences.length > 0 ? Math.round((optedIn / preferences.length) * 100) : 0,
        };
      }

      return {
        totalSubscribers: preferences.length,
        optInRates,
      };
    }),
});

/** Extract category keys from a preference center config */
function extractCategories(config: unknown): string[] {
  if (
    config &&
    typeof config === "object" &&
    "categories" in config &&
    Array.isArray((config as { categories: unknown[] }).categories)
  ) {
    return (config as { categories: { key: string }[] }).categories.map((c) => c.key);
  }
  return [];
}
