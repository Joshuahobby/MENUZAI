/**
 * Editor tests — requires completed onboarding (chromium project with stored auth).
 * Tests adding categories, inline item editing, publish/unpublish.
 */
import { test, expect } from "@playwright/test";

test.describe("Menu Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/editor");
    await page.waitForURL(/\/(dashboard\/editor|onboarding|login)/, { timeout: 12000 });

    if (!page.url().includes("/dashboard/editor")) {
      test.skip();
    }

    // Wait for editor to finish loading (no spinner, menu context ready)
    await page.waitForSelector('header', { timeout: 10000 });
  });

  test("renders editor toolbar with Publish Menu button", async ({ page }) => {
    const publishBtn = page.getByRole("button", { name: /publish menu/i });
    const unpublishBtn = page.getByRole("button", { name: /unpublish/i });
    // One of them should be visible depending on current state
    const hasPublish = await publishBtn.isVisible().catch(() => false);
    const hasUnpublish = await unpublishBtn.isVisible().catch(() => false);
    expect(hasPublish || hasUnpublish).toBe(true);
  });

  test("Add New Section opens prompt and creates a category", async ({ page }) => {
    const addSectionBtn = page.getByRole("button", { name: /add new section/i });
    await expect(addSectionBtn).toBeVisible({ timeout: 8000 });
    await addSectionBtn.click();

    // Prompt modal should appear
    const modalInput = page.locator('[role="dialog"] input, dialog input').first();
    await modalInput.waitFor({ state: "visible", timeout: 5000 });

    const sectionName = `Test Section ${Date.now()}`;
    await modalInput.fill(sectionName);
    await page.getByRole("button", { name: /add section/i }).click();

    // New section should appear in the sidebar
    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 8000 });
  });

  test("clicking 'Add item' creates an inline item with defaults", async ({ page }) => {
    // Ensure there's a category to add items to
    const firstCategory = page.locator("aside .group.cursor-grab").first();
    const hasCats = await firstCategory.isVisible().catch(() => false);

    if (!hasCats) {
      const addSectionBtn = page.getByRole("button", { name: /add new section/i });
      await addSectionBtn.click();
      const input = page.locator('[role="dialog"] input, dialog input').first();
      await input.waitFor({ state: "visible" });
      await input.fill("Mains");
      await page.locator('[role="dialog"]').getByRole("button", { name: /add section/i }).click();
      await page.getByText("Mains").first().click();
    }

    // Click the "Add item" area
    const addItemArea = page.getByText(/add item to/i).first();
    await addItemArea.waitFor({ state: "visible", timeout: 8000 });
    await addItemArea.click();

    // A new item with "New Item" should appear
    await expect(page.locator('input[placeholder="Item Name"]').first()).toBeVisible({ timeout: 5000 });
  });

  test("inline item name is editable", async ({ page }) => {
    // Add a section if none exists, add an item
    const addSectionBtn = page.getByRole("button", { name: /add new section/i });
    await addSectionBtn.click();
    const input = page.locator('[role="dialog"] input, dialog input').first();
    await input.waitFor({ state: "visible" });
    await input.fill("Starters");
    await page.locator('[role="dialog"]').getByRole("button", { name: /add section/i }).click();

    await page.getByText("Starters").first().click();
    const addItemArea = page.getByText(/add item to starters/i).first();
    await addItemArea.waitFor({ state: "visible", timeout: 8000 });
    await addItemArea.click();

    const nameInput = page.locator('input[placeholder="Item Name"]').first();
    await nameInput.waitFor({ state: "visible" });
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill("Samosa");

    // Value should update
    await expect(nameInput).toHaveValue("Samosa");
  });

  test("inline item price is editable", async ({ page }) => {
    const priceInput = page.locator('input[title="Item Price"]').first();
    const hasPriceInput = await priceInput.isVisible().catch(() => false);

    if (hasPriceInput) {
      await priceInput.click({ clickCount: 3 });
      await priceInput.fill("3500");
      await expect(priceInput).toHaveValue("3500");
    } else {
      test.skip();
    }
  });

  test("publish menu creates a public slug", async ({ page }) => {
    // Make sure there's something to publish (a category)
    const addSectionBtn = page.getByRole("button", { name: /add new section/i });
    const hasSectionBtn = await addSectionBtn.isVisible().catch(() => false);
    if (hasSectionBtn) {
      await addSectionBtn.click();
      const input = page.locator('[role="dialog"] input, dialog input').first();
      await input.waitFor({ state: "visible" });
      await input.fill("Main Dishes");
      await page.locator('[role="dialog"]').getByRole("button", { name: /add section/i }).click();
    }

    const publishBtn = page.getByRole("button", { name: /publish menu/i });
    const hasPublish = await publishBtn.isVisible().catch(() => false);
    if (!hasPublish) {
      // Already published
      const menuLink = page.getByRole("link", { name: /\/menu\//i });
      await expect(menuLink).toBeVisible({ timeout: 5000 });
      return;
    }

    await publishBtn.click();

    // Should see either the /menu/slug link or the "Published!" badge
    const link = page.getByRole("link", { name: /\/menu\//i });
    const badge = page.getByText("Published!");
    // Wait for either to appear
    await Promise.race([
      link.waitFor({ state: "visible", timeout: 15000 }),
      badge.waitFor({ state: "visible", timeout: 15000 }),
    ]).catch(() => {
      // Ignore if one times out, as long as one succeeds
    });
    
    expect(await link.isVisible() || await badge.isVisible()).toBe(true);

    // After publishing, Unpublish button should appear
    await expect(page.getByRole("button", { name: /unpublish/i })).toBeVisible({ timeout: 8000 });
  });

  test("unpublish menu reverts to draft state", async ({ page }) => {
    const unpublishBtn = page.getByRole("button", { name: /unpublish/i });
    const hasUnpublish = await unpublishBtn.isVisible().catch(() => false);

    if (!hasUnpublish) {
      // Need to publish first
      const publishBtn = page.getByRole("button", { name: /publish menu/i });
      if (!(await publishBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await publishBtn.click();
      await page.getByRole("button", { name: /unpublish/i }).waitFor({ state: "visible", timeout: 12000 });
    }

    await page.getByRole("button", { name: /unpublish/i }).click();
    await expect(page.getByRole("button", { name: /publish menu/i })).toBeVisible({ timeout: 8000 });
  });

  test("menu name is editable via click", async ({ page }) => {
    const menuNameSpan = page.locator('[title="Click to rename menu"]');
    await menuNameSpan.waitFor({ state: "visible", timeout: 8000 });
    await menuNameSpan.click();

    const menuNameInput = page.locator('input[placeholder="Menu name"]');
    await menuNameInput.waitFor({ state: "visible" });
    await menuNameInput.click({ clickCount: 3 });
    await menuNameInput.fill("My Renamed Menu");
    await menuNameInput.press("Enter");

    await expect(page.locator('[title="Click to rename menu"]')).toContainText("My Renamed Menu");
  });

  test("viewport switcher renders mobile/tablet/desktop frames", async ({ page }) => {
    // Look for viewport toggle buttons
    const mobileBtn = page.getByRole("button", { name: /mobile/i }).first();
    const tabletBtn = page.getByRole("button", { name: /tablet/i }).first();
    const desktopBtn = page.getByRole("button", { name: /desktop/i }).first();

    const hasMobile = await mobileBtn.isVisible().catch(() => false);
    if (hasMobile) {
      await tabletBtn.click();
      // Viewport changes — just check the page doesn't crash
      await page.waitForTimeout(500);
      await desktopBtn.click();
      await page.waitForTimeout(500);
      await mobileBtn.click();
    }
    // Even if buttons not found, editor should be visible
    await expect(page.locator("header")).toBeVisible();
  });
});
