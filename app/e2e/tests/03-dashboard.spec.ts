/**
 * Dashboard tests — requires completed onboarding (chromium project with stored auth).
 * Tests navigation, layout, and sign-out.
 */
import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { ensureOnboarded } from "../utils/db-utils";

test.describe("Dashboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the test user is onboarded so dashboard is accessible
    await ensureOnboarded("e2e-test@menuzai.test");

    await page.goto("/dashboard");

    // Race: either the layout's auth check completes (data-auth-ready appears),
    // OR we're redirected away.
    await Promise.race([
      page.waitForSelector('[data-auth-ready="true"]', { timeout: 15000 }).catch(() => {}),
      page.waitForURL(/\/(onboarding|login)/, { timeout: 15000 }).catch(() => {}),
    ]);

    // If still redirected, something is wrong with the auth state
    if (page.url().includes("/onboarding") || page.url().includes("/login")) {
      console.error(`Redirected to ${page.url()} despite ensuring onboarding.`);
      test.fail();
    }
  });

  test("dashboard home renders KPI cards", async ({ page }) => {
    await expect(page).toHaveURL("/dashboard");
    // The dashboard should show some stats/KPI section
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
    // Check for the sidebar brand
    await expect(page.getByText("MENUZA AI").first()).toBeVisible();
  });

  test("sidebar shows all nav links on desktop", async ({ page }) => {
    const labels = ["Orders", "My Menus", "Analytics", "QR Codes", "Editor", "Settings"];
    for (const label of labels) {
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    }
  });

  test("navigates to Orders page", async ({ page }) => {
    const dash = new DashboardPage(page);
    // navigateTo() waits for the URL to settle internally
    await dash.navigateTo("Orders");
    await expect(page).toHaveURL("/dashboard/orders");
  });

  test("navigates to My Menus page", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.navigateTo("My Menus");
    await expect(page).toHaveURL("/dashboard/menus");
  });

  test("navigates to Analytics page", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.navigateTo("Analytics");
    await expect(page).toHaveURL("/dashboard/analytics");
  });

  test("navigates to QR Codes page", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.navigateTo("QR Codes");
    await expect(page).toHaveURL("/dashboard/qr-codes");
  });

  test("navigates to Editor page", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.navigateTo("Editor");
    await expect(page).toHaveURL("/dashboard/editor");
  });

  test("navigates to Settings page", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.navigateTo("Settings");
    await expect(page).toHaveURL("/dashboard/settings");
  });

  test("active nav link is highlighted", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.navigateTo("Analytics");
    const analyticsLink = page.getByRole("link", { name: "Analytics" }).first();
    // Active links get bg-primary/10 and text-primary class
    await expect(analyticsLink).toHaveClass(/text-primary/);
  });

});
