/**
 * GET    /api/v1/webhooks/:id — Get a webhook subscription
 * PATCH  /api/v1/webhooks/:id — Update a webhook subscription
 * DELETE /api/v1/webhooks/:id — Delete a webhook subscription
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAllowedPrivacyWebhookUrl } from "@/lib/privacy-webhook";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";

const SUPPORTED_EVENTS = [
  "dsar.created",
  "dsar.status_changed",
  "dsar.fulfilled",
  "consent.recorded",
  "preferences.created",
  "preferences.updated",
] as const;

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
  const hook = await db.webhookSubscription.findFirst({
    where: { id, orgId: auth.orgId },
  });
  if (!hook) return apiNotFound("Webhook subscription");

  return apiSuccess({
    id: hook.id,
    url: hook.url,
    events: hook.events,
    active: hook.active,
    created_at: hook.createdAt.toISOString(),
    updated_at: hook.updatedAt.toISOString(),
  });
}

const updateSchema = z.object({
  url: z.string().url().max(2048).optional(),
  events: z.array(z.enum(SUPPORTED_EVENTS)).min(1).optional(),
  active: z.boolean().optional(),
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

  const existing = await db.webhookSubscription.findFirst({
    where: { id, orgId: auth.orgId },
  });
  if (!existing) return apiNotFound("Webhook subscription");

  if (parsed.data.url && !isAllowedPrivacyWebhookUrl(parsed.data.url)) {
    return apiValidationError({ url: "URL must use HTTPS and cannot point to internal/private addresses" });
  }

  const updated = await db.webhookSubscription.update({
    where: { id },
    data: {
      ...(parsed.data.url ? { url: parsed.data.url } : {}),
      ...(parsed.data.events ? { events: parsed.data.events } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
  });

  return apiSuccess({
    id: updated.id,
    url: updated.url,
    events: updated.events,
    active: updated.active,
    updated_at: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "write")) return apiForbidden("Scope 'write' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const { id } = await props.params;

  const existing = await db.webhookSubscription.findFirst({
    where: { id, orgId: auth.orgId },
  });
  if (!existing) return apiNotFound("Webhook subscription");

  await db.webhookSubscription.delete({ where: { id } });

  return apiSuccess({ deleted: true });
}
