/**
 * Site Crawler — uses Playwright to crawl a website and analyze it.
 *
 * For each page visited, captures:
 * - All cookies (first-party and third-party)
 * - Network requests to known trackers
 * - Third-party scripts
 * - Forms that collect personal data
 */
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
}

export async function crawlSite(options: CrawlOptions): Promise<CrawlResult> {
  const { domain, maxPages } = options;
  const startTime = Date.now();

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const visited = new Set<string>();
    const toVisit = [`https://${domain}`];
    const results: PageScanResult[] = [];
    let hasPrivacyPolicy = false;
    let hasCookieConsent = false;
    let hasDoNotSellLink = false;
    const allPIITypes = new Set<string>();

    while (toVisit.length > 0 && visited.size < maxPages) {
      const url = toVisit.shift()!;
      const normalized = normalizeUrl(url);
      if (visited.has(normalized)) continue;
      visited.add(normalized);

      try {
        const { pageResult, links, privacyPolicyFound, consentBannerFound, doNotSellFound, piiTypes } =
          await crawlPage(context, url, domain);
        results.push(pageResult);

        if (privacyPolicyFound) hasPrivacyPolicy = true;
        if (consentBannerFound) hasCookieConsent = true;
        if (doNotSellFound) hasDoNotSellLink = true;
        piiTypes.forEach((t) => allPIITypes.add(t));

        // Add internal links for crawling
        for (const link of links) {
          const normalizedLink = normalizeUrl(link);
          if (!visited.has(normalizedLink) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        }
      } catch (err) {
        console.warn(`Failed to crawl ${url}:`, err);
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

    // Check for privacy policy link
    const privacyPolicyFound = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const links = Array.from(document.querySelectorAll("a")).map((a) => ({
        text: a.textContent?.toLowerCase() ?? "",
        href: a.href.toLowerCase(),
      }));
      return links.some(
        (l) =>
          l.text.includes("privacy") ||
          l.href.includes("privacy") ||
          l.href.includes("datenschutz"),
      );
    });

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
      consentBannerFound,
      doNotSellFound,
      piiTypes: [...new Set(piiTypes)],
    };
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
