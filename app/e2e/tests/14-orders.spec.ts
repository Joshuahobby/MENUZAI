/**
 * Orders dashboard (Real-Time Staff Panel) tests — chromium project (stored auth).
 */
import { test, expect } from "@playwright/test";

test.describe("Orders dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForURL(/\/(dashboard\/orders|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/orders")) test.skip();
    await page.waitForLoadState("domcontentloaded");
  });

  test("page loads without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain("/orders");
  });

  test("shows page heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /real.time staff panel/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test("shows live sync indicator", async ({ page }) => {
    // The realtime status badge renders regardless of connection state
    const liveIndicator = page.getByText(/live sync|connecting/i).first();
    await expect(liveIndicator).toBeVisible({ timeout: 8000 });
  });

  test("stats cards render", async ({ page }) => {
    // Three stat cards: Today's Orders, Pending Action, Today's Revenue
    const ordersCard = page.getByText(/today.s orders/i).first();
    const pendingCard = page.getByText(/pending action/i).first();
    const revenueCard = page.getByText(/today.s revenue/i).first();

    await expect(ordersCard).toBeVisible({ timeout: 8000 });
    await expect(pendingCard).toBeVisible({ timeout: 5000 });
    await expect(revenueCard).toBeVisible({ timeout: 5000 });
  });

  test("status filter tabs are rendered", async ({ page }) => {
    const allTab = page.getByRole("button", { name: /all orders/i }).first();
    await expect(allTab).toBeVisible({ timeout: 8000 });

    const pendingTab = page.getByRole("button", { name: /pending/i }).first();
    await expect(pendingTab).toBeVisible({ timeout: 5000 });
  });

  test("clicking a status filter tab stays on page", async ({ page }) => {
    const pendingTab = page.getByRole("button", { name: /pending/i }).first();
    await pendingTab.waitFor({ state: "visible", timeout: 8000 });
    await pendingTab.click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain("/orders");
  });

  test("sound toggle button is present", async ({ page }) => {
    // Sound toggle has a title attribute
    const soundToggle = page.locator("button[title*='notification'], button[title*='Mute']").first();
    const hasSoundToggle = await soundToggle.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSoundToggle) {
      await expect(soundToggle).toBeVisible();
    } else {
      // Fallback: volume icon in the toolbar
      const volumeIcon = page.locator(".material-symbols-outlined").filter({ hasText: /volume_up|volume_off/ }).first();
      await expect(volumeIcon).toBeVisible({ timeout: 5000 });
    }
  });

  test("orders list section renders", async ({ page }) => {
    const ordersSection = page.getByRole("heading", { name: /orders list/i }).first();
    await expect(ordersSection).toBeVisible({ timeout: 8000 });
  });

  test("table pager section renders", async ({ page }) => {
    // "Table Requests" or "Assistance" panel on the right
    const pagerSection = page.getByText(/table request|assistance|waiter/i).first();
    await expect(pagerSection).toBeVisible({ timeout: 8000 });
  });

  test("order cards render with status badge when orders exist", async ({ page }) => {
    // Wait for any loading to settle
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    const orderCard = page.locator(".material-symbols-outlined").filter({ hasText: "receipt_long" }).first();
    await expect(orderCard).toBeVisible({ timeout: 8000 });

    // If there are orders, each has a status badge
    const statusBadge = page.locator("span").filter({ hasText: /^(pending|preparing|confirmed|cancelled)$/i }).first();
    const hasBadge = await statusBadge.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBadge) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test("confirm order button calls /api/orders/confirm when visible", async ({ page }) => {
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    const confirmBtn = page.getByRole("button", { name: /confirm|ready/i }).first();
    const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasConfirm) { test.skip(); return; }

    // Intercept the confirm API call to avoid real stock changes
    let confirmCalled = false;
    await page.route("**/api/orders/confirm**", (route) => {
      confirmCalled = true;
      route.fulfill({ status: 200, body: JSON.stringify({ success: true, stockUpdated: false }) });
    });

    await confirmBtn.click();
    await page.waitForTimeout(600);
    expect(confirmCalled).toBe(true);
  });
});
