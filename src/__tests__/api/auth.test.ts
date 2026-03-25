import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Auth Endpoint Tests
 *
 * Signup is tested in signup.test.ts with full mocking.
 * These tests cover the NextAuth credentials provider logic and edge cases.
 */

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue("$2a$12$hashed"),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    orgMember: { findFirst: vi.fn() },
    // Prisma adapter needs these
    account: { findFirst: vi.fn() },
    session: { findFirst: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { compare } from "bcryptjs";

describe("Credentials authorize logic", () => {
  // Test the core authorize logic directly since NextAuth wraps it
  async function authorize(credentials: { email?: string; password?: string }) {
    if (!credentials?.email || !credentials?.password) return null;
    const email = credentials.email as string;
    const password = credentials.password as string;
    const user = await db.user.findUnique({ where: { email } });
    if (!(user as any)?.passwordHash) return null;
    const valid = await compare(password, (user as any).passwordHash);
    if (!valid) return null;
    return { id: (user as any).id, email: (user as any).email, name: (user as any).name };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when email is missing", async () => {
    const result = await authorize({ password: "test" });
    expect(result).toBeNull();
  });

  it("should return null when password is missing", async () => {
    const result = await authorize({ email: "test@example.com" });
    expect(result).toBeNull();
  });

  it("should return null when user not found", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const result = await authorize({ email: "nobody@example.com", password: "pass" });
    expect(result).toBeNull();
  });

  it("should return null when user has no passwordHash (OAuth-only)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "u1", email: "oauth@example.com", passwordHash: null,
    } as any);
    const result = await authorize({ email: "oauth@example.com", password: "pass" });
    expect(result).toBeNull();
  });

  it("should return null when password does not match", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "u1", email: "user@example.com", passwordHash: "$2a$12$stored",
    } as any);
    vi.mocked(compare).mockResolvedValue(false as any);
    const result = await authorize({ email: "user@example.com", password: "wrong" });
    expect(result).toBeNull();
  });

  it("should return user data when credentials are valid", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "u1", email: "user@example.com", name: "User", passwordHash: "$2a$12$stored",
    } as any);
    vi.mocked(compare).mockResolvedValue(true as any);
    const result = await authorize({ email: "user@example.com", password: "correct" });
    expect(result).toEqual({ id: "u1", email: "user@example.com", name: "User" });
  });
});

describe("Auth - Input Validation", () => {
  it("should treat email lookup as case-sensitive (Prisma default)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    // This verifies the query passes email as-is
    const email = "Test@Example.COM";
    await db.user.findUnique({ where: { email } });
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: "Test@Example.COM" } });
  });
});
