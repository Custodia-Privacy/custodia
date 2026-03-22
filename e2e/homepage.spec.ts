import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Custodia|Create Next App/i);
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
});

test.describe("Landing Page - Expected Features (post-build)", () => {
  test.skip("should display the hero section with value proposition", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/privacy compliance/i)).toBeVisible();
  });

  test.skip("should display the pricing section with 4 tiers", async ({ page }) => {
    await page.goto("/");
    const pricingSection = page.locator("[data-testid='pricing']");
    await expect(pricingSection).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Starter")).toBeVisible();
    await expect(page.getByText("Growth")).toBeVisible();
    await expect(page.getByText("Business")).toBeVisible();
  });

  test.skip("should display feature grid with 8 capabilities", async ({ page }) => {
    await page.goto("/");
    const features = page.locator("[data-testid='features'] > *");
    await expect(features).toHaveCount(8);
  });

  test.skip("should display the comparison table", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/CookieBot/i)).toBeVisible();
    await expect(page.getByText(/OneTrust/i)).toBeVisible();
  });

  test.skip("should have a free scan CTA with email capture", async ({ page }) => {
    await page.goto("/");
    const emailInput = page.locator("input[type='email']");
    await expect(emailInput).toBeVisible();
  });

  test.skip("should display FAQ section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Is this legally binding/i)).toBeVisible();
  });
});
