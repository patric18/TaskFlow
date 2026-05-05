import type { Page } from '@playwright/test';

export class BillingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/settings/billing');
  }

  currentPlanBadge() {
    return this.page.locator('text=Current').first();
  }

  devUpgradeButton() {
    return this.page.getByRole('button', { name: 'Activate Pro (dev)' });
  }

  devDowngradeButton() {
    return this.page.getByRole('button', { name: 'Downgrade to Free (dev)' });
  }

  upgradeButton() {
    return this.page.getByRole('button', { name: 'Upgrade to Pro' });
  }
}
