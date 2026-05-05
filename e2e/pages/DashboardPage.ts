import type { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  heading() {
    return this.page.getByRole('heading', { name: /Welcome back/i });
  }
}
