/**
 * GET  /api/v1/dsars — List DSARs for the authenticated org
 * POST /api/v1/dsars — Create a new DSAR
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiCreated,
  apiList,
  apiUnauthorized,
  apiForbidden,
  apiValidationError,
  apiRateLimited,
  parsePagination,
} from "@/lib/api-response";
import { computeDsarDueDate } from "@/lib/dsar-deadlines";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "read")) return apiForbidden("Scope 'read' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const url = new URL(req.url);
  const { page, perPage, skip } = parsePagination(url);

  const status = url.searchParams.get("status") ?? undefined;
  const requestType = url.searchParams.get("request_type") ?? undefined;
  const siteId = url.searchParams.get("site_id") ?? undefined;

  const where: Record<string, unknown> = { orgId: auth.orgId };
  if (status) where.status = status;
  if (requestType) where.requestType = requestType;
  if (siteId) where.siteId = siteId;

  const [dsars, total] = await Promise.all([
    db.dsarRequest.findMany({
      where,
      select: {
        id: true,
        requestType: true,
        status: true,
        jurisdiction: true,
        requesterName: true,
        requesterEmail: true,
        receivedAt: true,
        dueDate: true,
        extensionDays: true,
        fulfilledAt: true,
        siteId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.dsarRequest.count({ where }),
  ]);

  return apiList(dsars, {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  });
}

const createSchema = z.object({
  site_id: z.string().uuid().optional(),
  request_type: z.enum([
    "access",
    "deletion",
    "rectification",
    "portability",
    "opt_out",
    "restrict_processing",
  ]),
  jurisdiction: z.string().min(2).max(20),
  requester_name: z.string().min(1).max(255),
  requester_email: z.string().email(),
  requester_phone: z.string().max(50).optional(),
  notes: z.string().max(8000).optional(),
});

export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "write")) return apiForbidden("Scope 'write' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten());
  }

  const input = parsed.data;
  const jurisdiction = input.jurisdiction.trim().toLowerCase();
  const now = new Date();
  const dueDate = computeDsarDueDate(jurisdiction, now);

  if (input.site_id) {
    const site = await db.site.findFirst({
      where: { id: input.site_id, orgId: auth.orgId, deletedAt: null },
    });
    if (!site) return apiValidationError({ site_id: "Site not found in this organization" });
  }

  const dsar = await db.$transaction(async (tx) => {
    const row = await tx.dsarRequest.create({
      data: {
        orgId: auth.orgId,
        siteId: input.site_id ?? null,
        requestType: input.request_type,
        jurisdiction,
        requesterName: input.requester_name.trim(),
        requesterEmail: input.requester_email.trim().toLowerCase(),
        requesterPhone: input.requester_phone?.trim() || null,
        dueDate,
        receivedAt: now,
        notes: input.notes?.trim() || null,
      },
    });
    await tx.dsarActivity.create({
      data: {
        requestId: row.id,
        action: "request_received",
        details: {
          source: "api_v1",
          requestType: input.request_type,
          jurisdiction,
          dueDate: dueDate.toISOString(),
        },
        actor: `api_key:${auth.apiKeyId}`,
      },
    });
    return row;
  });

  return apiCreated({
    id: dsar.id,
    request_type: dsar.requestType,
    status: dsar.status,
    jurisdiction: dsar.jurisdiction,
    due_date: dsar.dueDate.toISOString(),
    created_at: dsar.createdAt.toISOString(),
  });
}
