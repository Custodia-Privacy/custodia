import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Banner — Custodia",
};

export default async function BannerPage(props: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await props.params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Cookie Consent Banner</h1>
      <p className="mt-2 text-navy-600">Configure and preview your consent banner.</p>
      {/* TODO: Banner config editor + live preview */}
    </div>
  );
}
