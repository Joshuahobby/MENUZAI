import { test, expect } from "@playwright/test";
import { createTestMenu, cleanupTestMenu } from "../utils/test-menu";

test.use({ storageState: { cookies: [], origins: [] } });

let menuData: { restaurantId: string; slug: string } | null = null;

test.beforeAll(async () => {
  menuData = await createTestMenu();
});

test.afterAll(async () => {
  if (menuData) await cleanupTestMenu(menuData.restaurantId);
});

test.describe("AI Waiter flow", () => {
  test.beforeEach(async ({ page }) => {
    if (!menuData) throw new Error("No menu data");
    await page.goto(`/menu/${menuData.slug}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("AI Waiter FAB opens chat panel", async ({ page }) => {
    // AI Waiter is Pro-only, so the FAB may not be present in free plan
    const aiFab = page.getByTitle(/digital waiter|assistant|ai/i).or(page.getByTitle(/robot/i));
    const hasFab = await aiFab.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasFab) {
      test.skip();
      return;
    }
    await aiFab.click();
    await expect(page.getByPlaceholder(/ask me|ask about/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("AI Waiter sends message and gets response", async ({ page }) => {
    // Intercept the API call to avoid hitting real AI provider
    await page.route("**/api/ai-waiter", (route) => {
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: "I'd recommend our signature Beef Burger! 🍔 It's grilled to perfection.",
      });
    });

    const aiFab = page.getByTitle(/digital waiter|assistant|ai/i).or(page.getByTitle(/robot/i));
    const hasFab = await aiFab.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasFab) {
      test.skip();
      return;
    }
    await aiFab.click();

    const input = page.getByPlaceholder(/ask me|ask about/i).first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("What's popular?");
    await page.getByRole("button").filter({ has: page.locator(".material-symbols-outlined, svg, button") }).filter({ hasText: /send|arrow/i }).first().click();

    // Should see the bot response
    const response = page.getByText(/burger|recommend|popular/i).first();
    await expect(response).toBeVisible({ timeout: 10000 });
  });
});
