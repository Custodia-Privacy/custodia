/**
 * API key authentication for the /api/v1/* REST API.
 *
 * Resolves a "Bearer cust_*" token from the Authorization header,
 * looks up the SHA-256 hash against the api_keys table, and returns
 * the org context. Updates lastUsed timestamp asynchronously.
 */
import { createHash } from "node:crypto";
import { db } from "./db";
import { logSecurityEvent } from "./security-events";

export interface ApiAuthContext {
  orgId: string;
  apiKeyId: string;
  scopes: string[];
}

export async function authenticateApiKey(
  req: Request,
): Promise<ApiAuthContext | null> {
  const header = req.headers.get("authorization");
  if (!header) return null;

  const match = header.match(/^Bearer\s+(cust_.+)$/i);
  if (!match) return null;

  const raw = match[1];
  const hash = createHash("sha256").update(raw).digest("hex");

  const key = await db.apiKey.findUnique({
    where: { keyHash: hash },
    select: {
      id: true,
      orgId: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) {
    logSecurityEvent("api_key.auth_failed", { reason: !key ? "not_found" : key.revokedAt ? "revoked" : "expired" });
    return null;
  }

  void db.apiKey.update({
    where: { id: key.id },
    data: { lastUsed: new Date() },
  }).catch(() => {});

  return {
    orgId: key.orgId,
    apiKeyId: key.id,
    scopes: key.scopes,
  };
}

/**
 * Check if the authenticated key has a required scope.
 */
export function hasScope(ctx: ApiAuthContext, scope: string): boolean {
  return ctx.scopes.includes("*") || ctx.scopes.includes(scope);
}
