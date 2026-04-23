import { Page } from "@playwright/test";

export class EditorPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard/editor");
  }

  get publishButton() {
    return this.page.getByRole("button", { name: /publish menu/i });
  }
  get unpublishButton() {
    return this.page.getByRole("button", { name: /unpublish/i });
  }
  get addCategoryButton() {
    return this.page.getByRole("button", { name: /add.*section|new.*section|add.*category/i }).first();
  }
  get addItemButton() {
    return this.page.getByRole("button", { name: /add item/i }).first();
  }
  get menuNameDisplay() {
    return this.page.locator('[title="Click to rename menu"]');
  }
  get menuNameInput() {
    return this.page.locator('input[placeholder="Menu name"]');
  }
  get publicMenuLink() {
    return this.page.getByRole("link", { name: /\/menu\//i });
  }
  get publishedBadge() {
    return this.page.getByText(/Published!/i);
  }
  get savingIndicator() {
    return this.page.getByText(/Saving…/i);
  }

  async publish() {
    await this.publishButton.click();
    // Wait for the published slug link or the badge
    await this.page.waitForFunction(() => {
      return (
        document.querySelector('[href*="/menu/"]') !== null ||
        document.body.innerText.includes("Published!")
      );
    }, { timeout: 10000 });
  }

  async unpublish() {
    await this.unpublishButton.click();
  }

  async addCategory(name: string) {
    await this.addCategoryButton.click();
    // The prompt modal should appear
    const modalInput = this.page.locator('dialog input, [role="dialog"] input').first();
    await modalInput.waitFor({ state: "visible" });
    await modalInput.fill(name);
    await this.page.getByRole("button", { name: /add|confirm|ok/i }).last().click();
  }

  async addItem(itemName: string, price: string) {
    await this.addItemButton.click();
    // Inline form or modal for new item
    const nameInput = this.page.locator('input[placeholder*="Item name"], input[placeholder*="item name"]').first();
    await nameInput.waitFor({ state: "visible" });
    await nameInput.fill(itemName);
    const priceInput = this.page.locator('input[placeholder*="price"], input[placeholder*="Price"]').first();
    if (await priceInput.isVisible()) await priceInput.fill(price);
    await this.page.getByRole("button", { name: /save|add/i }).last().click();
  }

  async getPublishedSlug(): Promise<string | null> {
    const link = this.publicMenuLink;
    if (await link.isVisible()) {
      const href = await link.getAttribute("href");
      return href?.split("/menu/")[1] ?? null;
    }
    return null;
  }
}
