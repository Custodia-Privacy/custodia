import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { enqueueScan } from "@/lib/queue";
import { PLANS } from "@/lib/stripe";
import {
  generatePrivacyWebhookSecret,
  isAllowedPrivacyWebhookUrl,
} from "@/lib/privacy-webhook";

export const siteRouter = createRouter({
  /** List all sites in the user's organization */
  list: orgProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;

      const rows = await ctx.db.site.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        include: {
          _count: { select: { scans: true, findings: { where: { resolvedAt: null } } } },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | null = null;
      if (rows.length > limit) {
        const lastItem = rows.pop()!;
        nextCursor = lastItem.id;
      }

      const items = rows.map(({ privacyWebhookSecret: _s, ...site }) => ({
        ...site,
        privacyWebhookSecretConfigured: Boolean(_s),
      }));

      return { items, nextCursor };
    }),

  /** Get a single site with its latest scan, banner, and policy */
  get: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        include: {
          banner: true,
          policies: { select: { id: true, type: true, title: true, version: true, publishedAt: true } },
          scans: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { _count: { select: { findings: true } } },
          },
          _count: { select: { findings: { where: { resolvedAt: null } } } },
        },
      });

      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      const { privacyWebhookSecret: _whSecret, ...siteRest } = site;

      return {
        ...siteRest,
        privacyWebhookSecretConfigured: Boolean(_whSecret),
        latestScan: site.scans[0] ?? null,
      };
    }),

  /** Add a new site and trigger initial scan */
  create: orgProcedure
    .input(
      z.object({
        domain: z
          .string()
          .min(1)
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check plan limits
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      const siteCount = await ctx.db.site.count({
        where: { orgId: ctx.orgId, deletedAt: null },
      });

      if (siteCount >= planLimits.sites) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your ${planLimits.name} plan allows up to ${planLimits.sites} site(s). Upgrade to add more.`,
        });
      }

      // Check for duplicate domain
      const existing = await ctx.db.site.findFirst({
        where: { orgId: ctx.orgId, domain: input.domain, deletedAt: null },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This domain is already added to your organization",
        });
      }

      const site = await ctx.db.site.create({
        data: {
          orgId: ctx.orgId,
          domain: input.domain,
          name: input.name,
        },
      });

      // Create initial scan and enqueue it
      const scan = await ctx.db.scan.create({
        data: { siteId: site.id, scanType: "full" },
      });

      await enqueueScan({
        scanId: scan.id,
        siteId: site.id,
        domain: input.domain,
        scanType: "full",
        maxPages: 20,
      });

      return site;
    }),

  /** Update site settings */
  update: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        monitoringEnabled: z.boolean().optional(),
        scanFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        /** HTTPS URL (http allowed only outside production). Cleared with null. */
        privacyWebhookUrl: z.string().url().max(2048).nullable().optional(),
        /** Set to rotate or supply when enabling webhook. Omit to keep existing secret. */
        privacyWebhookSecret: z.string().min(16).max(255).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { siteId, privacyWebhookUrl, privacyWebhookSecret, ...rest } = input;
      const site = await ctx.db.site.findFirst({
        where: { id: siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

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
              site.privacyWebhookSecret ?? generatePrivacyWebhookSecret();
          } else if (privacyWebhookSecret === null) {
            data.privacyWebhookSecret = null;
          } else {
            data.privacyWebhookSecret = privacyWebhookSecret;
          }
        }
      } else if (privacyWebhookSecret !== undefined) {
        if (!site.privacyWebhookUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Set a webhook URL before rotating the secret.",
          });
        }
        if (privacyWebhookSecret === null) {
          data.privacyWebhookSecret = null;
        } else {
          data.privacyWebhookSecret = privacyWebhookSecret;
        }
      }

      const hadSecret = Boolean(site.privacyWebhookSecret);
      const autoGeneratedSecret =
        typeof data.privacyWebhookSecret === "string" &&
        !hadSecret &&
        privacyWebhookSecret === undefined;

      const updated = await ctx.db.site.update({
        where: { id: siteId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      const { privacyWebhookSecret: _s, ...safe } = updated;
      return {
        ...safe,
        privacyWebhookSecretConfigured: Boolean(_s),
        revealSecretOnce:
          autoGeneratedSecret && typeof data.privacyWebhookSecret === "string"
            ? (data.privacyWebhookSecret as string)
            : null,
      };
    }),

  /** New signing secret for an existing consent webhook URL (copy once; not shown again). */
  rotatePrivacyWebhookSecret: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      if (!site.privacyWebhookUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Set a webhook URL before rotating the secret.",
        });
      }
      const secret = generatePrivacyWebhookSecret();
      const updated = await ctx.db.site.update({
        where: { id: input.siteId },
        data: { privacyWebhookSecret: secret },
      });
      const { privacyWebhookSecret: _s, ...safe } = updated;
      return {
        ...safe,
        privacyWebhookSecretConfigured: true,
        revealSecretOnce: secret,
      };
    }),

  /** Soft-delete a site */
  delete: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      await ctx.db.site.update({
        where: { id: input.siteId },
        data: { deletedAt: new Date() },
      });
    }),

  /** Verify domain ownership via DNS TXT record */
  verify: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      // Check DNS TXT record for custodia-verify=<siteId>
      const { resolve } = await import("node:dns/promises");
      try {
        const records = await resolve(site.domain, "TXT");
        const verificationToken = `custodia-verify=${site.id}`;
        const verified = records.some((r) => r.join("").includes(verificationToken));

        if (verified) {
          await ctx.db.site.update({
            where: { id: input.siteId },
            data: { verified: true },
          });
        }

        return { verified, method: "dns" as const, token: verificationToken };
      } catch {
        return { verified: false, method: "dns" as const, token: `custodia-verify=${site.id}` };
      }
    }),
});
