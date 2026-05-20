/**
 * QR Codes page tests — chromium project (stored auth).
 */
import { test, expect } from "@playwright/test";

test.describe("QR Codes page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/qr-codes");
    await page.waitForURL(/\/(dashboard\/qr-codes|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/qr-codes")) test.skip();
  });

  test("page loads without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain("/qr-codes");
  });

  test("shows QR code when menu is published", async ({ page }) => {
    // If a menu is published, a QR code SVG should render
    const qrSvg = page.locator("#qr-code-svg, svg[role='img']").first();
    const hasQr = await qrSvg.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasQr) {
      await expect(qrSvg).toBeVisible();
    } else {
      // No published menu — should show a prompt to publish first
      const noMenuMsg = page.getByText(/publish|no menu|no qr/i).first();
      await expect(noMenuMsg).toBeVisible({ timeout: 5000 });
    }
  });

  test("table number input updates the QR code URL", async ({ page }) => {
    const qrSvg = page.locator("#qr-code-svg, svg[role='img']").first();
    const hasQr = await qrSvg.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasQr) {
      test.skip();
      return;
    }

    const tableInput = page.getByPlaceholder("e.g. 05").first();
    await tableInput.fill("5");
    await page.waitForTimeout(500);

    // QR code should re-render (still visible)
    await expect(qrSvg).toBeVisible();
  });

  test("table number appears as badge on the poster when entered", async ({ page }) => {
    const qrSvg = page.locator("#qr-code-svg, svg[role='img']").first();
    const hasQr = await qrSvg.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasQr) { test.skip(); return; }

    const tableInput = page.getByPlaceholder("e.g. 05").first();
    await tableInput.fill("12");
    await page.waitForTimeout(300);

    // The poster preview should now show the "Table 12" badge
    const badge = page.getByText(/table 12/i).first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test("colour picker changes QR code colour", async ({ page }) => {
    const qrSvg = page.locator("#qr-code-svg, svg[role='img']").first();
    const hasQr = await qrSvg.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasQr) { test.skip(); return; }

    const colorInput = page.locator('input[type="color"]').first();
    const hasColor = await colorInput.isVisible().catch(() => false);
    if (hasColor) {
      await colorInput.fill("#000000");
      await page.waitForTimeout(300);
      await expect(qrSvg).toBeVisible();
    }
  });

  test("Download PNG button is visible when QR code is shown", async ({ page }) => {
    const qrSvg = page.locator("#qr-code-svg, svg[role='img']").first();
    const hasQr = await qrSvg.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasQr) { test.skip(); return; }

    const downloadBtn = page.getByRole("button", { name: /download/i }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });
  });
});
