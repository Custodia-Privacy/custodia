import { describe, it, expect } from "vitest";
import { computeDsarDueDate } from "@/lib/dsar-deadlines";

describe("computeDsarDueDate", () => {
  const baseDate = new Date("2026-01-15T12:00:00Z");

  it("should return 30 days for GDPR jurisdiction", () => {
    const due = computeDsarDueDate("gdpr", baseDate);
    expect(due.toISOString().slice(0, 10)).toBe("2026-02-14");
  });

  it("should return 45 days for CCPA jurisdiction", () => {
    const due = computeDsarDueDate("ccpa", baseDate);
    expect(due.toISOString().slice(0, 10)).toBe("2026-03-01");
  });

  it("should return 15 days for LGPD jurisdiction", () => {
    const due = computeDsarDueDate("lgpd", baseDate);
    expect(due.toISOString().slice(0, 10)).toBe("2026-01-30");
  });

  it("should return 30 days for PIPEDA jurisdiction", () => {
    const due = computeDsarDueDate("pipeda", baseDate);
    expect(due.toISOString().slice(0, 10)).toBe("2026-02-14");
  });

  it("should default to 30 days for unknown jurisdiction", () => {
    const due = computeDsarDueDate("unknown_law", baseDate);
    expect(due.toISOString().slice(0, 10)).toBe("2026-02-14");
  });

  it("should be case-insensitive", () => {
    const due1 = computeDsarDueDate("GDPR", baseDate);
    const due2 = computeDsarDueDate("gdpr", baseDate);
    expect(due1.toISOString()).toBe(due2.toISOString());
  });

  it("should use current date when no fromDate provided", () => {
    const due = computeDsarDueDate("gdpr");
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    // Allow 1 second tolerance
    expect(Math.abs(due.getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it("should not mutate the input date", () => {
    const input = new Date("2026-01-15T12:00:00Z");
    const originalTime = input.getTime();
    computeDsarDueDate("gdpr", input);
    expect(input.getTime()).toBe(originalTime);
  });
});
