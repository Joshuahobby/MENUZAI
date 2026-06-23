import { Page, expect } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  get emailInput() {
    return this.page.locator('input[type="email"]');
  }
  get passwordInput() {
    return this.page.locator('input[type="password"]');
  }
  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }
  get toggleModeButton() {
    return this.page.getByRole("button", {
      name: /don't have an account|already have an account/i,
    });
  }
  get errorMessage() {
    return this.page.locator(".text-error");
  }
  get confirmationScreen() {
    return this.page.getByText("Check your inbox");
  }
  get backToLoginButton() {
    return this.page.getByRole("button", { name: /back to login/i });
  }

  async signIn(email: string, password: string) {
    const continueBtn = this.page.getByRole("button", { name: /continue with email/i });
    try {
      await continueBtn.waitFor({ state: "visible", timeout: 2000 });
      await continueBtn.click();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {}
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async switchToSignUp() {
    await expect(this.toggleModeButton).toContainText(/don't have an account/i);
    await this.toggleModeButton.click();
  }

  async signUp(email: string, password: string) {
    await this.switchToSignUp();
    const continueBtn = this.page.getByRole("button", { name: /continue with email/i });
    try {
      await continueBtn.waitFor({ state: "visible", timeout: 2000 });
      await continueBtn.click();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {}
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    // Button text is now "Create Account"
    await this.page.getByRole("button", { name: /create account/i }).click();
  }
}
