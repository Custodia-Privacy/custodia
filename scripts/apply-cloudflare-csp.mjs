#!/usr/bin/env node
/**
 * Set / update a zone Response Header Transform rule: Content-Security-Policy for app.* only.
 * Merges with existing http_response_headers_transform rules (does not replace the whole ruleset
 * with a single rule—reads entrypoint, filters out our ref, appends, PUTs back).
 *
 * Usage:
 *   export CLOUDFLARE_API_TOKEN='...'   # needs Zone.Transform Rules — Edit (or equivalent)
 *   node scripts/apply-cloudflare-csp.mjs
 *
 * Optional:
 *   CUSTODIA_ZONE_NAME=custodia-privacy.com
 *   CUSTODIA_APP_HOST=app.custodia-privacy.com
 *
 * @see https://developers.cloudflare.com/rules/transform/response-header-modification/create-api/
 */

const REF = "custodia_csp_app_set_csp";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: https://plausible.io https://cloudflareinsights.com",
  "frame-ancestors 'none'",
].join("; ");

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CUSTODIA_ZONE_NAME || "custodia-privacy.com";
const appHost = process.env.CUSTODIA_APP_HOST || "app.custodia-privacy.com";

if (!token) {
  console.error("Missing CLOUDFLARE_API_TOKEN. Create a token with Transform Rules — Edit for this zone.");
  process.exit(1);
}

async function cf(path, { method = "GET", body, allow404 = false } = {}) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (allow404 && r.status === 404) return null;
  const j = JSON.parse(text);
  if (!j.success) {
    const msg = JSON.stringify(j.errors || j, null, 2);
    const err = new Error(`Cloudflare API ${method} ${path} failed: ${msg}`);
    err.statusCode = r.status;
    throw err;
  }
  return j.result;
}

function stripRuleForPut(rule) {
  const o = {
    ref: rule.ref,
    expression: rule.expression,
    description: rule.description,
    action: rule.action,
    action_parameters: rule.action_parameters,
  };
  if (rule.id != null) o.id = rule.id;
  if (rule.enabled != null) o.enabled = rule.enabled;
  return o;
}

async function getZoneId() {
  const res = await cf(
    `/zones?name=${encodeURIComponent(zoneName)}`,
  );
  const z = res.find((x) => x.name === zoneName) || res[0];
  if (!z) throw new Error(`Zone not found: ${zoneName}`);
  return z.id;
}

async function main() {
  const zoneId = await getZoneId();
  console.log(`Zone: ${zoneName} (${zoneId})`);
  console.log(`App host: ${appHost}`);

  const newRule = {
    ref: REF,
    description: "Custodia: set CSP on app host (Plausible + CF Web Analytics beacons). Managed by repo script.",
    expression: `(http.host eq "${appHost}")`,
    action: "rewrite",
    action_parameters: {
      headers: {
        "Content-Security-Policy": {
          operation: "set",
          value: CSP,
        },
      },
    },
  };

  const ruleset = await cf(
    `/zones/${zoneId}/rulesets/phases/http_response_headers_transform/entrypoint`,
    { allow404: true },
  );

  if (!ruleset || !ruleset.id) {
    console.log("No existing response header transform ruleset — creating one with this rule.");
    const created = await cf(`/zones/${zoneId}/rulesets`, {
      method: "POST",
      body: {
        name: "Response Header Transform (Custodia)",
        kind: "zone",
        phase: "http_response_headers_transform",
        rules: [newRule],
      },
    });
    console.log("Created ruleset:", created.id, "version:", created.version);
    console.log("Done. Purge Cloudflare cache for the app URL, then verify with curl.");
    return;
  }

  rulesetId = ruleset.id;
  const existing = (ruleset.rules || []).map(stripRuleForPut);
  const without = existing.filter((r) => r.ref !== REF);
  const merged = [...without, newRule];

  await cf(`/zones/${zoneId}/rulesets/${rulesetId}`, {
    method: "PUT",
    body: { rules: merged },
  });

  console.log(`Updated ruleset ${rulesetId} (rule ref ${REF}). Rule count: ${merged.length}`);
  console.log("Done. Purge Cloudflare cache (Caching → Purge Everything), then:");
  console.log(
    `  curl -sI "https://${appHost}/login" | grep -i content-security`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
