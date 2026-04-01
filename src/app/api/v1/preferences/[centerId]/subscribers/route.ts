/**
 * GET  /api/v1/preferences/:centerId/subscribers — List subscribers for a preference center
 * POST /api/v1/preferences/:centerId/subscribers — Create or update a subscriber's preferences
 */
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  apiList,
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  parsePagination,
} from "@/lib/api-response";

export async function GET(
  req: Request,
  props: { params: Promise<{ centerId: string }> },
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "read")) return apiForbidden("Scope 'read' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const { centerId } = await props.params;

  const center = await db.preferenceCenter.findFirst({
    where: { id: centerId, orgId: auth.orgId },
    select: { id: true },
  });
  if (!center) return apiNotFound("Preference center");

  const url = new URL(req.url);
  const { page, perPage, skip } = parsePagination(url);
  const email = url.searchParams.get("email") ?? undefined;
  const externalId = url.searchParams.get("external_id") ?? undefined;

  const where: Record<string, unknown> = { centerId };
  if (email) where.email = email;
  if (externalId) where.externalId = externalId;

  const [subs, total] = await Promise.all([
    db.userPreference.findMany({
      where,
      select: {
        id: true,
        email: true,
        externalId: true,
        preferences: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
    }),
    db.userPreference.count({ where }),
  ]);

  return apiList(
    subs.map((s) => ({
      id: s.id,
      email: s.email,
      external_id: s.externalId,
      preferences: s.preferences,
      source: s.source,
      created_at: s.createdAt.toISOString(),
      updated_at: s.updatedAt.toISOString(),
    })),
    { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  );
}

const upsertSchema = z.object({
  email: z.string().email().optional(),
  external_id: z.string().max(255).optional(),
  preferences: z.record(z.union([z.boolean(), z.string().max(255), z.number()])).refine(
    (obj) => !("__proto__" in obj) && !("constructor" in obj) && Object.keys(obj).length <= 50,
    { message: "Invalid preference keys" },
  ),
  source: z.string().max(50).default("api"),
}).refine((d) => d.email || d.external_id, {
  message: "Either email or external_id is required",
});

export async function POST(
  req: Request,
  props: { params: Promise<{ centerId: string }> },
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "write")) return apiForbidden("Scope 'write' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const { centerId } = await props.params;

  const center = await db.preferenceCenter.findFirst({
    where: { id: centerId, orgId: auth.orgId },
    select: { id: true },
  });
  if (!center) return apiNotFound("Preference center");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten());
  }

  const input = parsed.data;

  const existingWhere: Record<string, unknown> = { centerId };
  if (input.email) existingWhere.email = input.email.toLowerCase();
  else if (input.external_id) existingWhere.externalId = input.external_id;

  const existing = await db.userPreference.findFirst({ where: existingWhere });

  const prefsJson = input.preferences as Prisma.InputJsonValue;

  const saved = existing
    ? await db.userPreference.update({
        where: { id: existing.id },
        data: {
          preferences: prefsJson,
          source: input.source,
        },
      })
    : await db.userPreference.create({
        data: {
          centerId,
          email: input.email?.toLowerCase() ?? null,
          externalId: input.external_id ?? null,
          preferences: prefsJson,
          source: input.source,
        },
      });

  const isNew = !existing;
  const resp = {
    id: saved.id,
    email: saved.email,
    external_id: saved.externalId,
    preferences: saved.preferences,
    source: saved.source,
    created_at: saved.createdAt.toISOString(),
    updated_at: saved.updatedAt.toISOString(),
  };

  return isNew ? apiCreated(resp) : apiSuccess(resp);
}
