import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("should display login page with email input", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator("input[type='email']");
    await expect(emailInput).toBeVisible();
    // Should have login heading
    await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
  });

  test("should display signup page", async ({ page }) => {
    await page.goto("/signup");
    // Signup page should have an email input or heading
    const content = page.locator("input[type='email'], h1");
    await expect(content.first()).toBeVisible();
  });

  test("should redirect dashboard to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL(/login/i, { timeout: 5000 });
    expect(page.url()).toMatch(/login/i);
  });

  test("should redirect protected routes to login", async ({ page }) => {
    const protectedPaths = ["/sites", "/dsars", "/assessments", "/settings"];
    for (const path of protectedPaths) {
      await page.goto(path);
      await page.waitForURL(/login/i, { timeout: 5000 });
      expect(page.url()).toMatch(/login/i);
    }
  });
});

test.describe("Health Check API", () => {
  test("should return health status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("custodia");
    expect(body.database).toBe("up");
    expect(body.timestamp).toBeDefined();
  });
});

test.describe("Public DSAR API", () => {
  test("should return 400 for empty POST body", async ({ request }) => {
    const response = await request.post("/api/public/dsar", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("should return 400 for invalid JSON", async ({ request }) => {
    const response = await request.post("/api/public/dsar", {
      headers: { "Content-Type": "application/json" },
      data: "not json",
    });
    // Should return 400 for bad request
    expect([400, 415]).toContain(response.status());
  });

  test("should return 404 for non-existent site", async ({ request }) => {
    const response = await request.post("/api/public/dsar", {
      data: {
        siteId: "550e8400-e29b-41d4-a716-446655440000",
        requestType: "access",
        jurisdiction: "gdpr",
        requesterName: "Test User",
        requesterEmail: "test@example.com",
      },
    });
    // Should be 404 (site not found) or 400 (validation)
    expect([400, 404]).toContain(response.status());
  });
});

test.describe("Consent API", () => {
  test("should return CORS headers on OPTIONS", async ({ request }) => {
    const response = await request.fetch("/api/banner/test-site/consent", {
      method: "OPTIONS",
    });
    expect(response.headers()["access-control-allow-origin"]).toBe("*");
  });

  test("should return 400 for missing fields on POST", async ({ request }) => {
    const response = await request.post("/api/banner/test-site/consent", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Public DSAR Form Page", () => {
  test.skip("should render the embedded DSAR form", async ({ page }) => {
    // This requires a valid siteId - skip unless test site exists
    await page.goto("/embed/dsar/test-site");
    await expect(page.locator("form, main")).toBeVisible();
  });
});
