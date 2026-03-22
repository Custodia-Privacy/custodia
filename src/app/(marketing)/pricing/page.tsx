import type { Metadata } from "next";
import { Pricing } from "@/components/landing/pricing";
import { Comparison } from "@/components/landing/comparison";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";

export const metadata: Metadata = {
  title: "Pricing — Custodia",
  description:
    "Privacy compliance for businesses that can't afford a legal team. Free scan, plans from $29/mo.",
};

export default function PricingPage() {
  return (
    <>
      <div className="pt-24">
        <Pricing />
      </div>
      <Comparison />
      <FAQ />
      <CTA />
    </>
  );
}
