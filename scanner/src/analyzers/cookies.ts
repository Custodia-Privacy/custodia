/**
 * Cookie analyzer — classifies cookies by category and identifies known services.
 */
import type { CookieInfo } from "../../../src/types";
import { KNOWN_COOKIES } from "../utils/cookie-db";

export function classifyCookie(
  cookie: Pick<CookieInfo, "name" | "domain">,
): Pick<CookieInfo, "category" | "description" | "knownService"> {
  // Check against known cookie database
  const known = KNOWN_COOKIES.find(
    (k) =>
      k.namePattern.test(cookie.name) ||
      (k.domainPattern && k.domainPattern.test(cookie.domain)),
  );

  if (known) {
    return {
      category: known.category,
      description: known.description,
      knownService: known.service,
    };
  }

  // Heuristic classification based on name patterns
  if (/^(session|csrf|XSRF|__Host|__Secure)/i.test(cookie.name)) {
    return { category: "necessary", description: null, knownService: null };
  }
  if (/^(_ga|_gid|_gat|amplitude|mp_|mixpanel)/i.test(cookie.name)) {
    return { category: "analytics", description: null, knownService: null };
  }
  if (/^(_fb|_gcl|ads|doubleclick|__utm)/i.test(cookie.name)) {
    return { category: "marketing", description: null, knownService: null };
  }

  return { category: "unknown", description: null, knownService: null };
}
