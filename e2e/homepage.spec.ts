import { test, expect } from "@playwright/test";

test.describe("Homepage / Landing Page", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Custodia/i);
  });

  test("should render the main content area", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have a heading visible", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should display hero section with privacy compliance messaging", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/privacy/i).first()).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");
    // Should have at least one navigation area
    const nav = page.locator("nav, header").first();
    await expect(nav).toBeVisible();
  });
});

test.describe("Pricing Page", () => {
  test("should load the pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should display pricing tiers", async ({ page }) => {
    await page.goto("/pricing");
    // Check for tier names in the page
    const content = await page.textContent("body");
    expect(content).toMatch(/free|starter|growth|business/i);
  });
});
