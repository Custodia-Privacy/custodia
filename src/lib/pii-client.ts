/**
 * HTTP client for the self-hosted PII engine (OpenAI Privacy Filter).
 * Set PII_ENGINE_URL (e.g. http://pii-engine:8090). When the service is down,
 * callers should treat errors as scan failures (retriable).
 */

export type OperatingPoint = "balanced" | "high_recall" | "high_precision";

export interface PiiSpan {
  label: string;
  score: number;
  start: number;
  end: number;
}

export interface PiiClassifyItem {
  spans: PiiSpan[];
}

export async function classifyTexts(
  texts: string[],
  operatingPoint: OperatingPoint = "balanced",
): Promise<PiiClassifyItem[]> {
  const base = process.env.PII_ENGINE_URL ?? "http://127.0.0.1:8090";
  const res = await fetch(`${base.replace(/\/$/, "")}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, operating_point: operatingPoint }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`PII engine ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { items?: PiiClassifyItem[] };
  return json.items ?? [];
}

/** Dev fallback when engine returns empty — avoids crashing local dev without Docker PII. */
export function aggregateLabelsFromClassify(items: PiiClassifyItem[]): Map<string, { hits: number; scoreSum: number }> {
  const acc = new Map<string, { hits: number; scoreSum: number }>();
  for (const item of items) {
    for (const span of item.spans ?? []) {
      const cur = acc.get(span.label) ?? { hits: 0, scoreSum: 0 };
      cur.hits += 1;
      cur.scoreSum += span.score;
      acc.set(span.label, cur);
    }
  }
  return acc;
}
