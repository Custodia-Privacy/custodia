/**
 * GET /api/v1/consent — List consent logs for the authenticated org
 *
 * Filters: site_id, action, jurisdiction, date_from, date_to
 */
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  apiList,
  apiUnauthorized,
  apiForbidden,
  apiRateLimited,
  parsePagination,
} from "@/lib/api-response";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return apiUnauthorized();
  if (!hasScope(auth, "read")) return apiForbidden("Scope 'read' required");

  const rl = await checkRateLimit(`api:${auth.apiKeyId}`, 120, 60_000);
  if (!rl.ok) return apiRateLimited(rl);

  const url = new URL(req.url);
  const { page, perPage, skip } = parsePagination(url);

  const siteId = url.searchParams.get("site_id") ?? undefined;
  const action = url.searchParams.get("action") ?? undefined;
  const jurisdiction = url.searchParams.get("jurisdiction") ?? undefined;
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");

  const orgSiteIds = await db.site.findMany({
    where: { orgId: auth.orgId, deletedAt: null },
    select: { id: true },
  });
  const siteIds = orgSiteIds.map((s) => s.id);

  if (siteIds.length === 0) {
    return apiList([], { page, perPage, total: 0, totalPages: 0 });
  }

  const where: Record<string, unknown> = {
    siteId: siteId && siteIds.includes(siteId) ? siteId : { in: siteIds },
  };
  if (action) where.action = action;
  if (jurisdiction) where.jurisdiction = jurisdiction;
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(dateTo);
    where.createdAt = createdAt;
  }

  const [logs, total] = await Promise.all([
    db.consentLog.findMany({
      where,
      select: {
        id: true,
        siteId: true,
        visitorId: true,
        ipCountry: true,
        jurisdiction: true,
        consentGiven: true,
        action: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.consentLog.count({ where }),
  ]);

  return apiList(
    logs.map((l) => ({
      id: l.id,
      site_id: l.siteId,
      visitor_id: l.visitorId,
      ip_country: l.ipCountry,
      jurisdiction: l.jurisdiction,
      consent_given: l.consentGiven,
      action: l.action,
      created_at: l.createdAt.toISOString(),
    })),
    { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  );
}
