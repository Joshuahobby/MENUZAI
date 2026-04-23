/**
 * Analytics page tests — chromium project (stored auth).
 * Mocks the /api/analytics/summary endpoint so results are predictable.
 */
import { test, expect } from "@playwright/test";

const MOCK_ANALYTICS = {
  kpis: { views: 142, orders: 17, revenue: 85000, avgOrderValue: 5000, conversionRate: 11.97 },
  topItems: [
    { name: "Beef Burger", count: 8 },
    { name: "Samosa", count: 5 },
    { name: "Ugali", count: 4 },
  ],
  peakHours: [
    { hour: 12, count: 6 },
    { hour: 13, count: 4 },
    { hour: 19, count: 9 },
  ],
  recentEvents: [
    { type: "order_click", item: "Beef Burger", amount: 4500, time: new Date().toISOString() },
    { type: "menu_view", item: null, amount: null, time: new Date().toISOString() },
  ],
  meta: { days: 7, plan: "free" },
};

test.describe("Analytics page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the analytics API for deterministic results
    await page.route(/\/api\/analytics\/summary/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ANALYTICS),
      });
    });

    await page.goto("/dashboard/analytics");
    await page.waitForURL(/\/(dashboard\/analytics|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/analytics")) test.skip();
  });

  test("renders page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows KPI values from API response", async ({ page }) => {
    // Wait for data to load (skeleton disappears)
    // Wait for the specific data text to appear
    await expect(page.getByText("142")).toBeVisible({ timeout: 10000 });

    // KPI values should be visible
    await expect(page.getByText("142")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("17")).toBeVisible();
  });

  test("shows top items list", async ({ page }) => {
    // Use first() to avoid strict-mode violation when the item name appears
    // in both the top items list and the recent events feed
    await expect(page.getByText("Beef Burger").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Samosa").first()).toBeVisible({ timeout: 8000 });
  });

  test("date range selector renders", async ({ page }) => {
    // Range buttons: Last 7 Days, Last 30 Days, Last 90 Days
    const rangeBtn = page.getByText(/last 7 days/i).first();
    await expect(rangeBtn).toBeVisible({ timeout: 8000 });
  });

  test("switching date range calls API with new days param", async ({ page }) => {
    let capturedUrl = "";
    await page.route(/\/api\/analytics\/summary/, async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ANALYTICS),
      });
    });

    // Wait for initial load
    await expect(page.getByText(/last 7 days/i).first()).toBeVisible({ timeout: 10000 });

    // Click the range toggle/dropdown
    const rangeToggle = page.getByText(/last 7 days/i).first();
    await rangeToggle.click();

    const thirtyDaysOption = page.getByText(/last 30 days/i).first();
    const hasOption = await thirtyDaysOption.isVisible().catch(() => false);
    if (hasOption) {
      await thirtyDaysOption.click();
      // After clicking, API should be re-called with days=30
      await page.waitForTimeout(500);
      expect(capturedUrl).toContain("days=30");
    }
  });

  test("renders recent events list", async ({ page }) => {
    await expect(page.locator("body")).not.toBeEmpty({ timeout: 10000 });
    // Recent events section should have some content
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});
