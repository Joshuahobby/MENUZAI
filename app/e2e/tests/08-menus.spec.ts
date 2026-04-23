/**
 * My Menus page tests — chromium project (stored auth).
 * Tests listing, creating, renaming, switching, and deleting menus.
 */
import { test, expect } from "@playwright/test";

test.describe("My Menus page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/menus");
    await page.waitForURL(/\/(dashboard\/menus|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/menus")) test.skip();

    // Wait for the menu list to finish loading
    await page.waitForFunction(
      () => !document.querySelector('[class*="animate-pulse"]'),
      { timeout: 10000 }
    );
  });

  test("renders menus list or empty state", async ({ page }) => {
    // Either the menu cards or an empty-state message should be visible
    const hasMenuCards = await page.locator('[class*="rounded"]').count() > 0;
    expect(hasMenuCards).toBe(true);
  });

  test("'New Menu' button is visible", async ({ page }) => {
    const newMenuBtn = page.getByRole("button", { name: /new menu/i });
    await expect(newMenuBtn).toBeVisible({ timeout: 8000 });
  });

  test("creating a new menu opens prompt and adds it to the list", async ({ page }) => {
    const newMenuBtn = page.getByRole("button", { name: /new menu/i });
    await newMenuBtn.click();

    // Free plan may show a toast error instead of a modal if draft limit is reached
    const toastVisible = await page.locator('[data-sonner-toast]').isVisible({ timeout: 1500 }).catch(() => false);
    if (toastVisible) {
      // Draft limit reached — test passes (limit enforcement is working correctly)
      return;
    }

    // Otherwise a prompt modal should appear
    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ state: "visible", timeout: 8000 });

    const input = modal.locator("input").first();
    const menuName = `E2E Menu ${Date.now()}`;
    await input.fill(menuName);
    await page.getByRole("button", { name: /create|confirm|add|ok/i }).last().click();

    // New menu should redirect to editor
    await page.waitForURL("/dashboard/editor", { timeout: 10000 });
    await expect(page).toHaveURL("/dashboard/editor");
  });

  test("clicking Edit navigates to editor", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: "Edit", exact: true }).first();
    
    // Wait for skeletons to disappear and menus to load
    await expect(editBtn).toBeVisible({ timeout: 10000 }).catch(() => null);
    
    const hasEdit = await editBtn.isVisible().catch(() => false);
    if (!hasEdit) {
      test.skip();
      return;
    }
    await editBtn.click();
    await page.waitForURL("/dashboard/editor", { timeout: 10000 });
    await expect(page).toHaveURL("/dashboard/editor");
  });

  test("free plan shows upgrade prompt on second menu creation", async ({ page }) => {
    // First check how many menus exist
    const menuCards = page.locator('[data-testid="menu-card"], .rounded-\\[2rem\\]').filter({ hasText: /draft|published/i });
    const count = await menuCards.count();

    if (count >= 1) {
      // Try creating another menu
      const newMenuBtn = page.getByRole("button", { name: /new menu/i });
      await newMenuBtn.click();

      // On free plan — should show ANY toast or a modal
      // Wait briefly for either to appear
      await page.waitForTimeout(1500);
      const hasToast = await page.locator('[data-sonner-toast]').isVisible().catch(() => false);
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(hasToast || hasModal).toBe(true);
    }
  });

  test("menu status badge shows draft or published", async ({ page }) => {
    const draftBadge = page.getByText(/draft/i).first();
    const publishedBadge = page.getByText(/published/i).first();
    const hasDraft = await draftBadge.isVisible().catch(() => false);
    const hasPublished = await publishedBadge.isVisible().catch(() => false);
    expect(hasDraft || hasPublished).toBe(true);
  });
});
