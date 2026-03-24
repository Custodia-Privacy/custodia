/**
 * Default cookie-banner editor config (must satisfy `bannerConfigSchema` in the banner router).
 */
export const DEFAULT_BANNER_CONFIG = {
  position: "bottom" as const,
  theme: "light" as const,
  primaryColor: "#4F46E5",
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
      cookies: [] as string[],
    },
    {
      key: "analytics",
      name: "Analytics",
      description: "Help us understand how visitors interact with our website.",
      required: false,
      cookies: [] as string[],
    },
    {
      key: "marketing",
      name: "Marketing",
      description: "Used to deliver relevant advertisements.",
      required: false,
      cookies: [] as string[],
    },
  ],
  regulations: {
    gdpr: { enabled: true, mode: "opt-in" as const },
    ccpa: { enabled: true, mode: "opt-out" as const },
  },
};
