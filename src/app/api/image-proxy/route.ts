import { NextRequest, NextResponse } from "next/server";
import { isSafeUrl, fetchSafely } from "@/lib/ip-check";

// SVG is intentionally excluded: it can contain inline <script> that executes
// same-origin when loaded as a top-level document, enabling session theft.
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/x-icon"]);
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetchSafely(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(5000),
      maxRedirects: 0,
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream returned " + upstream.status }, { status: 502 });
    }

    const ct = upstream.headers.get("content-type") ?? "";
    const baseType = ct.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(baseType)) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }

    const body = await upstream.arrayBuffer();
    if (body.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": baseType,
        "Content-Disposition": 'inline; filename="image"',
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
