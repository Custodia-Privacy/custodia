"use client";

import { useParams } from "next/navigation";
import { DsarForm } from "@/components/dsar-form";

export default function EmbedDsarPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  return <DsarForm siteId={siteId} compact />;
}
