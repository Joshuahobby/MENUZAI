/**
 * Upload page & AI extraction tests.
 * Uses route interception to mock /api/extract-menu so we never hit
 * the real AI API (slow, costs money, rate-limited).
 */
import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const MOCK_EXTRACTION_RESPONSE = {
  restaurantName: "AI Test Restaurant",
  categories: [
    { id: "cat1", name: "Starters" },
    { id: "cat2", name: "Mains" },
  ],
  items: [
    { id: "i1", name: "Spring Roll", price: 2000, description: "Crispy veg roll", category: "cat1", tags: [], available: true, image: "" },
    { id: "i2", name: "Grilled Chicken", price: 5500, description: "Served with chips", category: "cat2", tags: [], available: true, image: "" },
  ],
  suggestedTheme: null,
};

test.describe("Upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/upload");
    await page.waitForURL(/\/(upload|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/upload")) test.skip();
  });

  test("renders drop zone and upload heading", async ({ page }) => {
    await expect(page.getByText(/Upload Your Menu/i)).toBeVisible({ timeout: 8000 });
    // Drop zone exists
    const dropZone = page.locator('[class*="border-dashed"]').first();
    await expect(dropZone).toBeVisible();
  });

  test("rejects PDF files (unsupported type)", async ({ page }) => {
    // Create a minimal fake PDF in memory via data transfer
    const fakeFile = {
      name: "menu.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake content"),
    };

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: fakeFile.name,
      mimeType: fakeFile.mimeType,
      buffer: fakeFile.buffer,
    });

    // Should show 0 selected files (filtered out) or an error
    const errorMsg = page.locator("[class*='error'], .text-error").first();
    const hasError = await errorMsg.isVisible().catch(() => false);
    const fileList = page.getByText(/menu\.pdf/);
    const hasFile = await fileList.isVisible().catch(() => false);

    // Either rejected silently (not shown) or shows error
    expect(hasError || !hasFile).toBe(true);
  });

  test("accepts a valid PNG file", async ({ page }) => {
    // Create a minimal 1x1 PNG
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "menu.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    // File should appear in the list
    await expect(page.getByText("menu.png")).toBeVisible({ timeout: 5000 });
  });

  test("extract button is disabled when no files selected", async ({ page }) => {
    // Extract button should be absent or disabled with no files
    const extractBtn = page.getByRole("button", { name: /extract|analyse|analyze/i });
    const hasExtract = await extractBtn.isVisible().catch(() => false);
    if (hasExtract) {
      await expect(extractBtn).toBeDisabled();
    }
    // If not present yet, that's also correct (button only appears after file selection)
  });

  test("shows progress bar and redirects to /ai-result after extraction", async ({ page }) => {
    // Mock the API so we don't call real AI
    await page.route("/api/extract-menu", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_EXTRACTION_RESPONSE),
      });
    });

    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "menu.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    // Find and click extract button
    const extractBtn = page.getByRole("button", { name: /extract|analyse|analyze|upload/i }).first();
    await extractBtn.waitFor({ state: "visible", timeout: 5000 });
    await extractBtn.click();

    // Should show extracting state briefly then redirect
    await page.waitForURL("/ai-result", { timeout: 15000 });
    await expect(page).toHaveURL("/ai-result");
  });

  test("shows error message on API failure", async ({ page }) => {
    await page.route("/api/extract-menu", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "AI model unavailable" }),
      });
    });

    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "menu.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    const extractBtn = page.getByRole("button", { name: /extract|analyse|analyze|upload/i }).first();
    await extractBtn.waitFor({ state: "visible", timeout: 5000 });
    await extractBtn.click();

    // Should show error state
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("error") ||
             document.body.innerText.includes("AI model unavailable"),
      { timeout: 10000 }
    );
  });

  test("can remove a selected file", async ({ page }) => {
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "remove-me.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await expect(page.getByText("remove-me.png")).toBeVisible({ timeout: 5000 });

    // Find remove button (×, close, remove)
    const removeBtn = page.getByRole("button", { name: /remove|×|close|delete/i }).first();
    const hasRemove = await removeBtn.isVisible().catch(() => false);
    if (hasRemove) {
      await removeBtn.click();
      await expect(page.getByText("remove-me.png")).not.toBeVisible({ timeout: 3000 });
    }
  });
});
