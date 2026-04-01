/**
 * GET /api/v1/sites — List sites for the authenticated org
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

  const [sites, total] = await Promise.all([
    db.site.findMany({
      where: { orgId: auth.orgId, deletedAt: null },
      select: {
        id: true,
        domain: true,
        name: true,
        verified: true,
        monitoringEnabled: true,
        scanFrequency: true,
        lastScannedAt: true,
        complianceScore: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            consentLogs: true,
            dsarRequests: true,
            preferenceCenters: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.site.count({ where: { orgId: auth.orgId, deletedAt: null } }),
  ]);

  return apiList(
    sites.map((s) => ({
      id: s.id,
      domain: s.domain,
      name: s.name,
      verified: s.verified,
      monitoring_enabled: s.monitoringEnabled,
      scan_frequency: s.scanFrequency,
      last_scanned_at: s.lastScannedAt?.toISOString() ?? null,
      compliance_score: s.complianceScore,
      consent_log_count: s._count.consentLogs,
      dsar_count: s._count.dsarRequests,
      preference_center_count: s._count.preferenceCenters,
      created_at: s.createdAt.toISOString(),
      updated_at: s.updatedAt.toISOString(),
    })),
    { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  );
}
