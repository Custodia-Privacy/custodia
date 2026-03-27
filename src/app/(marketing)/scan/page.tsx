import type { Metadata } from "next";
import { ScanPageClient } from "./scan-client";

export const metadata: Metadata = {
  title: "Free Website Privacy Scanner — Find GDPR & CCPA Issues",
  description: "Scan any website for privacy compliance issues in 60 seconds. Find hidden trackers, consent gaps, and policy problems — free, no signup required.",
};

export default function ScanPage() {
  return <ScanPageClient />;
}
