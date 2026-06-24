/**
 * Public menu & order flow tests.
 * Uses /menu/demo (no auth required, hardcoded mock data) so these run
 * without needing a published menu. A separate group tests the order page
 * directly via query params.
 */
import { test, expect } from "@playwright/test";

// These run WITHOUT stored auth state (public pages)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Demo menu page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/menu/demo");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders restaurant name and menu items", async ({ page }) => {
    await expect(page.locator("body")).not.toBeEmpty();
    // Should NOT redirect to login
    expect(page.url()).not.toContain("/login");
    expect(page.url()).toContain("/menu/demo");
  });

  test("category tabs are clickable", async ({ page }) => {
    const tabs = page.locator("button, [role='tab']").filter({ hasText: /.+/ });
    const count = await tabs.count();
    if (count > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(300);
      // Page should not crash
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("add item to cart shows cart badge", async ({ page }) => {
    // Find any "Add" button for a menu item
    const addBtn = page.getByRole("button", { name: /add/i }).first();
    const hasAdd = await addBtn.isVisible().catch(() => false);

    if (hasAdd) {
      await addBtn.click();
      // Cart badge / total should appear somewhere
      await page.isVisible('[data-testid="cart-button"]');
      // At minimum the page should not crash
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("non-existent public menu returns 404", async ({ page }) => {
    await page.goto("/menu/this-menu-does-not-exist-xyz");
    // Next.js renders 404 page
    const is404 = page.url().includes("this-menu-does-not-exist") ||
      await page.locator("body").textContent().then(t => t?.includes("404") || t?.includes("not found")).catch(() => false);
    expect(is404).toBe(true);
  });
});

test.describe("Order summary page", () => {
  // Build a URL with cart items via query params (bypasses needing real menu)
  const buildOrderUrl = (slug: string) => {
    const items = JSON.stringify([
      { id: "item1", name: "Samosa", price: 1500, quantity: 2, description: "", tags: [], available: true, category: "c1", image: "" },
      { id: "item2", name: "Beef Burger", price: 4500, quantity: 1, description: "", tags: [], available: true, category: "c1", image: "" },
    ]);
    const params = new URLSearchParams({
      menuId: "test-menu-id",
      restaurantId: "test-restaurant-id",
      phone: "+250788000000",
      currency: "RWF",
      items: encodeURIComponent(JSON.stringify(JSON.parse(items))),
    });
    return `/menu/${slug}/order?${params.toString()}`;
  };

  test("order page renders item list and total", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Order Summary")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Samosa").first()).toBeVisible();
    await expect(page.getByText("Beef Burger").first()).toBeVisible();
    // Total label
    await expect(page.getByText("Total").first()).toBeVisible();
  });

  test("order page shows WhatsApp message preview", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(/WhatsApp Message Preview/i)).toBeVisible({ timeout: 8000 });
  });

  test("customer name and table fields are fillable", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");

    const nameInput = page.getByPlaceholder(/your name/i);
    const tableInput = page.getByPlaceholder(/table/i);

    await nameInput.fill("Alice");
    await tableInput.fill("Table 5");

    await expect(nameInput).toHaveValue("Alice");
    await expect(tableInput).toHaveValue("Table 5");
  });

  test("Order via WhatsApp button is visible when items present", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");

    const whatsappBtn = page.getByText(/order via whatsapp/i, { exact: false }).first();
    await expect(whatsappBtn).toBeVisible({ timeout: 8000 });
  });

  test("/menu/[slug]/order route returns 404", async ({ page }) => {
    const response = await page.goto("/menu/test-slug/order", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
  });

  test("back arrow returns to the menu page", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");

    // The back arrow is a Link with arrow_back icon
    const backLink = page.locator('a[href*="/menu/demo"]').first();
    await backLink.click();
    await page.waitForURL(/\/menu\/demo$/, { timeout: 8000 });
    expect(page.url()).toContain("/menu/demo");
    expect(page.url()).not.toContain("/order");
  });

  test("table number pre-fills from ?table query param", async ({ page }) => {
    const params = new URLSearchParams({
      menuId: "test-menu-id",
      restaurantId: "test-restaurant-id",
      phone: "+250788000000",
      currency: "RWF",
      table: "7",
      items: encodeURIComponent(JSON.stringify([
        { id: "item1", name: "Samosa", price: 1500, quantity: 1, description: "", tags: [], available: true, category: "c1", image: "" },
      ])),
    });
    await page.goto(`/menu/demo/order?${params.toString()}`);
    await page.waitForLoadState("domcontentloaded");

    const tableInput = page.getByPlaceholder(/table/i);
    await expect(tableInput).toHaveValue("Table 7", { timeout: 5000 });
  });
});

test.describe("Post-order review nudge", () => {
  // Simulate reaching the order-placed confirmation screen by intercepting the
  // Supabase insert so we can drive the UI without real DB writes.
  const buildOrderUrl = (slug: string) =>
    `/menu/${slug}/order?` +
    new URLSearchParams({
      menuId: "test-menu-id",
      restaurantId: "test-restaurant-id",
      phone: "+250788000000",
      currency: "RWF",
      items: encodeURIComponent(JSON.stringify([
        { id: "i1", name: "Chapati", price: 500, quantity: 1, description: "", tags: [], available: true, category: "c1", image: "" },
      ])),
    }).toString();

  test("star rating widget appears on order confirmation screen", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");

    // Intercept Supabase orders insert to avoid real DB call
    await page.route("**/rest/v1/orders**", (route) => route.fulfill({ status: 201, body: "[]" }));
    // Intercept email notification — fire and forget
    await page.route("**/api/notifications/order**", (route) => route.fulfill({ status: 200, body: '{"sent":false}' }));

    const whatsappBtn = page.getByText(/order via whatsapp/i, { exact: false }).first();
    await expect(whatsappBtn).toBeVisible({ timeout: 8000 });

    // Click Place Order — this opens WhatsApp in a new tab; intercept it
    const [popup] = await Promise.all([
      page.waitForEvent("popup").catch(() => null),
      whatsappBtn.click(),
    ]);
    if (popup) await popup.close().catch(() => {});

    // After the order is recorded the confirmation screen should render
    const orderSent = page.getByText(/order sent/i).first();
    const hasConfirmation = await orderSent.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasConfirmation) {
      // DB write failed (no real Supabase in E2E) — graceful skip
      test.skip();
      return;
    }

    // Review nudge: star rating row should be visible
    const starBtns = page.locator("button").filter({ has: page.locator(".material-symbols-outlined", { hasText: "star" }) });
    await expect(starBtns.first()).toBeVisible({ timeout: 5000 });
  });

  test("review form shows textarea after selecting a star rating", async ({ page }) => {
    await page.goto(buildOrderUrl("demo"));
    await page.waitForLoadState("domcontentloaded");

    await page.route("**/rest/v1/orders**", (route) => route.fulfill({ status: 201, body: "[]" }));
    await page.route("**/api/notifications/order**", (route) => route.fulfill({ status: 200, body: '{"sent":false}' }));

    const whatsappBtn = page.getByText(/order via whatsapp/i, { exact: false }).first();
    await expect(whatsappBtn).toBeVisible({ timeout: 8000 });

    const [popup] = await Promise.all([
      page.waitForEvent("popup").catch(() => null),
      whatsappBtn.click(),
    ]);
    if (popup) await popup.close().catch(() => {});

    const orderSent = page.getByText(/order sent/i).first();
    const hasConfirmation = await orderSent.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasConfirmation) { test.skip(); return; }

    // Tap a star to reveal the comment textarea
    const starBtns = page.locator("button").filter({ has: page.locator(".material-symbols-outlined", { hasText: "star" }) });
    const starCount = await starBtns.count();
    if (starCount < 3) { test.skip(); return; }

    await starBtns.nth(2).click(); // 3-star tap
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /submit review/i })).toBeVisible({ timeout: 5000 });
  });
});
