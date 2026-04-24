import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2a$12$hashed"),
}));

vi.mock("@/lib/utils", () => ({
  slugify: vi.fn((s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
}));

// The real rate limiter backs onto Redis (IORedis). In test mode Redis isn't
// running, and every test in this file reuses the same client IP (jsdom's
// Request has no X-Forwarded-For), so by the 6th call the 5/hour budget is
// exhausted and the route returns 429 instead of the 400 each test expects.
// We only care about signup's own validation logic here, so stub the limiter
// to always allow the request through.
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true, remaining: 999 }),
}));

import { POST } from "@/app/api/auth/signup/route";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks wipes the mockResolvedValue set in the vi.mock factory above,
    // so re-apply it here — otherwise checkRateLimit returns undefined, the route
    // reads .ok off it, throws, and every test gets a 500.
    vi.mocked(checkRateLimit).mockResolvedValue({
      ok: true,
      limit: 999,
      remaining: 999,
      retryAfterSec: 0,
      resetAt: Date.now() + 3600_000,
    });
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.organization.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    } as any);
    vi.mocked(db.organization.create).mockResolvedValue({
      id: "org-1",
      slug: "test-users-organization",
    } as any);
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      identifier: "test@example.com",
      token: "hashed-token",
      expires: new Date(),
    } as any);
  });

  it("should create a new user with valid input", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "securepassword123",
      name: "Test User",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.userId).toBe("user-1");
  });

  it("should create a default organization for new users", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "securepassword123",
      name: "Test User",
    });

    await POST(req);

    expect(db.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Test User's Organization",
        }),
      }),
    );
  });

  it("should use custom orgName when provided", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "securepassword123",
      name: "Test User",
      orgName: "My Company",
    });

    await POST(req);

    expect(db.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "My Company",
        }),
      }),
    );
  });

  it("should not leak account existence when email is already registered", async () => {
    // Security: the signup route intentionally returns a generic 201 with
    // { needsVerification: true } even when the email is already in use with
    // a password. This prevents account-enumeration via the public endpoint
    // (attacker sending /signup requests to find valid emails).
    // No user.create / organization.create should happen — the route should
    // short-circuit before touching them.
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "existing-user",
      email: "test@example.com",
      passwordHash: "$2a$12$existing",
    } as any);

    const req = makeRequest({
      email: "test@example.com",
      password: "securepassword123",
      name: "Test User",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.needsVerification).toBe(true);
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.organization.create).not.toHaveBeenCalled();
  });

  it("should update invited user (no passwordHash) with credentials", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "invited-user",
      email: "invited@example.com",
      passwordHash: null,
    } as any);

    const req = makeRequest({
      email: "invited@example.com",
      password: "securepassword123",
      name: "Invited User",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.userId).toBe("invited-user");
    expect(db.user.update).toHaveBeenCalled();
  });

  it("should return 400 for invalid email format", async () => {
    const req = makeRequest({
      email: "not-an-email",
      password: "securepassword123",
      name: "Test User",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 400 for password shorter than 8 characters", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "short",
      name: "Test User",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 400 for missing name", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "securepassword123",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 400 for empty name", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "securepassword123",
      name: "",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("should return 400 for password longer than 128 characters", async () => {
    const req = makeRequest({
      email: "test@example.com",
      password: "a".repeat(129),
      name: "Test User",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
