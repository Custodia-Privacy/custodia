"use client";

import { useParams } from "next/navigation";
import { DsarForm } from "@/components/dsar-form";

/**
 * Public-facing data request page — white-labeled with the customer's branding.
 * Lives under the marketing layout but the DsarForm component handles
 * its own branding header, so the outer layout's navbar/footer provide
 * minimal framing.
 */
export default function PublicDsarPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  return (
    <div className="pt-12 pb-16">
      <DsarForm siteId={siteId} />
    </div>
  );
}
