import type { Page } from '@playwright/test';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register');
  }

  async register(name: string, email: string, password: string) {
    await this.goto();
    await this.page.getByLabel('Full name').fill(name);
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password', { exact: true }).fill(password);
    await this.page.getByRole('button', { name: 'Create account' }).click();
  }
}

export class ForgotPasswordPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async submit(email: string) {
    await this.goto();
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByRole('button', { name: 'Send reset link' }).click();
  }
}
