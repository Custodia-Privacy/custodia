import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan History — Custodia",
};

export default async function ScansPage(props: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await props.params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Scan History</h1>
      {/* TODO: Scan history list with status, date, findings count */}
    </div>
  );
}
