import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { RegisterPage } from '../pages/RegisterPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { LoginPage } from '../pages/LoginPage';
import { completeOnboarding } from '../helpers/onboarding';
import { uniqueName } from '../fixtures/data.fixture';

test.beforeEach(({ page }) => {
  attachConsoleGuards(page);
});

test.describe('Onboarding', () => {
  test('new user completes full onboarding flow', async ({ page }) => {
    const email = `onboarding-${Date.now()}@testflow.test`;
    const register = new RegisterPage(page);
    await register.register(uniqueName('Onboarding User'), email, 'TestPassword123!');

    await expect(page).toHaveURL(/\/onboarding/);

    const onboarding = new OnboardingPage(page);
    await onboarding.workspaceNameInput().fill('My Startup');
    await onboarding.continueButton().click();
    await expect(page.getByRole('heading', { name: 'Create your first project' })).toBeVisible();

    await onboarding.projectNameInput().fill('Website Redesign');
    await onboarding.continueButton().click();
    await onboarding.skipInviteButton().click();

    await expect(page).toHaveURL(/\/(projects|dashboard)/);
    await expect(page.getByText('Website Redesign')).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await new LoginPage(page).login(email, 'TestPassword123!');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/\/onboarding/);
  });

  test('cannot skip onboarding step 1 (org name required)', async ({ page }) => {
    const email = `onboarding-step1-${Date.now()}@testflow.test`;
    await new RegisterPage(page).register(uniqueName('Step One User'), email, 'TestPassword123!');
    await expect(page).toHaveURL(/\/onboarding/);

    const workspaceInput = new OnboardingPage(page).workspaceNameInput();
    await workspaceInput.clear();
    await workspaceInput.fill('   ');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText(/workspace name is required/i)).toBeVisible();
  });

  test('back button works between onboarding steps', async ({ page }) => {
    const email = `onboarding-back-${Date.now()}@testflow.test`;
    await new RegisterPage(page).register(uniqueName('Back User'), email, 'TestPassword123!');

    const onboarding = new OnboardingPage(page);
    await onboarding.workspaceNameInput().fill('My Startup');
    await onboarding.continueButton().click();
    await expect(page.getByRole('heading', { name: 'Create your first project' })).toBeVisible();

    await onboarding.backButton().click();
    await expect(page.getByRole('heading', { name: 'Name your workspace' })).toBeVisible();
    await expect(onboarding.workspaceNameInput()).toHaveValue('My Startup');
  });
});
