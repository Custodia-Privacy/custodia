/**
 * Script analyzer — identifies and categorizes third-party scripts.
 */

interface ScriptClassification {
  service: string | null;
  category: string | null;
}

const SCRIPT_PATTERNS: { pattern: RegExp; service: string; category: string }[] = [
  { pattern: /google-analytics\.com|googletagmanager\.com|gtag/, service: "Google Analytics", category: "analytics" },
  { pattern: /facebook\.net|fbevents/, service: "Meta Pixel", category: "advertising" },
  { pattern: /hotjar\.com/, service: "Hotjar", category: "analytics" },
  { pattern: /segment\.com|segment\.io/, service: "Segment", category: "analytics" },
  { pattern: /intercom\.io/, service: "Intercom", category: "customer-support" },
  { pattern: /crisp\.chat/, service: "Crisp", category: "customer-support" },
  { pattern: /drift\.com/, service: "Drift", category: "customer-support" },
  { pattern: /hubspot\.com/, service: "HubSpot", category: "marketing" },
  { pattern: /mixpanel\.com/, service: "Mixpanel", category: "analytics" },
  { pattern: /amplitude\.com/, service: "Amplitude", category: "analytics" },
  { pattern: /sentry\.io/, service: "Sentry", category: "error-tracking" },
  { pattern: /fullstory\.com/, service: "FullStory", category: "analytics" },
  { pattern: /clarity\.ms/, service: "Microsoft Clarity", category: "analytics" },
  { pattern: /tiktok\.com/, service: "TikTok Pixel", category: "advertising" },
  { pattern: /linkedin\.com\/insight/, service: "LinkedIn Insight", category: "advertising" },
  { pattern: /twitter\.com|twimg\.com/, service: "Twitter/X", category: "social" },
  { pattern: /stripe\.com/, service: "Stripe", category: "payments" },
  { pattern: /recaptcha|hcaptcha/, service: "CAPTCHA", category: "security" },
];

export function classifyScript(src: string): ScriptClassification {
  for (const { pattern, service, category } of SCRIPT_PATTERNS) {
    if (pattern.test(src)) {
      return { service, category };
    }
  }
  return { service: null, category: null };
}
