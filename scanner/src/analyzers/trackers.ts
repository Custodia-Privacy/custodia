/**
 * Tracker detector — identifies known third-party trackers from network requests.
 */
import type { TrackerInfo, Regulation } from "../../../src/types";
import { KNOWN_TRACKERS } from "../utils/known-trackers";

export function detectTrackers(requestUrls: string[]): TrackerInfo[] {
  const found = new Map<string, TrackerInfo>();

  for (const url of requestUrls) {
    try {
      const hostname = new URL(url).hostname;
      const tracker = KNOWN_TRACKERS.find((t) => t.domainPattern.test(hostname));

      if (tracker && !found.has(tracker.name)) {
        found.set(tracker.name, {
          name: tracker.name,
          domain: hostname,
          category: tracker.category,
          description: tracker.description,
          regulations: tracker.regulations,
        });
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return Array.from(found.values());
}
