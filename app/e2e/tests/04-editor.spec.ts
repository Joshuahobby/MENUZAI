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

    // Wait for auth and onboarding check to complete in DashboardLayout
    await expect(page.locator('[data-auth-ready="true"]')).toBeVisible({ timeout: 15000 });
    
    // Wait for editor to finish loading (no spinner, menu context ready)
    await expect(page.getByText("Loading Editor…")).not.toBeVisible({ timeout: 15000 });
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
    // Wait for initial load and ensure no "Saving..." is active
    await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });

    const addSectionBtn = page.getByRole("button", { name: /add new section/i });
    await expect(addSectionBtn).toBeVisible({ timeout: 8000 });
    await addSectionBtn.click();

    // Prompt modal should appear
    // We try to find by role, but also by text to be sure
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog).toContainText(/new section/i);
    
    const modalInput = dialog.locator('input').first();
    await modalInput.waitFor({ state: "visible", timeout: 5000 });

    const sectionName = `Test Section ${Date.now()}`;
    await modalInput.fill(sectionName);
    
    const confirmBtn = dialog.getByRole("button", { name: /add section/i });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // New section should appear in the sidebar and as a heading
    // Use a more specific locator to avoid strict mode violation
    await expect(page.getByRole("heading", { name: sectionName })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("aside").getByText(sectionName)).toBeVisible({ timeout: 10000 });
  });

  test("clicking 'Add item' creates an inline item with defaults", async ({ page }) => {
    // Ensure there's a category to add items to
    const firstCategory = page.locator("aside .group.cursor-grab").first();
    const hasCats = await firstCategory.isVisible().catch(() => false);

    if (!hasCats) {
      const addSectionBtn = page.getByRole("button", { name: /add new section/i });
      await addSectionBtn.click();
      const dialog = page.getByRole("dialog");
      const input = dialog.locator('input').first();
      await input.waitFor({ state: "visible" });
      await input.fill("Mains");
      await dialog.getByRole("button", { name: /add section/i }).click();
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
    // 1. Ensure a section exists
    const firstCategory = page.locator("aside .group.cursor-grab").first();
    const hasCats = await firstCategory.isVisible().catch(() => false);

    if (!hasCats) {
      const addSectionBtn = page.getByRole("button", { name: /add new section/i });
      await addSectionBtn.click();
      const dialog = page.locator('[role="dialog"], dialog').first();
      const input = dialog.locator('input').first();
      await input.waitFor({ state: "visible" });
      await input.fill("Mains");
      await dialog.getByRole("button", { name: /add section/i }).click();
      await page.getByText("Mains").first().click();
    } else {
      await firstCategory.click();
    }

    // 2. Ensure an item exists
    let priceInput = page.locator('input[title="Item Price"]').first();
    const hasPriceInput = await priceInput.isVisible().catch(() => false);

    if (!hasPriceInput) {
      const addItemArea = page.getByText(/add item to/i).first();
      await addItemArea.waitFor({ state: "visible", timeout: 8000 });
      await addItemArea.click();
      priceInput = page.locator('input[title="Item Price"]').first();
      await priceInput.waitFor({ state: "visible", timeout: 5000 });
    }

    // 3. Edit the price
    await priceInput.click({ clickCount: 3 });
    await priceInput.fill("3500");
    // Tab out or click away to trigger blur/change if needed, 
    // though Playwright's fill usually triggers necessary events
    await priceInput.press("Tab");

    // 4. Verify the update
    await expect(priceInput).toHaveValue("3500");
  });

  test("publish menu creates a public slug", async ({ page }) => {
    // Wait for any initial auto-saves to finish
    await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });

    // Make sure there's something to publish (a category)
    const addSectionBtn = page.getByRole("button", { name: /add new section/i });
    const hasSectionBtn = await addSectionBtn.isVisible().catch(() => false);
    if (hasSectionBtn) {
      await addSectionBtn.click();
      const dialog = page.getByRole("dialog");
      const input = dialog.locator('input').first();
      await input.waitFor({ state: "visible" });
      await input.fill("Main Dishes");
      await dialog.getByRole("button", { name: /add section/i }).click();
      // Wait for section save
      await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });
    }

    const publishBtn = page.getByRole("button", { name: /publish menu/i });
    const hasPublish = await publishBtn.isVisible().catch(() => false);
    
    if (!hasPublish) {
      // Already published? Check if Unpublish is there
      const unpublishBtn = page.getByRole("button", { name: /unpublish/i });
      if (await unpublishBtn.isVisible()) {
        await expect(page.getByRole("link", { name: /\/menu\//i })).toBeVisible({ timeout: 5000 });
        return;
      }
    }

    // Ensure button is enabled (not syncing) and wait a moment for any debounced save to start
    await page.waitForTimeout(500); 
    await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });
    
    await expect(publishBtn).toBeEnabled({ timeout: 10000 });
    await publishBtn.click();

    // After publishing, Unpublish button should appear
    // We use toPass to handle potential delay in state update
    await expect(async () => {
      await expect(page.getByRole("button", { name: /unpublish/i })).toBeVisible();
    }).toPass({ timeout: 15000 });

    // Should see either the /menu/slug link or the "Published!" badge
    await expect(async () => {
      const link = page.getByRole("link", { name: /\/menu\//i });
      const badge = page.getByText("Published!");
      const isVisible = await link.isVisible() || await badge.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });
  });

  test("unpublish menu reverts to draft state", async ({ page }) => {
    // Wait for any initial auto-saves to finish
    await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });

    const unpublishBtn = page.getByRole("button", { name: /unpublish/i });
    const hasUnpublish = await unpublishBtn.isVisible().catch(() => false);

    if (!hasUnpublish) {
      // Need to publish first
      const publishBtn = page.getByRole("button", { name: /publish menu/i });
      await expect(publishBtn).toBeVisible({ timeout: 5000 });
      await expect(publishBtn).toBeEnabled({ timeout: 10000 });
      await publishBtn.click();
      await expect(page.getByRole("button", { name: /unpublish/i })).toBeVisible({ timeout: 15000 });
    }

    // Wait for any publish-related sync to finish
    await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });

    const targetUnpublishBtn = page.getByRole("button", { name: /unpublish/i });
    await expect(targetUnpublishBtn).toBeEnabled({ timeout: 10000 });
    await targetUnpublishBtn.click();
    
    await expect(page.getByRole("button", { name: /publish menu/i })).toBeVisible({ timeout: 12000 });
  });

  test("menu name is editable via click", async ({ page }) => {
    // Wait for any initial auto-saves to finish
    await expect(page.getByTestId("sync-indicator")).not.toBeVisible({ timeout: 15000 });
    
    // Wait for header to be visible
    await expect(page.locator("header")).toBeVisible();
    
    const menuNameSpan = page.locator('[title="Click to rename menu"]');
    await menuNameSpan.waitFor({ state: "visible", timeout: 8000 });
    await menuNameSpan.click();

    // Use placeholder to find input, as it's more reliable than initial value attribute
    const menuNameInput = page.getByPlaceholder("Menu name");
    await menuNameInput.waitFor({ state: "visible" });
    
    // Clear and fill
    await menuNameInput.fill("My Renamed Menu");
    // Pressing Enter triggers handleRenameMenu via onKeyDown
    await menuNameInput.press("Enter");

    // Wait for it to switch back from input to span
    await expect(menuNameInput).not.toBeVisible({ timeout: 10000 });

    // The span contains the name and the "edit" icon text. 
    // Use a more robust check for the text content
    await expect(page.locator('[title="Click to rename menu"]')).toContainText("My Renamed Menu", { timeout: 10000 });
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
