import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site Detail — Custodia",
};

export default async function SiteDetailPage(props: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await props.params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Site Detail</h1>
      <p className="mt-2 text-navy-600">Site ID: {siteId}</p>
      {/* TODO: Compliance score card, latest scan summary, quick actions */}
    </div>
  );
}
