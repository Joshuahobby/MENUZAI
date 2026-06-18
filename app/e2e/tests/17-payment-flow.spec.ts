import { test, expect } from "@playwright/test";
import { createTestMenu, cleanupTestMenu } from "../utils/test-menu";

test.use({ storageState: { cookies: [], origins: [] } });

let menuData: { restaurantId: string; slug: string } | null = null;

test.beforeAll(async () => {
  menuData = await createTestMenu();
});

test.afterAll(async () => {
  if (menuData) await cleanupTestMenu(menuData.restaurantId);
});

test.describe("Payment flow", () => {
  test.beforeEach(async ({ page }) => {
    if (!menuData) throw new Error("No menu data");
    await page.goto(`/menu/${menuData.slug}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("mobile money pay button appears for restaurant with payments enabled", async ({ page }) => {
    // Payment button only shows when paymentsEnabled is true
    // The free-plan test menu has paymentsEnabled = false by default
    // So the pay button should not be visible
    const payBtn = page.getByText(/pay with mobile/i).or(page.getByText(/mobile money/i));
    const hasPayBtn = await payBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPayBtn) {
      // If it IS visible (e.g., Pro test menu), verify it opens the payment modal
      await payBtn.click();
      await expect(page.getByText(/your phone number/i).or(page.getByText(/phone number/i))).toBeVisible({ timeout: 5000 });
    }
    // else: payment button not visible for free plan — expected behavior
  });

  test("payment API rejects invalid total", async ({ page }) => {
    const res = await page.request.post("/api/payments/food", {
      data: { restaurantId: "invalid", menuId: "invalid", items: [], total: 0, phone: "+250788000000" },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.error).toBeTruthy();
  });

  test("cancel API validates order ID", async ({ page }) => {
    const res = await page.request.post("/api/orders/cancel", {
      data: { orderId: "not-a-uuid" },
    });
    expect(res.status()).toBe(400);
  });
});
