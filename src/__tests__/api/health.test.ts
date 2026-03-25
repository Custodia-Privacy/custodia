import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db before importing the route handler
vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

import { GET } from "@/app/api/health/route";
import { db } from "@/lib/db";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with ok:true when database is up", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("custodia");
    expect(body.database).toBe("up");
    expect(body.timestamp).toBeDefined();
  });

  it("should return 503 with ok:false when database is down", async () => {
    vi.mocked(db.$queryRaw).mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.service).toBe("custodia");
    expect(body.database).toBe("down");
    expect(body.timestamp).toBeDefined();
  });

  it("should include a valid ISO timestamp", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });
});
