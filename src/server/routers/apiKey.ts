import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure, adminProcedure } from "../trpc";

function generateKey(): { raw: string; prefix: string; hash: string } {
  const raw = `cust_${randomBytes(24).toString("base64url")}`;
  const prefix = raw.slice(0, 9);
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

export const apiKeyRouter = createRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.apiKey.findMany({
      where: { orgId: ctx.orgId, revokedAt: null },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        scopes: z.array(z.string()).default(["read"]),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.apiKey.count({
        where: { orgId: ctx.orgId, revokedAt: null },
      });
      if (count >= 10) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Maximum 10 active API keys per organization.",
        });
      }

      const { raw, prefix, hash } = generateKey();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86_400_000)
        : null;

      const key = await ctx.db.apiKey.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          keyHash: hash,
          prefix,
          scopes: input.scopes,
          expiresAt,
        },
        select: { id: true, name: true, prefix: true, createdAt: true },
      });

      return { ...key, secret: raw };
    }),

  revoke: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const key = await ctx.db.apiKey.findFirst({
        where: { id: input.id, orgId: ctx.orgId, revokedAt: null },
      });
      if (!key) {
        throw new TRPCError({ code: "NOT_FOUND", message: "API key not found." });
      }
      await ctx.db.apiKey.update({
        where: { id: input.id },
        data: { revokedAt: new Date() },
      });
      return { ok: true as const };
    }),
});
