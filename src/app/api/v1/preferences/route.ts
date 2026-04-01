/**
 * GET  /api/v1/preferences          — List preference centers
 * POST /api/v1/preferences/submit   — Upsert a user's preferences (see submit/route.ts)
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

  const [centers, total] = await Promise.all([
    db.preferenceCenter.findMany({
      where: { orgId: auth.orgId },
      select: {
        id: true,
        name: true,
        siteId: true,
        config: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { preferences: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.preferenceCenter.count({ where: { orgId: auth.orgId } }),
  ]);

  return apiList(
    centers.map((c) => ({
      id: c.id,
      name: c.name,
      site_id: c.siteId,
      config: c.config,
      published_at: c.publishedAt?.toISOString() ?? null,
      subscriber_count: c._count.preferences,
      created_at: c.createdAt.toISOString(),
      updated_at: c.updatedAt.toISOString(),
    })),
    { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  );
}
