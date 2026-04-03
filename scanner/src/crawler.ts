/**
 * Site Crawler — uses Playwright to crawl a website and analyze it.
 *
 * For each page visited, captures:
 * - All cookies (first-party and third-party)
 * - Network requests to known trackers
 * - Third-party scripts
 * - Forms that collect personal data
 */
import dns from "node:dns/promises";
import type { PageScanResult, CookieInfo } from "../../src/types";
import { classifyCookie } from "./analyzers/cookies";
import { detectTrackers } from "./analyzers/trackers";
import { classifyScript } from "./analyzers/scripts";
import { detectPIIFields } from "./analyzers/data-collection";

interface CrawlOptions {
  domain: string;
  maxPages: number;
}

export interface CrawlResult {
  pages: PageScanResult[];
  totalCookies: number;
  totalTrackers: number;
  totalScripts: number;
  totalForms: number;
  crawlDuration: number;
  hasPrivacyPolicy: boolean;
  hasCookieConsent: boolean;
  hasDoNotSellLink: boolean;
  personalDataTypes: string[];
  privacyPolicyUrl: string | null;
  privacyPolicyText: string | null;
}

function isPrivateIP(ip: string): boolean {
  if (ip === "0.0.0.0" || ip === "0") return true;

  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("192.168.")) return true;

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const second = parseInt(match172[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  if (normalized.startsWith("::ffff:127.")) return true;
  if (normalized.startsWith("::ffff:10.")) return true;
  if (normalized.startsWith("::ffff:192.168.")) return true;
  if (normalized.startsWith("::ffff:169.254.")) return true;
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe80%")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  return false;
}

async function assertDomainNotPrivate(domain: string): Promise<void> {
  const results = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolve6(domain),
  ]);

  const ips: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") ips.push(...r.value);
  }

  if (ips.length === 0) {
    throw new Error(`DNS resolution failed for ${domain}`);
  }

  for (const ip of ips) {
    if (isPrivateIP(ip)) {
      throw new Error(`Domain ${domain} resolves to private IP ${ip}`);
    }
  }
}

export async function crawlSite(options: CrawlOptions): Promise<CrawlResult> {
  const { domain, maxPages } = options;
  const startTime = Date.now();

  await assertDomainNotPrivate(domain);

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    await context.route('**/*', async (route: any) => {
      try {
        const url = new URL(route.request().url());
        const hostname = url.hostname;

        if (isPrivateIP(hostname)) {
          await route.abort('blockedbyclient');
          return;
        }

        const ips = await dns.resolve4(hostname).catch(() => [] as string[]);
        for (const ip of ips) {
          if (isPrivateIP(ip)) {
            await route.abort('blockedbyclient');
            return;
          }
        }

        await route.continue();
      } catch {
        await route.continue();
      }
    });

    const visited = new Set<string>();
    const toVisit = [`https://${domain}`];
    const results: PageScanResult[] = [];
    let hasPrivacyPolicy = false;
    let hasCookieConsent = false;
    let hasDoNotSellLink = false;
    let privacyPolicyUrl: string | null = null;
    const allPIITypes = new Set<string>();

    while (toVisit.length > 0 && visited.size < maxPages) {
      const url = toVisit.shift()!;
      const normalized = normalizeUrl(url);
      if (visited.has(normalized)) continue;
      visited.add(normalized);

      try {
        const pageData = await crawlPage(context, url, domain);
        results.push(pageData.pageResult);

        if (pageData.privacyPolicyFound) hasPrivacyPolicy = true;
        if (pageData.consentBannerFound) hasCookieConsent = true;
        if (pageData.doNotSellFound) hasDoNotSellLink = true;
        if (pageData.privacyPolicyUrl && !privacyPolicyUrl) {
          privacyPolicyUrl = pageData.privacyPolicyUrl;
        }
        pageData.piiTypes.forEach((t) => allPIITypes.add(t));

        for (const link of pageData.links) {
          const normalizedLink = normalizeUrl(link);
          if (!visited.has(normalizedLink) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        }
      } catch (err) {
        console.warn(`Failed to crawl ${url}:`, err);
      }
    }

    let privacyPolicyText: string | null = null;
    if (privacyPolicyUrl) {
      try {
        privacyPolicyText = await extractPrivacyPolicyText(context, privacyPolicyUrl);
      } catch (err) {
        console.warn(`Failed to extract privacy policy from ${privacyPolicyUrl}:`, err);
      }
    }

    const totalCookies = results.reduce((sum, p) => sum + p.cookies.length, 0);
    const totalTrackers = results.reduce((sum, p) => sum + p.trackers.length, 0);
    const totalScripts = results.reduce((sum, p) => sum + p.scripts.length, 0);
    const totalForms = results.reduce((sum, p) => sum + p.forms.length, 0);

    return {
      pages: results,
      totalCookies,
      totalTrackers,
      totalScripts,
      totalForms,
      crawlDuration: Date.now() - startTime,
      hasPrivacyPolicy,
      hasCookieConsent,
      hasDoNotSellLink,
      personalDataTypes: Array.from(allPIITypes),
      privacyPolicyUrl,
      privacyPolicyText,
    };
  } finally {
    await browser.close();
  }
}

async function crawlPage(
  context: any,
  url: string,
  domain: string,
): Promise<{
  pageResult: PageScanResult;
  links: string[];
  privacyPolicyFound: boolean;
  privacyPolicyUrl: string | null;
  consentBannerFound: boolean;
  doNotSellFound: boolean;
  piiTypes: string[];
}> {
  const page = await context.newPage();

  // Track network requests for tracker detection
  const networkRequests: string[] = [];
  page.on("request", (req: any) => {
    networkRequests.push(req.url());
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    // Capture cookies and classify them
    const rawCookies = await context.cookies();
    const cookies: CookieInfo[] = rawCookies.map((c: any) => {
      const classification = classifyCookie({ name: c.name, domain: c.domain });
      return {
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        expires: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : null,
        ...classification,
      };
    });

    // Detect trackers from network requests
    const trackers = detectTrackers(networkRequests);

    // Detect and classify third-party scripts
    const rawScripts = await page.evaluate((dom: string) => {
      return Array.from(document.querySelectorAll("script[src]")).map((el) => ({
        src: (el as HTMLScriptElement).src,
        isThirdParty: !((el as HTMLScriptElement).src.includes(dom)),
      }));
    }, domain);

    const scripts = rawScripts.map((s: any) => {
      const classification = classifyScript(s.src);
      return { ...s, ...classification };
    });

    // Detect forms and PII fields
    const rawForms = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("form")).map((form) => {
        const fields = Array.from(
          form.querySelectorAll("input, select, textarea"),
        ).map((field) => {
          const el = field as HTMLInputElement;
          // Try to find associated label
          let label: string | null = null;
          if (el.id) {
            const labelEl = document.querySelector(`label[for="${el.id}"]`);
            if (labelEl) label = labelEl.textContent?.trim() ?? null;
          }
          if (!label && el.placeholder) label = el.placeholder;
          if (!label && el.getAttribute("aria-label")) label = el.getAttribute("aria-label");
          return { name: el.name || el.id || "", type: el.type || "text", label };
        });
        return {
          action: form.action || "",
          method: (form.method || "GET").toUpperCase(),
          fields,
        };
      });
    });

    const piiTypes: string[] = [];
    const forms = rawForms.map((f: any) => {
      const piiFields = detectPIIFields(f.fields);
      piiFields.forEach((pf) => piiTypes.push(pf.piiType));
      return {
        ...f,
        collectsPersonalData: piiFields.length > 0,
      };
    });

    // Extract internal links for further crawling
    const links: string[] = await page.evaluate((dom: string) => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href: string) => {
          try {
            const u = new URL(href);
            return (
              u.hostname === dom &&
              !u.hash &&
              !href.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|mp4|mp3)$/i)
            );
          } catch {
            return false;
          }
        });
    }, domain);

    // Check for privacy policy link and extract its URL
    const privacyPolicyData = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll("a")).map((a) => ({
        text: a.textContent?.toLowerCase()?.trim() ?? "",
        href: a.href,
        hrefLower: a.href.toLowerCase(),
      }));
      const policyLink = allLinks.find(
        (l) =>
          l.text.includes("privacy") ||
          l.hrefLower.includes("privacy") ||
          l.hrefLower.includes("datenschutz"),
      );
      return {
        found: !!policyLink,
        url: policyLink?.href ?? null,
      };
    });
    const privacyPolicyFound = privacyPolicyData.found;
    const privacyPolicyUrl = privacyPolicyData.url;

    // Check for cookie consent banner
    const consentBannerFound = await page.evaluate(() => {
      const text = document.body.innerHTML.toLowerCase();
      return (
        text.includes("cookie") &&
        (text.includes("consent") ||
          text.includes("accept") ||
          text.includes("agree"))
      );
    });

    // Check for "Do Not Sell" link
    const doNotSellFound = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes("do not sell") || text.includes("do not share");
    });

    return {
      pageResult: { url, cookies, trackers, scripts, forms },
      links: [...new Set(links)],
      privacyPolicyFound,
      privacyPolicyUrl,
      consentBannerFound,
      doNotSellFound,
      piiTypes: [...new Set(piiTypes)],
    };
  } finally {
    await page.close();
  }
}

/** Navigate to the privacy policy page and extract its text content (capped at 15k chars). */
async function extractPrivacyPolicyText(context: any, url: string): Promise<string | null> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const text: string = await page.evaluate(() => {
      const main = document.querySelector("main") ?? document.querySelector("article") ?? document.body;
      return main.innerText;
    });
    if (!text || text.trim().length < 100) return null;
    return text.trim().slice(0, 15_000);
  } finally {
    await page.close();
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}
