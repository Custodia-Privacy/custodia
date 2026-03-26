export function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(c1: [number, number, number], c2: [number, number, number]): number {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ensureContrast(
  fg: [number, number, number],
  bg: [number, number, number],
  minRatio = 4.5,
): string {
  if (contrastRatio(fg, bg) >= minRatio) {
    return `#${fg.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  }
  const bgLum = relativeLuminance(bg);
  return bgLum > 0.5 ? "#1e293b" : "#f1f5f9";
}

/**
 * Fetch a website's HTML and extract brand colors, logo, and homepage URL.
 * Returns values suitable for the policy page style editor.
 */
export async function extractSiteBranding(domain: string) {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;

  let html = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CustodiaBot/1.0 (style-detector)" },
    });
    clearTimeout(timeout);
    html = await res.text();
  } catch {
    return null;
  }

  const extract = (pattern: RegExp): string | null => {
    const match = html.match(pattern);
    return match?.[1]?.trim() ?? null;
  };

  // Primary / accent color
  let accentColor =
    extract(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i) ??
    extract(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);

  const cssColors: string[] = [];
  const hexPattern = /#[0-9a-fA-F]{6}/g;
  let match: RegExpExecArray | null;
  while ((match = hexPattern.exec(html)) !== null) {
    const hex = match[0].toLowerCase();
    if (hex !== "#ffffff" && hex !== "#000000" && hex !== "#f8f9fa" && hex !== "#e9ecef") {
      cssColors.push(hex);
    }
  }

  if (!accentColor && cssColors.length > 0) {
    const freq = new Map<string, number>();
    for (const c of cssColors) freq.set(c, (freq.get(c) ?? 0) + 1);
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    accentColor = sorted[0]?.[0] ?? "#4f46e5";
  }

  if (!accentColor || !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    accentColor = "#4f46e5";
  }

  // Logo
  let logoUrl =
    extract(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i) ??
    extract(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);

  const ogImage =
    extract(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
    extract(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

  if (logoUrl && !logoUrl.startsWith("http")) {
    try {
      logoUrl = new URL(logoUrl, url).href;
    } catch {
      logoUrl = null;
    }
  }

  const finalLogo = logoUrl ?? ogImage ?? "";

  // Determine light or dark background based on accent luminance
  const accentRgb = hexToRgb(accentColor) ?? [79, 70, 229];
  const accentLum = relativeLuminance(accentRgb);

  let backgroundColor: string;
  let fontColor: string;
  let headingColor: string;

  if (accentLum > 0.4) {
    backgroundColor = "#0f172a";
    fontColor = "#cbd5e1";
    headingColor = "#f1f5f9";
  } else {
    backgroundColor = "#ffffff";
    fontColor = "#334155";
    headingColor = "#0f172a";
  }

  const bgRgb = hexToRgb(backgroundColor)!;
  const fontRgb = hexToRgb(fontColor)!;
  if (contrastRatio(fontRgb, bgRgb) < 4.5) {
    fontColor = backgroundColor === "#ffffff" ? "#1e293b" : "#f1f5f9";
  }

  return {
    accentColor,
    backgroundColor,
    fontColor,
    headingColor,
    logoUrl: finalLogo,
    logoLink: url,
    source: {
      colorsFound: cssColors.length,
      hadThemeColor: !!extract(/<meta[^>]*name=["']theme-color["']/i),
      hadFavicon: !!logoUrl,
      hadOgImage: !!ogImage,
    },
  };
}
