/**
 * GET  /api/v1/webhooks — List webhook subscriptions
 * POST /api/v1/webhooks — Create a webhook subscription
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAllowedPrivacyWebhookUrl } from "@/lib/privacy-webhook";
import {
  apiList,
  apiCreated,
  apiUnauthorized,
  apiForbidden,
  apiValidationError,
  apiRateLimited,
  parsePagination,
} from "@/lib/api-response";

const SUPPORTED_EVENTS = [
  "dsar.created",
  "dsar.status_changed",
  "dsar.fulfilled",
  "consent.recorded",
  "preferences.created",
  "preferences.updated",
] as const;

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "read")) return apiForbidden("Scope 'read' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const url = new URL(req.url);
  const { page, perPage, skip } = parsePagination(url);

  const [hooks, total] = await Promise.all([
    db.webhookSubscription.findMany({
      where: { orgId: auth.orgId },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.webhookSubscription.count({ where: { orgId: auth.orgId } }),
  ]);

  return apiList(
    hooks.map((h) => ({
      id: h.id,
      url: h.url,
      events: h.events,
      active: h.active,
      created_at: h.createdAt.toISOString(),
      updated_at: h.updatedAt.toISOString(),
    })),
    { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  );
}

const createSchema = z.object({
  url: z.string().url().max(2048),
  events: z.array(z.enum(SUPPORTED_EVENTS)).min(1),
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

  if (!isAllowedPrivacyWebhookUrl(parsed.data.url)) {
    return apiValidationError({ url: "URL must use HTTPS and cannot point to internal/private addresses" });
  }

  const count = await db.webhookSubscription.count({ where: { orgId: auth.orgId } });
  if (count >= 20) {
    return apiForbidden("Maximum 20 webhook subscriptions per organization");
  }

  const secret = randomBytes(32).toString("hex");

  const hook = await db.webhookSubscription.create({
    data: {
      orgId: auth.orgId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    },
  });

  return apiCreated({
    id: hook.id,
    url: hook.url,
    events: hook.events,
    active: hook.active,
    secret,
    created_at: hook.createdAt.toISOString(),
  });
}
