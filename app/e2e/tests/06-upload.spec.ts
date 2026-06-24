/**
 * Upload page & AI extraction tests.
 * Uses route interception to mock /api/extract-menu so we never hit
 * the real AI API (slow, costs money, rate-limited).
 */
import { test, expect } from "@playwright/test";

const EXTRACTED_CATEGORIES = [
  { id: "cat1", name: "Starters" },
  { id: "cat2", name: "Mains" },
];

const EXTRACTED_ITEMS = [
  { id: "i1", name: "Spring Roll", price: 2000, description: "Crispy veg roll", category: "cat1", tags: ["vegan"], available: true, image: "" },
  { id: "i2", name: "Grilled Chicken", price: 5500, description: "Served with chips", category: "cat2", tags: [], available: true, image: "" },
];

function buildSSEBody(overrides?: Record<string, unknown>): string {
  const result = {
    restaurantName: "AI Test Restaurant",
    categories: EXTRACTED_CATEGORIES,
    items: EXTRACTED_ITEMS,
    suggestedTheme: null,
    ...overrides,
  };
  const events = [
    `data: ${JSON.stringify({ type: "progress", pct: 50, step: "Reading menu..." })}`,
    "",
    `data: ${JSON.stringify({ type: "result", data: result })}`,
    "",
  ];
  return events.join("\n");
}

const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("Upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/upload");
    await page.waitForURL(/\/(upload|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/upload")) test.skip();
  });

  test("renders drop zone and upload heading", async ({ page }) => {
    await expect(page.getByText(/Upload Your Menu/i)).toBeVisible({ timeout: 8000 });
    const dropZone = page.locator('[class*="border-dashed"]').first();
    await expect(dropZone).toBeVisible();
  });

  test("rejects PDF files (unsupported type)", async ({ page }) => {
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

    const errorMsg = page.locator("[class*='error'], .text-error").first();
    const hasError = await errorMsg.isVisible().catch(() => false);
    const fileList = page.getByText(/menu\.pdf/);
    const hasFile = await fileList.isVisible().catch(() => false);

    expect(hasError || !hasFile).toBe(true);
  });

  test("accepts a valid PNG file", async ({ page }) => {
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "menu.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await expect(page.getByText("menu.png")).toBeVisible({ timeout: 5000 });
  });

  test("extract button is disabled when no files selected", async ({ page }) => {
    const extractBtn = page.getByRole("button", { name: /extract|analyse|analyze/i });
    const hasExtract = await extractBtn.isVisible().catch(() => false);
    if (hasExtract) {
      await expect(extractBtn).toBeDisabled();
    }
  });

  test("extracts and redirects to /ai-result (SSE mock)", async ({ page }) => {
    await page.route("/api/extract-menu", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: buildSSEBody(),
      });
    });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "menu.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    const extractBtn = page.getByRole("button", { name: /extract|analyse|analyze|upload/i }).first();
    await extractBtn.waitFor({ state: "visible", timeout: 5000 });
    await extractBtn.click();

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

    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "menu.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    const extractBtn = page.getByRole("button", { name: /extract|analyse|analyze|upload/i }).first();
    await extractBtn.waitFor({ state: "visible", timeout: 5000 });
    await extractBtn.click();

    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("error") ||
             document.body.innerText.includes("AI model unavailable"),
      { timeout: 10000 }
    );
  });

  test("can remove a selected file", async ({ page }) => {
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "remove-me.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await expect(page.getByText("remove-me.png")).toBeVisible({ timeout: 5000 });

    const removeBtn = page.getByRole("button", { name: /remove|×|close|delete/i }).first();
    const hasRemove = await removeBtn.isVisible().catch(() => false);
    if (hasRemove) {
      await removeBtn.click();
      await expect(page.getByText("remove-me.png")).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("AI Result page (after extraction)", () => {
  test("shows empty state with navigation when no items loaded", async ({ page }) => {
    await page.goto("/ai-result");
    await page.waitForURL("/ai-result", { timeout: 10000 });

    // Shows the empty state
    await expect(page.getByText("No items extracted")).toBeVisible({ timeout: 15000 });

    // "Try Again" links to upload
    await expect(page.getByRole("link", { name: /try again/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /try again/i })).toHaveAttribute("href", "/upload");

    // "Go to Editor" links to dashboard editor
    await expect(page.getByRole("link", { name: /go to editor/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /go to editor/i })).toHaveAttribute("href", "/dashboard/editor");
  });
});
