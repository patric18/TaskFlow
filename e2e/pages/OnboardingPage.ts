import type { Page } from '@playwright/test';

export class OnboardingPage {
  constructor(private readonly page: Page) {}

  progressNav() {
    return this.page.getByRole('navigation', { name: 'Onboarding progress' });
  }

  workspaceNameInput() {
    return this.page.getByPlaceholder('Acme Inc.');
  }

  projectNameInput() {
    return this.page.getByPlaceholder('Product Launch');
  }

  teammateEmailInput() {
    return this.page.getByLabel('Teammate email');
  }

  continueButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  backButton() {
    return this.page.getByRole('button', { name: 'Back' });
  }

  skipInviteButton() {
    return this.page.getByRole('button', { name: 'Skip for now' });
  }
}
