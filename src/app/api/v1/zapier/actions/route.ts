/**
 * Zapier action endpoints.
 *
 * These are called by Zapier when a user's Zap fires an action.
 * They proxy to the same logic as the /api/v1/* REST endpoints.
 *
 * Actions:
 *   POST /api/v1/zapier/actions?action=create_dsar
 *   POST /api/v1/zapier/actions?action=upsert_preferences
 *   POST /api/v1/zapier/actions?action=search_contact
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import {
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiForbidden,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { computeDsarDueDate } from "@/lib/dsar-deadlines";
import type { Prisma } from "@prisma/client";

const createDsarSchema = z.object({
  request_type: z.enum(["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"]),
  jurisdiction: z.string().min(2).max(20),
  requester_name: z.string().min(1).max(255),
  requester_email: z.string().email(),
  notes: z.string().max(8000).optional(),
});

const upsertPrefsSchema = z.object({
  center_id: z.string().uuid(),
  email: z.string().email().optional(),
  external_id: z.string().max(255).optional(),
  preferences: z.record(z.union([z.boolean(), z.string().max(255), z.number()])).refine(
    (obj) => !("__proto__" in obj) && !("constructor" in obj) && Object.keys(obj).length <= 50,
    { message: "Invalid preference keys" },
  ),
}).refine((d) => d.email || d.external_id, { message: "email or external_id required" });

const searchContactSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "write")) return apiForbidden("Scope 'write' required");

  const rl = await checkRateLimit(`zapier:${auth.apiKeyId}`, 120, 60 * 1000);
  if (!rl.ok) return apiRateLimited(rl);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  switch (action) {
    case "create_dsar": {
      const parsed = createDsarSchema.safeParse(body);
      if (!parsed.success) return apiValidationError(parsed.error.flatten());

      const input = parsed.data;
      const jurisdiction = input.jurisdiction.trim().toLowerCase();
      const dueDate = computeDsarDueDate(jurisdiction, new Date());

      const dsar = await db.dsarRequest.create({
        data: {
          orgId: auth.orgId,
          requestType: input.request_type,
          jurisdiction,
          requesterName: input.requester_name,
          requesterEmail: input.requester_email.toLowerCase(),
          dueDate,
          receivedAt: new Date(),
          notes: input.notes ?? null,
        },
      });

      return apiCreated({
        id: dsar.id,
        status: dsar.status,
        due_date: dsar.dueDate.toISOString(),
      });
    }

    case "upsert_preferences": {
      const parsed = upsertPrefsSchema.safeParse(body);
      if (!parsed.success) return apiValidationError(parsed.error.flatten());

      const input = parsed.data;
      const center = await db.preferenceCenter.findFirst({
        where: { id: input.center_id, orgId: auth.orgId },
      });
      if (!center) return apiValidationError({ center_id: "Preference center not found" });

      const where: Record<string, unknown> = { centerId: input.center_id };
      if (input.email) where.email = input.email.toLowerCase();
      else if (input.external_id) where.externalId = input.external_id;

      const existing = await db.userPreference.findFirst({ where });
      const prefsJson = input.preferences as Prisma.InputJsonValue;

      const saved = existing
        ? await db.userPreference.update({
            where: { id: existing.id },
            data: { preferences: prefsJson, source: "zapier" },
          })
        : await db.userPreference.create({
            data: {
              centerId: input.center_id,
              email: input.email?.toLowerCase() ?? null,
              externalId: input.external_id ?? null,
              preferences: prefsJson,
              source: "zapier",
            },
          });

      return existing ? apiSuccess({ id: saved.id }) : apiCreated({ id: saved.id });
    }

    case "search_contact": {
      const parsed = searchContactSchema.safeParse(body);
      if (!parsed.success) return apiValidationError(parsed.error.flatten());

      const dsars = await db.dsarRequest.findMany({
        where: { orgId: auth.orgId, requesterEmail: parsed.data.email.toLowerCase() },
        select: { id: true, requestType: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const prefs = await db.userPreference.findMany({
        where: {
          email: parsed.data.email.toLowerCase(),
          center: { orgId: auth.orgId },
        },
        select: { id: true, centerId: true, preferences: true, updatedAt: true },
        take: 10,
      });

      return apiSuccess({ dsars, preferences: prefs });
    }

    default:
      return apiValidationError("Unknown action. Supported: create_dsar, upsert_preferences, search_contact");
  }
}
