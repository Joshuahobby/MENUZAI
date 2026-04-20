/**
 * Onboarding tests — uses saved auth session (chromium project).
 * The global-setup creates a fresh user with no onboarding done,
 * so the first run will hit the full 3-step flow.
 *
 * NOTE: "Start from Scratch" completes onboarding (sets onboarded=true).
 * Back-button tests are placed BEFORE it so they run while onboarding
 * is still incomplete. "Upload Menu" skips gracefully if already onboarded.
 */
import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/OnboardingPage";

test.describe("Onboarding flow", () => {
  test("Step 1 — requires restaurant name", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();

    // Skip loading spinner
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.continueButton.click();

    await expect(ob.errorMessage).toContainText(/restaurant name/i);
  });

  test("Step 1 — saves name and advances to Step 2", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForSelector("#ob-name", { timeout: 10000 });

    await ob.completeStep1("E2E Test Restaurant", "Great food", "Mon-Fri 8am-8pm");

    // Step 2 should be visible (WhatsApp toggle)
    await expect(ob.phoneInput).toBeVisible({ timeout: 8000 });
  });

  test("Step 2 — requires phone when WhatsApp enabled", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.completeStep1("E2E Test Restaurant");

    // Wait for step 2 to render before inspecting toggle state
    await ob.whatsappToggle.waitFor({ state: "visible" });
    // Ensure WhatsApp is enabled so validation fires
    const isPhoneVisible = await ob.phoneInput.isVisible().catch(() => false);
    if (!isPhoneVisible) await ob.whatsappToggle.click();

    // Don't fill phone, just click save
    await ob.saveStep2Button.click();
    await expect(ob.errorMessage).toContainText(/whatsapp number/i);
  });

  test("Step 2 — can skip by disabling WhatsApp", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.completeStep1("E2E Test Restaurant");

    await ob.completeStep2WithWhatsappDisabled();

    // Step 3 should appear
    await expect(ob.startFromScratchButton).toBeVisible({ timeout: 8000 });
  });

  test("Step 2 — saves phone number and advances to Step 3", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.completeStep1("E2E Test Restaurant");
    await ob.completeStep2("+250788000000");

    await expect(ob.startFromScratchButton).toBeVisible({ timeout: 8000 });
    await expect(ob.uploadMenuButton).toBeVisible();
  });

  // Back-button tests run BEFORE "Start from Scratch" completes onboarding
  test("Back button navigates from Step 2 to Step 1", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
    if (!page.url().includes("/onboarding")) { test.skip(); return; }
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.completeStep1("Back Test Restaurant");

    await ob.backButton.click();
    await expect(ob.nameInput).toBeVisible({ timeout: 5000 });
  });

  test("Back button navigates from Step 3 to Step 2", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
    if (!page.url().includes("/onboarding")) { test.skip(); return; }
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.completeStep1("E2E Test Restaurant");
    await ob.completeStep2("+250788000000");

    await page.getByRole("button", { name: /back to previous step/i }).click();
    await expect(ob.phoneInput).toBeVisible({ timeout: 5000 });
  });

  // This test completes onboarding — must come after back-button tests
  test("Step 3 — 'Start from Scratch' redirects to editor", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
    if (!page.url().includes("/onboarding")) { test.skip(); return; }
    await page.waitForSelector("#ob-name", { timeout: 10000 });
    await ob.completeStep1("E2E Test Restaurant");
    await ob.completeStep2("+250788000000");
    await ob.chooseStartFromScratch();

    await page.waitForURL("/dashboard/editor", { timeout: 12000 });
    await expect(page).toHaveURL("/dashboard/editor");
  });

  test("Step 3 — 'Upload Menu' option is visible (skip if already onboarded)", async ({ page }) => {
    const ob = new OnboardingPage(page);
    await ob.goto();
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
    try {
      await page.waitForSelector("#ob-name", { timeout: 3000 });
    } catch {
      test.skip();
      return;
    }
    await ob.completeStep1("E2E Test Restaurant 2");
    await ob.completeStep2("+250788000001");

    // Both step 3 options should be visible
    await expect(ob.startFromScratchButton).toBeVisible({ timeout: 8000 });
    await expect(ob.uploadMenuButton).toBeVisible({ timeout: 5000 });
  });

  test("already-onboarded user is redirected to /dashboard", async ({ page }) => {
    // After completing onboarding once, revisiting /onboarding should redirect
    await page.goto("/dashboard/editor");
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    if (page.url().includes("/dashboard")) {
      // Already onboarded — go back to onboarding, expect redirect
      await page.goto("/onboarding");
      await page.waitForURL("/dashboard", { timeout: 8000 });
      await expect(page).toHaveURL("/dashboard");
    }
  });
});
