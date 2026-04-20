/**
 * Sign-out test — must run LAST to avoid invalidating the Supabase session
 * that all other authenticated tests depend on.
 *
 * supabase.auth.signOut() with scope:'global' revokes the server-side token.
 * Any test file that runs after this and reuses the same stored session
 * will fail authentication. Running this last avoids that cascade.
 */
import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Sign out", () => {
  test("sign out redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/(dashboard|onboarding|login)/, { timeout: 10000 });
    if (!page.url().includes("/dashboard")) {
      test.skip();
      return;
    }

    const dash = new DashboardPage(page);
    await dash.signOut();
    await expect(page).toHaveURL("/login");
  });
});
