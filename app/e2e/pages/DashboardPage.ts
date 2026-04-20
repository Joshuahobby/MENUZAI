import { Page, expect } from "@playwright/test";

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  // Sidebar navigation (desktop)
  navLink(label: string) {
    return this.page.getByRole("link", { name: label }).first();
  }

  get signOutButton() {
    return this.page.getByRole("button", { name: /sign out/i });
  }

  async navigateTo(section: "Orders" | "My Menus" | "Analytics" | "Templates" | "QR Codes" | "Editor" | "Settings") {
    await this.navLink(section).click();
  }

  async signOut() {
    await this.signOutButton.click();
    await this.page.waitForURL("/login");
  }

  async expectOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
