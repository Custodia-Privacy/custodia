import { describe, it, expect } from "vitest";
import { parseSetCookie, isSameSite } from "@/lib/quick-scanner";

describe("parseSetCookie", () => {
  it("parses a typical tracking cookie with all attributes", () => {
    const parsed = parseSetCookie(
      "_fbp=fb.1.1712345678.987; Domain=.facebook.com; Path=/; Secure; HttpOnly; SameSite=None",
    );
    expect(parsed).toEqual({
      name: "_fbp",
      value: "fb.1.1712345678.987",
      domain: "facebook.com",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "None",
    });
  });

  it("strips a leading dot from the domain", () => {
    const parsed = parseSetCookie("foo=bar; Domain=.example.com");
    expect(parsed?.domain).toBe("example.com");
  });

  it("lower-cases the domain", () => {
    const parsed = parseSetCookie("foo=bar; Domain=DailyMail.Co.UK");
    expect(parsed?.domain).toBe("dailymail.co.uk");
  });

  it("returns null for a cookie with no =", () => {
    expect(parseSetCookie("malformed")).toBeNull();
  });

  it("returns null for an empty header", () => {
    expect(parseSetCookie("")).toBeNull();
  });

  it("returns null when the name is empty", () => {
    // "=value" has no name — reject rather than persist a nameless cookie.
    expect(parseSetCookie("=value")).toBeNull();
  });

  it("handles a cookie with no attributes at all", () => {
    const parsed = parseSetCookie("session=abc123");
    expect(parsed).toEqual({
      name: "session",
      value: "abc123",
      domain: null,
      path: null,
      secure: false,
      httpOnly: false,
      sameSite: null,
    });
  });

  it("recognises case-insensitive flags", () => {
    const parsed = parseSetCookie("x=1; SECURE; HttpOnly; samesite=Lax");
    expect(parsed?.secure).toBe(true);
    expect(parsed?.httpOnly).toBe(true);
    expect(parsed?.sameSite).toBe("Lax");
  });

  it("preserves the value verbatim (including = signs inside it)", () => {
    // Cookie values legitimately contain =, e.g. base64 padding and
    // nested key=value pairs like OptanonConsent.
    const parsed = parseSetCookie(
      "OptanonConsent=isGpcEnabled=0&datestamp=Wed+Apr+22; Domain=.example.com",
    );
    expect(parsed?.name).toBe("OptanonConsent");
    expect(parsed?.value).toBe("isGpcEnabled=0&datestamp=Wed+Apr+22");
  });
});

describe("isSameSite", () => {
  it("matches exact domain", () => {
    expect(isSameSite("example.com", "example.com")).toBe(true);
  });

  it("matches subdomain of the scanned site", () => {
    expect(isSameSite("cdn.example.com", "example.com")).toBe(true);
  });

  it("matches when the scanned site is a subdomain of the cookie domain", () => {
    // .example.com cookies apply to scanned www.example.com.
    expect(isSameSite("example.com", "www.example.com")).toBe(true);
  });

  it("treats unrelated domains as third-party", () => {
    expect(isSameSite("facebook.com", "example.com")).toBe(false);
    expect(isSameSite("doubleclick.net", "example.com")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isSameSite("Example.COM", "example.com")).toBe(true);
  });

  it("does not match partial suffixes that aren't on a dot boundary", () => {
    // "notexample.com" must not be considered same-site as "example.com".
    expect(isSameSite("notexample.com", "example.com")).toBe(false);
  });
});
