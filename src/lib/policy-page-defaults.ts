export interface PolicyPageStyle {
  fontFamily: string;
  fontColor: string;
  headingColor: string;
  backgroundColor: string;
  accentColor: string;
  logoUrl: string;
  logoLink: string;
  showTableOfContents: boolean;
  showPoweredBy: boolean;
}

export const DEFAULT_POLICY_PAGE_STYLE: PolicyPageStyle = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontColor: "#334155",
  headingColor: "#0f172a",
  backgroundColor: "#ffffff",
  accentColor: "#4f46e5",
  logoUrl: "",
  logoLink: "",
  showTableOfContents: true,
  showPoweredBy: true,
};
