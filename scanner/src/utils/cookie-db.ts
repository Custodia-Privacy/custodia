/**
 * Database of known cookies and their classifications.
 * Used by the cookie analyzer to identify cookie purposes.
 */
import type { CookieInfo } from "../../../src/types";

interface KnownCookie {
  namePattern: RegExp;
  domainPattern?: RegExp;
  category: CookieInfo["category"];
  service: string;
  description: string;
}

export const KNOWN_COOKIES: KnownCookie[] = [
  // Google Analytics
  { namePattern: /^_ga$/, category: "analytics", service: "Google Analytics", description: "Distinguishes unique users by assigning a randomly generated number." },
  { namePattern: /^_ga_/, category: "analytics", service: "Google Analytics", description: "Used to persist session state in GA4." },
  { namePattern: /^_gid$/, category: "analytics", service: "Google Analytics", description: "Distinguishes users. Expires after 24 hours." },
  { namePattern: /^_gat/, category: "analytics", service: "Google Analytics", description: "Used to throttle request rate." },

  // Facebook
  { namePattern: /^_fbp$/, category: "marketing", service: "Meta Pixel", description: "Tracks visits across websites for Facebook ad delivery." },
  { namePattern: /^_fbc$/, category: "marketing", service: "Meta Pixel", description: "Stores last Facebook click ID for ad attribution." },

  // Hotjar
  { namePattern: /^_hj/, category: "analytics", service: "Hotjar", description: "Hotjar analytics and session recording cookie." },

  // HubSpot
  { namePattern: /^__hs/, category: "marketing", service: "HubSpot", description: "HubSpot marketing analytics cookie." },
  { namePattern: /^hubspotutk$/, category: "marketing", service: "HubSpot", description: "Tracks visitor identity for HubSpot CRM." },

  // Intercom
  { namePattern: /^intercom-/, category: "preferences", service: "Intercom", description: "Intercom messenger state cookie." },

  // Stripe
  { namePattern: /^__stripe/, category: "necessary", service: "Stripe", description: "Stripe payment processing and fraud prevention." },

  // Cloudflare
  { namePattern: /^__cf/, category: "necessary", service: "Cloudflare", description: "Cloudflare bot detection and CDN performance." },
  { namePattern: /^cf_clearance$/, category: "necessary", service: "Cloudflare", description: "Cloudflare challenge clearance proof." },

  // Microsoft Clarity
  { namePattern: /^_clck$/, category: "analytics", service: "Microsoft Clarity", description: "Clarity user ID for session replay." },
  { namePattern: /^_clsk$/, category: "analytics", service: "Microsoft Clarity", description: "Clarity session tracking." },

  // Mixpanel
  { namePattern: /^mp_/, category: "analytics", service: "Mixpanel", description: "Mixpanel analytics tracking cookie." },

  // Segment
  { namePattern: /^ajs_/, category: "analytics", service: "Segment", description: "Segment analytics.js user tracking." },

  // Google Ads
  { namePattern: /^_gcl_/, category: "marketing", service: "Google Ads", description: "Google Ads click tracking for conversion measurement." },
];
