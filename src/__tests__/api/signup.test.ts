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
  },
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2a$12$hashed"),
}));

vi.mock("@/lib/utils", () => ({
  slugify: vi.fn((s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
}));

import { POST } from "@/app/api/auth/signup/route";
import { db } from "@/lib/db";

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

  it("should return 409 for duplicate email with existing password", async () => {
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

    expect(response.status).toBe(409);
    expect(body.error).toContain("already exists");
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
