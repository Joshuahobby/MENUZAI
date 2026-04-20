import { Page } from "@playwright/test";

export class OnboardingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/onboarding");
  }

  // Step 1
  get nameInput() { return this.page.locator("#ob-name"); }
  get taglineInput() { return this.page.locator("#ob-tagline"); }
  get hoursInput() { return this.page.locator("#ob-hours"); }
  get continueButton() { return this.page.getByRole("button", { name: /continue/i }); }

  // Step 2
  get whatsappToggle() { return this.page.getByRole("button", { name: /enable whatsapp|disable whatsapp/i }); }
  get phoneInput() { return this.page.locator("#ob-phone"); }
  get saveStep2Button() { return this.page.getByRole("button", { name: /save & continue|skip & continue/i }); }
  get backButton() { return this.page.getByRole("button", { name: /^back$/i }); }

  // Step 3
  get uploadMenuButton() { return this.page.getByRole("button", { name: /upload menu/i }); }
  get startFromScratchButton() { return this.page.getByRole("button", { name: /start from scratch/i }); }

  get errorMessage() { return this.page.locator(".text-error"); }
  get stepIndicator() { return this.page.locator(".rounded-full.font-bold"); }

  async completeStep1(name: string, tagline = "", hours = "") {
    await this.nameInput.fill(name);
    if (tagline) await this.taglineInput.fill(tagline);
    if (hours) await this.hoursInput.fill(hours);
    await this.continueButton.click();
  }

  async completeStep2(phone: string) {
    // Wait for step 2 to render before inspecting toggle state
    await this.whatsappToggle.waitFor({ state: "visible" });
    // WhatsApp defaults to enabled; only enable it if a previous test disabled it
    const isPhoneVisible = await this.phoneInput.isVisible().catch(() => false);
    if (!isPhoneVisible) {
      await this.whatsappToggle.click();
    }
    await this.phoneInput.waitFor({ state: "visible" });
    await this.phoneInput.fill(phone);
    await this.saveStep2Button.click();
  }

  async completeStep2WithWhatsappDisabled() {
    await this.whatsappToggle.click();
    await this.saveStep2Button.click();
  }

  async chooseStartFromScratch() {
    await this.startFromScratchButton.waitFor({ state: "visible" });
    await this.startFromScratchButton.click();
  }

  async chooseUploadMenu() {
    await this.uploadMenuButton.waitFor({ state: "visible" });
    await this.uploadMenuButton.click();
  }
}
