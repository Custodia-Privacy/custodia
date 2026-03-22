/**
 * Database of known third-party trackers.
 * Used by the tracker analyzer to identify and classify network requests.
 */
import type { Regulation } from "../../../src/types";

interface KnownTracker {
  name: string;
  domainPattern: RegExp;
  category: "analytics" | "advertising" | "social" | "fingerprinting" | "other";
  description: string;
  regulations: Regulation[];
}

export const KNOWN_TRACKERS: KnownTracker[] = [
  {
    name: "Google Analytics",
    domainPattern: /google-analytics\.com|googletagmanager\.com|analytics\.google\.com/,
    category: "analytics",
    description: "Collects website usage data including page views, session duration, and user demographics.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Meta Pixel (Facebook)",
    domainPattern: /facebook\.net|facebook\.com\/tr|connect\.facebook/,
    category: "advertising",
    description: "Tracks user activity for ad targeting and conversion measurement across Facebook/Meta platforms.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Google Ads",
    domainPattern: /doubleclick\.net|googlesyndication\.com|googleadservices\.com/,
    category: "advertising",
    description: "Serves targeted ads and tracks ad conversions.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Hotjar",
    domainPattern: /hotjar\.com/,
    category: "analytics",
    description: "Records user sessions, heatmaps, and behavior analytics.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Microsoft Clarity",
    domainPattern: /clarity\.ms/,
    category: "analytics",
    description: "Session recordings and heatmaps for user behavior analysis.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "TikTok Pixel",
    domainPattern: /analytics\.tiktok\.com|tiktok\.com\/i18n/,
    category: "advertising",
    description: "Tracks conversions and user activity for TikTok ad targeting.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "LinkedIn Insight",
    domainPattern: /linkedin\.com\/insight|snap\.licdn\.com/,
    category: "advertising",
    description: "Tracks website conversions for LinkedIn ad campaigns.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Twitter/X Pixel",
    domainPattern: /t\.co\/i\/adsct|analytics\.twitter\.com/,
    category: "advertising",
    description: "Conversion tracking for Twitter/X advertising.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Segment",
    domainPattern: /segment\.com|segment\.io|cdn\.segment/,
    category: "analytics",
    description: "Customer data platform that collects and routes analytics data.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Mixpanel",
    domainPattern: /mixpanel\.com|mxpnl\.com/,
    category: "analytics",
    description: "Product analytics tracking user events and behavior.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Amplitude",
    domainPattern: /amplitude\.com|cdn\.amplitude/,
    category: "analytics",
    description: "Product analytics platform for user behavior tracking.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "FullStory",
    domainPattern: /fullstory\.com/,
    category: "analytics",
    description: "Session replay and digital experience analytics.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Intercom",
    domainPattern: /intercom\.io|intercomcdn\.com/,
    category: "other",
    description: "Customer messaging platform — may collect visitor data for targeting.",
    regulations: ["gdpr"],
  },
  {
    name: "HubSpot",
    domainPattern: /hubspot\.com|hs-scripts\.com|hs-analytics\.net/,
    category: "analytics",
    description: "Marketing and CRM analytics tracking.",
    regulations: ["gdpr", "ccpa"],
  },
  {
    name: "Sentry",
    domainPattern: /sentry\.io/,
    category: "other",
    description: "Error monitoring — collects diagnostic data including IP addresses.",
    regulations: ["gdpr"],
  },
];
