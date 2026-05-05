import type { Page } from '@playwright/test';
import { OnboardingPage } from '../pages/OnboardingPage';

export async function completeOnboarding(
  page: Page,
  options: { workspace?: string; project?: string } = {},
) {
  const onboarding = new OnboardingPage(page);
  const workspace = options.workspace ?? 'Test Workspace';
  const project = options.project ?? 'Test Project';

  await page.waitForURL(/\/onboarding/);
  await onboarding.workspaceNameInput().fill(workspace);
  await onboarding.continueButton().click();
  await onboarding.projectNameInput().fill(project);
  await onboarding.continueButton().click();
  await onboarding.skipInviteButton().click();
  await page.waitForURL(/\/(projects|dashboard)/);
}
