/**
 * Zapier trigger endpoints.
 *
 * Zapier uses a REST Hook pattern:
 *   POST /subscribe   — register a webhook URL when user enables a trigger
 *   DELETE /subscribe — remove the webhook when user disables the trigger
 *   GET  /sample      — return sample data for the Zapier editor
 *
 * These endpoints are called by the Zapier platform, authenticated via API key.
 */
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import {
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiForbidden,
  apiValidationError,
  apiNotFound,
} from "@/lib/api-response";
import { isAllowedPrivacyWebhookUrl } from "@/lib/privacy-webhook";

const ZAPIER_EVENTS = [
  "dsar.created",
  "dsar.status_changed",
  "dsar.fulfilled",
  "consent.recorded",
  "preferences.created",
  "preferences.updated",
] as const;

const subscribeSchema = z.object({
  hookUrl: z.string().url(),
  event: z.enum(ZAPIER_EVENTS),
});

/**
 * POST /api/v1/zapier/triggers — Subscribe to a trigger event (Zapier REST Hook)
 */
export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "write")) return apiForbidden("Scope 'write' required");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten());
  }

  if (!isAllowedPrivacyWebhookUrl(parsed.data.hookUrl)) {
    return apiValidationError({ hookUrl: "Invalid webhook URL" });
  }

  const secret = randomBytes(32).toString("hex");

  const hook = await db.webhookSubscription.create({
    data: {
      orgId: auth.orgId,
      url: parsed.data.hookUrl,
      events: [parsed.data.event],
      secret,
    },
  });

  return apiCreated({ id: hook.id });
}

/**
 * DELETE /api/v1/zapier/triggers — Unsubscribe from a trigger event
 */
export async function DELETE(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();

  const url = new URL(req.url);
  const hookId = url.searchParams.get("id");
  if (!hookId) return apiValidationError("Missing 'id' query parameter");

  const hook = await db.webhookSubscription.findFirst({
    where: { id: hookId, orgId: auth.orgId },
  });
  if (!hook) return apiNotFound("Webhook subscription");

  await db.webhookSubscription.delete({ where: { id: hookId } });

  return apiSuccess({ deleted: true });
}

/**
 * GET /api/v1/zapier/triggers — Return sample data for the Zapier editor
 */
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();

  const url = new URL(req.url);
  const event = url.searchParams.get("event");

  const samples: Record<string, unknown> = {
    "dsar.created": [
      {
        id: "sample-dsar-id",
        event: "dsar.created",
        request_type: "access",
        status: "received",
        jurisdiction: "gdpr",
        requester_email: "user@example.com",
        due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
    "consent.recorded": [
      {
        id: "sample-consent-id",
        event: "consent.recorded",
        site_id: "sample-site-id",
        action: "accept_all",
        consent: { necessary: true, analytics: true, marketing: true },
        jurisdiction: "gdpr",
        created_at: new Date().toISOString(),
      },
    ],
    "preferences.updated": [
      {
        id: "sample-pref-id",
        event: "preferences.updated",
        center_id: "sample-center-id",
        email: "user@example.com",
        preferences: { marketing_emails: true, product_updates: false },
        source: "api",
        updated_at: new Date().toISOString(),
      },
    ],
  };

  const data = event && samples[event] ? samples[event] : Object.values(samples)[0];
  return apiSuccess(data);
}
