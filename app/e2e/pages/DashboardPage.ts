import { Page, expect } from "@playwright/test";

const SECTION_URLS: Record<string, string> = {
  Orders:    "/dashboard/orders",
  "My Menus": "/dashboard/menus",
  Analytics: "/dashboard/analytics",
  Templates: "/dashboard/templates",
  "QR Codes": "/dashboard/qr-codes",
  Editor:    "/dashboard/editor",
  Settings:  "/dashboard/settings",
};

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  // Sidebar navigation (desktop)
  navLink(label: string) {
    return this.page.getByRole("link", { name: label }).first();
  }

  async waitForReady() {
    // Wait for the dashboard to be hydrated and auth to be ready
    await this.page.waitForSelector('[data-auth-ready="true"]', { timeout: 15000 });
    // Also wait for the loading skeleton to disappear if it's there
    await this.page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  get signOutButton() {
    return this.page.getByRole("button", { name: /sign out/i });
  }

  async navigateTo(section: "Orders" | "My Menus" | "Analytics" | "Templates" | "QR Codes" | "Editor" | "Settings") {
    await this.waitForReady();
    const targetUrl = SECTION_URLS[section];
    
    // Ensure the link is visible and enabled
    const link = this.navLink(section);
    await expect(link).toBeVisible();
    
    // Sometimes a click doesn't trigger navigation if the router is busy.
    // We'll click and then wait for the URL.
    await link.click();
    
    if (targetUrl) {
      // Use a more robust check: wait for URL AND some indicator that the page loaded
      await this.page.waitForURL(targetUrl, { timeout: 15000 });
      // Wait for any initial loading state on the new page to settle
      await this.page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }

  async signOut() {
    await this.signOutButton.click();
    await this.page.waitForURL("/login");
  }

  async expectOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
