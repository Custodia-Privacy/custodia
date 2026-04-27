import { test, expect } from "@playwright/test";

test.describe("Inventory (authenticated)", () => {
  test("inventory route is protected or loads when logged in", async ({ page }) => {
    await page.goto("/inventory");
    const url = page.url();
    const isLogin = url.includes("/login");
    const isInventory = url.includes("/inventory");
    expect(isLogin || isInventory).toBeTruthy();
    if (isInventory) {
      await expect(page.getByRole("heading", { name: /Data Inventory/i })).toBeVisible();
    }
  });
});
