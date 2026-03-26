/**
 * Default cookie-banner editor config (must satisfy `bannerConfigSchema` in the banner router).
 */

export interface CookieDetail {
  name: string;
  purpose: string;
  provider: string;
  expiry: string;
  type: "cookie" | "localStorage" | "sessionStorage" | "pixel" | "fingerprint";
}

export interface BannerCategory {
  key: string;
  name: string;
  description: string;
  required: boolean;
  cookies: CookieDetail[];
}

export const DEFAULT_BANNER_CONFIG = {
  position: "bottom" as "bottom" | "bottom-left" | "bottom-right" | "center",
  theme: "light" as "light" | "dark" | "auto",
  primaryColor: "#4F46E5",
  backgroundColor: "" as string,
  textColor: "" as string,
  logoUrl: "" as string,
  showLogo: true,
  customCss: "",
  content: {
    title: "We value your privacy",
    description:
      "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
    acceptAllText: "Accept All",
    rejectAllText: "Reject All",
    customizeText: "Customize",
    privacyPolicyUrl: "/privacy",
  },
  categories: [
    {
      key: "necessary",
      name: "Necessary",
      description: "Essential cookies required for the website to function properly.",
      required: true,
      cookies: [] as CookieDetail[],
    },
    {
      key: "analytics",
      name: "Analytics",
      description: "Help us understand how visitors interact with our website.",
      required: false,
      cookies: [] as CookieDetail[],
    },
    {
      key: "marketing",
      name: "Marketing",
      description: "Used to deliver relevant advertisements.",
      required: false,
      cookies: [] as CookieDetail[],
    },
  ] as BannerCategory[],
  vendors: [] as { name: string; purpose: string; privacyUrl: string; country: string }[],
  regulations: {
    gdpr: { enabled: true, mode: "opt-in" as const },
    ccpa: { enabled: true, mode: "opt-out" as const },
  },
};
