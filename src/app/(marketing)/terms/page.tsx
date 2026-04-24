import type { Metadata } from "next";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Custodia",
  description:
    "The terms that govern your use of Custodia's privacy compliance tools. We provide software, not legal advice.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      fileBasename="terms"
      title="Terms of Service"
      subtitle="The terms that govern your use of Custodia."
    />
  );
}
