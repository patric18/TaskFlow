import type { Page } from '@playwright/test';
import { E2E_OWNER } from '../helpers/constants';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  emailInput() {
    return this.page.getByLabel('Email');
  }

  passwordInput() {
    return this.page.getByLabel('Password');
  }

  submitButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  errorBanner() {
    return this.page.locator('.border-red-200, .dark\\:border-red-900').first();
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async loginAsOwner() {
    await this.login(E2E_OWNER.email, E2E_OWNER.password);
  }
}
