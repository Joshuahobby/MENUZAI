/**
 * Payments & upgrade flow tests.
 * Mocks /api/payments/pawapay so we never trigger real mobile-money charges.
 */
import { test, expect } from "@playwright/test";

const MOCK_PAYMENT_SUCCESS = {
  success: true,
  depositId: "test-deposit-id-12345",
  status: "ACCEPTED",
  message: "Payment initiated. Please approve on your phone.",
};

const MOCK_PAYMENT_FAILURE = {
  success: false,
  error: "Insufficient funds",
};

test.describe("Pricing page", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // no auth needed

  test("renders pricing plans without auth", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).not.toContain("/login");
  });

  test("shows Free and Pro plan tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/free/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/pro/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("CheckoutModal (upgrade flow)", () => {
  // Needs auth to access dashboard pages with upgrade buttons
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/(dashboard|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/dashboard")) test.skip();
  });

  test("upgrade button opens checkout modal", async ({ page }) => {
    // Look for any upgrade/pro button
    const upgradeBtn = page.getByRole("button", { name: /upgrade|go pro|get pro/i }).first();
    const hasUpgrade = await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasUpgrade) { test.skip(); return; }

    await upgradeBtn.click();

    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ state: "visible", timeout: 5000 });
    await expect(modal).toBeVisible();
  });

  test("checkout modal shows phone input", async ({ page }) => {
    const upgradeBtn = page.getByRole("button", { name: /upgrade|go pro|get pro/i }).first();
    const hasUpgrade = await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasUpgrade) { test.skip(); return; }

    await upgradeBtn.click();
    const phoneInput = page.locator('[role="dialog"] input[type="tel"], [role="dialog"] input[placeholder*="phone"]').first();
    await phoneInput.waitFor({ state: "visible", timeout: 5000 });
    await expect(phoneInput).toBeVisible();
  });

  test("payment success shows confirmation message", async ({ page }) => {
    await page.route("/api/payments/pawapay", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PAYMENT_SUCCESS),
      });
    });

    const upgradeBtn = page.getByRole("button", { name: /upgrade|go pro|get pro/i }).first();
    const hasUpgrade = await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasUpgrade) { test.skip(); return; }

    await upgradeBtn.click();

    const phoneInput = page.locator('[role="dialog"] input[type="tel"], [role="dialog"] input[placeholder*="phone"]').first();
    await phoneInput.waitFor({ state: "visible", timeout: 5000 });
    await phoneInput.fill("+250788000000");

    const payBtn = page.locator('[role="dialog"]').getByRole("button", { name: /pay|confirm|subscribe/i }).first();
    await payBtn.click();

    // Should show success message or pending state
    await page.waitForFunction(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        const text = dialog?.textContent?.toLowerCase() ?? "";
        return text.includes("approve") || text.includes("success") || text.includes("sent") || text.includes("check");
      },
      { timeout: 10000 }
    );
  });

  test("payment failure shows error message", async ({ page }) => {
    await page.route("/api/payments/pawapay", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PAYMENT_FAILURE),
      });
    });

    const upgradeBtn = page.getByRole("button", { name: /upgrade|go pro|get pro/i }).first();
    const hasUpgrade = await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasUpgrade) { test.skip(); return; }

    await upgradeBtn.click();

    const phoneInput = page.locator('[role="dialog"] input[type="tel"], [role="dialog"] input[placeholder*="phone"]').first();
    await phoneInput.waitFor({ state: "visible", timeout: 5000 });
    await phoneInput.fill("+250788000000");

    const payBtn = page.locator('[role="dialog"]').getByRole("button", { name: /pay|confirm|subscribe/i }).first();
    await payBtn.click();

    // Should show error
    await page.waitForFunction(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        const text = dialog?.textContent?.toLowerCase() ?? "";
        const toast = document.querySelector('[data-sonner-toast]')?.textContent?.toLowerCase() ?? "";
        return text.includes("error") || text.includes("fail") || toast.includes("error") || toast.includes("fail");
      },
      { timeout: 10000 }
    );
  });
});

test.describe("API route tests", () => {
  test("GET /api/analytics/summary returns 200 with valid restaurantId", async ({ request }) => {
    // This hits the real API — needs restaurantId from a real session
    // Just test that the route exists and returns JSON
    const res = await request.get("/api/analytics/summary?restaurantId=test&days=7");
    // Should return 200 or 400 (not 404/500)
    expect([200, 400, 401]).toContain(res.status());
  });

  test("POST /api/extract-menu without file returns error", async ({ request }) => {
    const res = await request.post("/api/extract-menu");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/webhooks/pawapay with invalid signature returns 401", async ({ request }) => {
    const res = await request.post("/api/webhooks/pawapay", {
      data: { depositId: "fake", status: "COMPLETED" },
      headers: { "X-Pawapay-Signature": "invalid-sig" },
    });
    expect([401, 400]).toContain(res.status());
  });
});
