import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Custodia",
};

export default async function PolicyPage(props: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await props.params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Privacy Policy</h1>
      <p className="mt-2 text-navy-600">
        AI-generated privacy policy based on your latest scan results.
      </p>
      {/* TODO: Policy editor with generate/publish actions */}
    </div>
  );
}
