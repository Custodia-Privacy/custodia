import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    consentLog: { create: vi.fn() },
    site: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/privacy-webhook", () => ({
  deliverPrivacyWebhook: vi.fn(),
}));

// Rate limiter is Redis-backed. Stub it out so tests never hit the socket
// and so all requests in this file fall below the window cap.
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    ok: true,
    limit: 60,
    remaining: 60,
    retryAfterSec: 0,
    resetAt: Date.now() + 60_000,
  }),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

import { POST, OPTIONS } from "@/app/api/banner/[siteId]/consent/route";
import { db } from "@/lib/db";
import { deliverPrivacyWebhook } from "@/lib/privacy-webhook";
import { checkRateLimit } from "@/lib/rate-limit";

// Route validates siteId against a UUID regex and rejects anything else
// with 400 "Invalid siteId". Use a real UUID here.
const SITE_ID = "123e4567-e89b-12d3-a456-426614174000";

function makeRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return new Request(`http://localhost:3000/api/banner/${SITE_ID}/consent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function makeProps() {
  return { params: Promise.resolve({ siteId: SITE_ID }) };
}

// Route only accepts actions from a fixed set: accept_all | reject_all | customize.
// "accept_selected" was the old shape; tests that used it silently failed.
const validBody = {
  consent: { analytics: true, marketing: false },
  action: "accept_all",
  visitorId: "visitor-abc-123",
  userAgent: "Mozilla/5.0",
};

describe("POST /api/banner/[siteId]/consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply mock return values that clearAllMocks just wiped.
    vi.mocked(checkRateLimit).mockResolvedValue({
      ok: true,
      limit: 60,
      remaining: 60,
      retryAfterSec: 0,
      resetAt: Date.now() + 60_000,
    });
    vi.mocked(db.consentLog.create).mockResolvedValue({
      id: "log-1",
      siteId: SITE_ID,
      visitorId: "visitor-abc-123",
    } as any);
    // Default: the site exists so the happy path can reach the create call.
    // Individual tests can override when they want to test not-found / webhook
    // behavior.
    vi.mocked(db.site.findUnique).mockResolvedValue({
      id: SITE_ID,
      orgId: "org-1",
      domain: "example.com",
      deletedAt: null,
      privacyWebhookUrl: null,
      privacyWebhookSecret: null,
    } as any);
  });

  it("should record consent and return ok:true", async () => {
    const req = makeRequest(validBody);
    const response = await POST(req, makeProps());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("should create a consent log record", async () => {
    const req = makeRequest(validBody);
    await POST(req, makeProps());

    expect(db.consentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        siteId: SITE_ID,
        visitorId: "visitor-abc-123",
        consentGiven: validBody.consent,
        action: "accept_all",
      }),
    });
  });

  it("should return 400 when consent field is missing", async () => {
    const req = makeRequest({ action: "accept_all", visitorId: "v1" });
    const response = await POST(req, makeProps());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid consent");
  });

  it("should return 400 when action field is missing", async () => {
    const req = makeRequest({ consent: { analytics: true }, visitorId: "v1" });
    const response = await POST(req, makeProps());
    expect(response.status).toBe(400);
  });

  it("should return 400 when visitorId is missing", async () => {
    const req = makeRequest({ consent: { analytics: true }, action: "accept_all" });
    const response = await POST(req, makeProps());
    expect(response.status).toBe(400);
  });

  it("should detect GDPR jurisdiction from cf-ipcountry header", async () => {
    const req = makeRequest(validBody, { "cf-ipcountry": "DE" });
    await POST(req, makeProps());

    expect(db.consentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipCountry: "DE",
        jurisdiction: "gdpr",
      }),
    });
  });

  it("should detect CCPA jurisdiction for US country code", async () => {
    const req = makeRequest(validBody, { "cf-ipcountry": "US" });
    await POST(req, makeProps());

    expect(db.consentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipCountry: "US",
        jurisdiction: "ccpa",
      }),
    });
  });

  it("should set jurisdiction to null for unknown countries", async () => {
    const req = makeRequest(validBody, { "cf-ipcountry": "JP" });
    await POST(req, makeProps());

    expect(db.consentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipCountry: "JP",
        jurisdiction: null,
      }),
    });
  });

  it("should fallback to x-vercel-ip-country when cf-ipcountry absent", async () => {
    const req = makeRequest(validBody, { "x-vercel-ip-country": "FR" });
    await POST(req, makeProps());

    expect(db.consentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipCountry: "FR",
        jurisdiction: "gdpr",
      }),
    });
  });

  it("should include CORS headers in response", async () => {
    const req = makeRequest(validBody);
    const response = await POST(req, makeProps());

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("should trigger privacy webhook when site has webhook configured", async () => {
    vi.mocked(db.site.findUnique).mockResolvedValue({
      orgId: "org-1",
      domain: "example.com",
      privacyWebhookUrl: "https://hooks.example.com/consent",
      privacyWebhookSecret: "whsec_test123",
    } as any);

    const req = makeRequest(validBody);
    await POST(req, makeProps());

    expect(deliverPrivacyWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://hooks.example.com/consent",
        secret: "whsec_test123",
        event: "consent.recorded",
      }),
    );
  });

  it("should NOT trigger webhook when site has no webhook configured", async () => {
    vi.mocked(db.site.findUnique).mockResolvedValue({
      orgId: "org-1",
      domain: "example.com",
      privacyWebhookUrl: null,
      privacyWebhookSecret: null,
    } as any);

    const req = makeRequest(validBody);
    await POST(req, makeProps());

    expect(deliverPrivacyWebhook).not.toHaveBeenCalled();
  });

  it("should truncate userAgent to 500 characters", async () => {
    const longUA = "A".repeat(600);
    const req = makeRequest({ ...validBody, userAgent: longUA });
    await POST(req, makeProps());

    expect(db.consentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userAgent: "A".repeat(500),
      }),
    });
  });

  it("should return 500 on database error", async () => {
    vi.mocked(db.consentLog.create).mockRejectedValue(new Error("DB down"));

    const req = makeRequest(validBody);
    const response = await POST(req, makeProps());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Failed");
  });
});

describe("OPTIONS /api/banner/[siteId]/consent", () => {
  it("should return CORS preflight headers", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });
});
