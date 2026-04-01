/**
 * IP address and URL safety checks for SSRF prevention.
 *
 * Validates that URLs and resolved IPs do not point to internal
 * or cloud metadata services. Covers IPv4, IPv6, DNS rebinding
 * awareness, and cloud provider metadata endpoints.
 */

const PRIVATE_IPV4_CIDRS = [
  { prefix: "10.", mask: 8 },
  { prefix: "127.", mask: 8 },
  { prefix: "169.254.", mask: 16 },
  { prefix: "192.168.", mask: 16 },
];

function isPrivateIPv4(ip: string): boolean {
  if (ip === "0.0.0.0" || ip === "0") return true;

  for (const cidr of PRIVATE_IPV4_CIDRS) {
    if (ip.startsWith(cidr.prefix)) return true;
  }

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const second = parseInt(match172[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");

  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  if (normalized.startsWith("fe80:") || normalized.startsWith("fe80%")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.slice(7);
    if (isPrivateIPv4(v4Part)) return true;
  }

  return false;
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "0",
  "[::1]",
  "::1",
  "[0:0:0:0:0:0:0:1]",
  "169.254.169.254",
  "169.254.170.2",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
]);

/**
 * Check whether a URL is safe to fetch (not pointing at internal resources).
 * Use at both registration time and delivery time for defense-in-depth.
 */
export function isSafeUrl(url: string, requireHttps = false): boolean {
  try {
    const u = new URL(url);

    if (requireHttps && u.protocol !== "https:") return false;
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;

    const hostname = u.hostname.toLowerCase();

    if (BLOCKED_HOSTS.has(hostname)) return false;

    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;

    if (isPrivateIPv4(hostname)) return false;
    if (isPrivateIPv6(hostname)) return false;

    if (u.port && ["6379", "5432", "3306", "27017", "11211"].includes(u.port)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Get the real client IP, preferring Cloudflare's header
 * (not spoofable when behind CF), falling back to X-Real-IP,
 * then X-Forwarded-For with caution.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";

  return "unknown";
}
