import { describe, it, expect, vi } from "vitest";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("RootLayout", () => {
  it("exports metadata with title and description", async () => {
    const layoutModule = await import("@/app/layout");
    expect(layoutModule.metadata).toBeDefined();
    expect(layoutModule.metadata.title).toBeDefined();
    expect(layoutModule.metadata.description).toBeDefined();
  });

  it("exports a default function (RootLayout)", async () => {
    const layoutModule = await import("@/app/layout");
    expect(typeof layoutModule.default).toBe("function");
  });
});
