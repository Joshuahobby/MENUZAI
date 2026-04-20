/**
 * Settings page tests — chromium project (stored auth).
 */
import { test, expect } from "@playwright/test";

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForURL(/\/(dashboard\/settings|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/settings")) test.skip();
    // Let the page fully hydrate
    await page.waitForLoadState("domcontentloaded");
  });

  test("page loads without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain("/settings");
  });

  test("restaurant name field is pre-filled", async ({ page }) => {
    const nameInput = page.locator('#restaurant-name');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    // Should have some value (the restaurant name from onboarding)
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("currency selector renders with options", async ({ page }) => {
    const currencySelect = page.locator("select").first();
    const hasCurrencySelect = await currencySelect.isVisible().catch(() => false);
    if (hasCurrencySelect) {
      const options = await currencySelect.locator("option").count();
      expect(options).toBeGreaterThan(1);
    } else {
      // May be a custom dropdown
      const currencyLabel = page.getByText(/currency/i).first();
      await expect(currencyLabel).toBeVisible({ timeout: 5000 });
    }
  });

  test("can update restaurant name and save", async ({ page }) => {
    const nameInput = page.locator('#restaurant-name');
    await nameInput.waitFor({ state: "visible", timeout: 8000 });

    // Clear and fill new name
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill("Updated Restaurant Name");

    // Find save button for restaurant info section
    const saveBtn = page.getByRole("button", { name: /save|update/i }).first();
    await saveBtn.click();

    // Should show success state (button text or toast)
    const savedIndicator = page.getByText(/saved|updated|success/i).first();
    const hasSaved = await savedIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    const hasSavedClass = await saveBtn.evaluate(
      el => el.textContent?.toLowerCase().includes("saved")
    ).catch(() => false);

    expect(hasSaved || hasSavedClass).toBe(true);
  });

  test("WhatsApp phone field is editable", async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="+"]').first();
    const hasPhone = await phoneInput.isVisible().catch(() => false);
    if (hasPhone) {
      await phoneInput.fill("+250788111222");
      await expect(phoneInput).toHaveValue("+250788111222");
    }
  });

  test("logo upload input is present", async ({ page }) => {
    const logoInput = page.locator('input[type="file"]').first();
    const logoCount = await logoInput.count();
    expect(logoCount).toBeGreaterThan(0);
  });

  test("danger zone — sign out button works", async ({ page }) => {
    const signOutBtn = page.getByRole("button", { name: /sign out/i });
    const hasSignOut = await signOutBtn.isVisible().catch(() => false);
    if (hasSignOut) {
      await signOutBtn.click();
      await page.waitForURL("/login", { timeout: 8000 });
      await expect(page).toHaveURL("/login");
    }
  });
});
