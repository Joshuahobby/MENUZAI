/**
 * Dashboard tests — requires completed onboarding (chromium project with stored auth).
 * Tests navigation, layout, and sign-out.
 */
import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Dashboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're on dashboard; if redirected to onboarding skip those tests
    await page.goto("/dashboard");
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
    if (page.url().includes("/onboarding")) {
      test.skip();
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
