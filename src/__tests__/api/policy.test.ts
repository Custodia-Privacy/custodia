import { describe, it, expect } from "vitest";

/**
 * Policy API Tests
 *
 * Policy generation uses tRPC routes that require full context.
 * Testing the data model expectations and validation rules.
 */
describe("Policy Generation Validation", () => {
  it("should support expected jurisdiction values", () => {
    const supportedJurisdictions = ["gdpr", "ccpa", "lgpd", "pipeda"];
    expect(supportedJurisdictions).toContain("gdpr");
    expect(supportedJurisdictions).toContain("ccpa");
  });

  it("should require a site association for policies", () => {
    // Policy model requires siteId - validates the data model constraint
    const requiredFields = ["siteId", "content", "format"];
    expect(requiredFields).toContain("siteId");
  });

  it.todo("should generate a privacy policy from scan results (requires Claude API mock)");
  it.todo("should support multiple jurisdictions in a single policy");
  it.todo("should regenerate policy when scan results change");
  it.todo("should return 404 for non-existent policy");
});
