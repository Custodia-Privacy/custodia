import { test, expect } from "@playwright/test";

test.describe("Free Scan Flow (Critical User Journey)", () => {
  test.skip("should allow user to enter URL and start a scan", async ({ page }) => {
    await page.goto("/");
    const urlInput = page.locator("input[placeholder*='url' i], input[name='url']");
    await urlInput.fill("https://example.com");
    const scanButton = page.getByRole("button", { name: /scan/i });
    await scanButton.click();
    // Should show scan progress
    await expect(page.getByText(/scanning/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip("should show scan results after completion", async ({ page }) => {
    await page.goto("/scan/results/test-id");
    await expect(page.getByText(/trackers found/i)).toBeVisible();
  });

  test.skip("should prompt email capture after showing results", async ({ page }) => {
    await page.goto("/scan/results/test-id");
    const emailInput = page.locator("input[type='email']");
    await expect(emailInput).toBeVisible();
  });
});

test.describe("Auth Flow", () => {
  test.skip("should display sign up page", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
  });

  test.skip("should display sign in page", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test.skip("should validate email format on signup", async ({ page }) => {
    await page.goto("/auth/signup");
    const emailInput = page.locator("input[type='email']");
    await emailInput.fill("not-an-email");
    const submitBtn = page.getByRole("button", { name: /sign up/i });
    await submitBtn.click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test.skip("should show error for empty password", async ({ page }) => {
    await page.goto("/auth/signup");
    const emailInput = page.locator("input[type='email']");
    await emailInput.fill("test@example.com");
    const submitBtn = page.getByRole("button", { name: /sign up/i });
    await submitBtn.click();
    await expect(page.getByText(/password/i)).toBeVisible();
  });
});

test.describe("Dashboard Flow", () => {
  test.skip("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/auth|login|signin/i);
  });

  test.skip("should display compliance dashboard when authenticated", async ({ page }) => {
    // Would need auth setup
    await page.goto("/dashboard");
    await expect(page.getByText(/compliance/i)).toBeVisible();
  });
});
