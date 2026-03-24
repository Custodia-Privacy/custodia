import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Minimal public metadata for DSAR form branding (no auth).
 */
export async function GET(
  _req: Request,
  props: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await props.params;

  const site = await db.site.findFirst({
    where: { id: siteId, deletedAt: null },
    select: { id: true, domain: true, name: true },
  });

  if (!site) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    siteId: site.id,
    domain: site.domain,
    name: site.name,
  });
}
