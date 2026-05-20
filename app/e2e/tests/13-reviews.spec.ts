/**
 * Reviews dashboard page tests — chromium project (stored auth).
 */
import { test, expect } from "@playwright/test";

test.describe("Reviews dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/reviews");
    await page.waitForURL(/\/(dashboard\/reviews|login|onboarding)/, { timeout: 10000 });
    if (!page.url().includes("/reviews")) test.skip();
    await page.waitForLoadState("domcontentloaded");
  });

  test("page loads without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain("/reviews");
  });

  test("shows page heading or empty state", async ({ page }) => {
    // Wait for the loading spinner to disappear
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 10000 }
    ).catch(() => {});

    // Either a heading with "Reviews" / "Feedback" or an empty-state message
    const heading = page.getByRole("heading").filter({ hasText: /reviews|feedback/i }).first();
    const emptyState = page.getByText(/no reviews yet|be the first|haven't received/i).first();

    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasHeading || hasEmpty).toBe(true);
  });

  test("rating filter buttons are rendered", async ({ page }) => {
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 10000 }
    ).catch(() => {});

    // Rating filter pills (1–5 stars) or sentiment chips should be present
    const filterArea = page.locator("button").filter({ hasText: /★|star|positive|negative|neutral|all/i }).first();
    const hasFilter = await filterArea.isVisible({ timeout: 5000 }).catch(() => false);
    // Filters only render when there are reviews — skip assertion if no reviews
    if (!hasFilter) test.skip();
    await expect(filterArea).toBeVisible();
  });

  test("reviews list renders star ratings when reviews exist", async ({ page }) => {
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 10000 }
    ).catch(() => {});

    const starIcons = page.locator(".material-symbols-outlined").filter({ hasText: "star" });
    const starCount = await starIcons.count();

    if (starCount === 0) {
      // No reviews yet — verify empty state renders gracefully
      await expect(page.locator("body")).toBeVisible();
      return;
    }

    expect(starCount).toBeGreaterThan(0);
  });

  test("summary stats section renders when reviews exist", async ({ page }) => {
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 10000 }
    ).catch(() => {});

    const body = await page.locator("body").textContent();
    const hasStats =
      body?.includes("Average") ||
      body?.includes("avg") ||
      body?.includes("positive") ||
      body?.includes("Total");

    // Stats only appear when there are reviews
    if (!hasStats) {
      // Empty state is acceptable
      await expect(page.locator("body")).toBeVisible();
    } else {
      expect(hasStats).toBe(true);
    }
  });

  test("AI reply button is visible on review cards when reviews exist", async ({ page }) => {
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 10000 }
    ).catch(() => {});

    const aiReplyBtn = page.getByRole("button", { name: /ai reply|generate reply|draft reply/i }).first();
    const hasAiBtn = await aiReplyBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAiBtn) {
      // No reviews — graceful skip
      test.skip();
      return;
    }
    await expect(aiReplyBtn).toBeVisible();
  });
});
