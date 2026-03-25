import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    site: { findFirst: vi.fn() },
    dsarRequest: { create: vi.fn() },
    dsarActivity: { create: vi.fn() },
    orgMember: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/public-rate-limit", () => ({
  checkPublicRateLimit: vi.fn().mockReturnValue({ ok: true }),
}));

vi.mock("@/lib/dsar-deadlines", () => ({
  computeDsarDueDate: vi.fn().mockReturnValue(new Date("2026-02-15T00:00:00Z")),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: "email-1" }) },
  })),
}));

import { POST } from "@/app/api/public/dsar/route";
import { db } from "@/lib/db";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";

const VALID_SITE_ID = "550e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/public/dsar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  siteId: VALID_SITE_ID,
  requestType: "access",
  jurisdiction: "gdpr",
  requesterName: "Jane Doe",
  requesterEmail: "jane@example.com",
};

describe("POST /api/public/dsar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPublicRateLimit).mockReturnValue({ ok: true });
    vi.mocked(db.site.findFirst).mockResolvedValue({
      id: VALID_SITE_ID,
      orgId: "org-1",
      domain: "example.com",
    } as any);
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
      return fn({
        dsarRequest: {
          create: vi.fn().mockResolvedValue({ id: "dsar-1" }),
        },
        dsarActivity: {
          create: vi.fn().mockResolvedValue({ id: "activity-1" }),
        },
      });
    });
    vi.mocked(db.orgMember.findFirst).mockResolvedValue(null);
  });

  it("should accept a valid DSAR submission and return 201", async () => {
    const req = makeRequest(validBody);
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.reference).toBe("dsar-1");
    expect(body.message).toBeDefined();
  });

  it("should accept all valid request types", async () => {
    const types = ["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"];
    for (const requestType of types) {
      const req = makeRequest({ ...validBody, requestType });
      const response = await POST(req);
      expect(response.status).toBe(201);
    }
  });

  it("should return 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost:3000/api/public/dsar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: "not valid json{{{",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_json");
  });

  it("should return 400 for missing required fields", async () => {
    const req = makeRequest({ siteId: VALID_SITE_ID });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("validation_error");
  });

  it("should return 400 for invalid email format", async () => {
    const req = makeRequest({ ...validBody, requesterEmail: "not-email" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid siteId (non-UUID)", async () => {
    const req = makeRequest({ ...validBody, siteId: "not-a-uuid" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid requestType", async () => {
    const req = makeRequest({ ...validBody, requestType: "invalid_type" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 404 when site is not found", async () => {
    vi.mocked(db.site.findFirst).mockResolvedValue(null);

    const req = makeRequest(validBody);
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("site_not_found");
  });

  it("should return 429 when rate limited", async () => {
    vi.mocked(checkPublicRateLimit).mockReturnValue({ ok: false, retryAfterSec: 3500 });

    const req = makeRequest(validBody);
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("rate_limited");
    expect(response.headers.get("Retry-After")).toBe("3500");
  });

  it("should silently accept honeypot submissions (return 201 without creating record)", async () => {
    const req = makeRequest({ ...validBody, website: "http://spam.com" });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    // Should NOT have called the database transaction
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("should allow optional phone and details fields", async () => {
    const req = makeRequest({
      ...validBody,
      requesterPhone: "+1-555-0100",
      details: "Please delete all my data.",
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it("should reject details longer than 8000 characters", async () => {
    const req = makeRequest({
      ...validBody,
      details: "x".repeat(8001),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should use x-forwarded-for header for rate limiting key", async () => {
    const req = makeRequest(validBody, { "x-forwarded-for": "10.0.0.1" });
    await POST(req);

    expect(checkPublicRateLimit).toHaveBeenCalledWith(
      "dsar:10.0.0.1",
      15,
      expect.any(Number),
    );
  });
});
