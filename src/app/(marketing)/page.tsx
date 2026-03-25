import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Comparison } from "@/components/landing/comparison";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";

export const metadata: Metadata = {
  title: "Custodia — Privacy compliance for businesses that can't afford a legal team",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Comparison />
      <FAQ />
      <CTA />
    </>
  );
}
