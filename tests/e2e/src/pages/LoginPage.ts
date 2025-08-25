import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
    this.forgotPasswordLink = page.locator(
      '[data-testid="forgot-password-link"]',
    );
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Wait for either success (redirect) or error message
    await Promise.race([
      this.page.waitForURL("**/dashboard"),
      this.errorMessage.waitFor({ state: "visible" }),
    ]);
  }

  async isLoggedIn() {
    try {
      await this.page.goto("/dashboard");
      return this.page.url().includes("/dashboard");
    } catch {
      return false;
    }
  }

  async logout() {
    const logoutButton = this.page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await this.page.waitForURL("**/login");
    }
  }

  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}
