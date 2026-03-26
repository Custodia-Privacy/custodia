import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public metadata for DSAR form branding (no auth required).
 * Returns site info + organization branding for white-labeled forms.
 */
export async function GET(
  _req: Request,
  props: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await props.params;

  const site = await db.site.findFirst({
    where: { id: siteId, deletedAt: null },
    select: {
      id: true,
      domain: true,
      name: true,
      org: {
        select: {
          brandName: true,
          brandLogoUrl: true,
          brandColor: true,
          brandWebsite: true,
          name: true,
        },
      },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    siteId: site.id,
    domain: site.domain,
    name: site.name,
    branding: {
      companyName: site.org.brandName || site.org.name,
      logoUrl: site.org.brandLogoUrl || null,
      accentColor: site.org.brandColor || null,
      website: site.org.brandWebsite || `https://${site.domain}`,
    },
  });
}
