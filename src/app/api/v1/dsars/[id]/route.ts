/**
 * GET   /api/v1/dsars/:id        — Get a single DSAR
 * PATCH /api/v1/dsars/:id        — Update DSAR status
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "read")) return apiForbidden("Scope 'read' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const { id } = await props.params;

  const dsar = await db.dsarRequest.findFirst({
    where: { id, orgId: auth.orgId },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          action: true,
          details: true,
          actor: true,
          createdAt: true,
        },
      },
      site: { select: { id: true, domain: true } },
    },
  });

  if (!dsar) return apiNotFound("DSAR");

  return apiSuccess({
    id: dsar.id,
    request_type: dsar.requestType,
    status: dsar.status,
    jurisdiction: dsar.jurisdiction,
    requester_name: dsar.requesterName,
    requester_email: dsar.requesterEmail,
    requester_phone: dsar.requesterPhone,
    received_at: dsar.receivedAt.toISOString(),
    due_date: dsar.dueDate.toISOString(),
    extension_days: dsar.extensionDays,
    fulfilled_at: dsar.fulfilledAt?.toISOString() ?? null,
    rejected_reason: dsar.rejectedReason,
    notes: dsar.notes,
    ai_summary: dsar.aiSummary,
    data_locations: dsar.dataLocations,
    site: dsar.site ? { id: dsar.site.id, domain: dsar.site.domain } : null,
    activities: dsar.activities.map((a) => ({
      id: a.id,
      action: a.action,
      details: a.details,
      actor: a.actor,
      created_at: a.createdAt.toISOString(),
    })),
    created_at: dsar.createdAt.toISOString(),
    updated_at: dsar.updatedAt.toISOString(),
  });
}

const updateSchema = z.object({
  status: z
    .enum([
      "received",
      "identity_verified",
      "processing",
      "data_collected",
      "review",
      "fulfilled",
      "rejected",
      "appealed",
    ])
    .optional(),
  notes: z.string().max(8000).optional(),
  rejected_reason: z.string().max(8000).optional(),
  extension_days: z.number().int().min(0).max(90).optional(),
});

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "write")) return apiForbidden("Scope 'write' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const { id } = await props.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten());
  }

  const existing = await db.dsarRequest.findFirst({
    where: { id, orgId: auth.orgId },
  });
  if (!existing) return apiNotFound("DSAR");

  const input = parsed.data;
  const data: Record<string, unknown> = {};

  if (input.status) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.rejected_reason !== undefined) data.rejectedReason = input.rejected_reason;
  if (input.extension_days !== undefined) data.extensionDays = input.extension_days;
  if (input.status === "fulfilled") data.fulfilledAt = new Date();

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.dsarRequest.update({
      where: { id },
      data,
    });
    await tx.dsarActivity.create({
      data: {
        requestId: id,
        action: input.status ? `status_changed_to_${input.status}` : "updated",
        details: input,
        actor: `api_key:${auth.apiKeyId}`,
      },
    });
    return row;
  });

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    updated_at: updated.updatedAt.toISOString(),
  });
}
