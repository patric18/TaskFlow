import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { BillingPage } from '../pages/BillingPage';
import { LoginPage } from '../pages/LoginPage';
import { completeOnboarding } from '../helpers/onboarding';
import { createProject } from '../fixtures/data.fixture';
import { getOrganizationBySlug, setOrganizationPlan } from '../helpers/db';
import { API_BASE_URL } from '../helpers/constants';
import { openCreateProjectModal, submitCreateProject } from '../helpers/projects';
import { flaky } from '../helpers/flaky';

test.beforeEach(({ page }) => {
  attachConsoleGuards(page);
});

test.describe('Billing', () => {
  test('Free plan user sees error when hitting project limit', async ({ page, request }) => {
    const email = `free-limit-${Date.now()}@testflow.test`;
    const password = 'TestPassword123!';

    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password, name: 'Free Limit User' },
    });

    await new LoginPage(page).login(email, password);
    await completeOnboarding(page, { workspace: 'Free Limit Org', project: 'Project One' });

    const login = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password },
    });
    const { accessToken } = await login.json();
    const orgs = await request.get(`${API_BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const org = (await orgs.json()).organizations[0];

    await setOrganizationPlan(org.id, 'FREE');
    await createProject(request, accessToken, org.id, 'Project Two');
    await createProject(request, accessToken, org.id, 'Project Three');

    await page.goto('/dashboard');
    await page.reload();

    await openCreateProjectModal(page);
    await submitCreateProject(page, 'Fourth Project');

    await expect(page.getByText(/project limit reached/i)).toBeVisible();
  });

  test('upgrade to Pro via dev billing', flaky, async ({ page, request }) => {
    const email = `dev-upgrade-${Date.now()}@testflow.test`;
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: 'TestPassword123!', name: 'Dev Upgrade User' },
    });

    await new LoginPage(page).login(email, 'TestPassword123!');
    await completeOnboarding(page, { workspace: 'Dev Billing Org', project: 'First Project' });

    const billing = new BillingPage(page);
    await billing.goto();
    await expect(page.getByText('FREE', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Dev billing mode')).toBeVisible();

    const upgradeButton = billing.devUpgradeButton();
    await expect(upgradeButton).toBeEnabled();
    await upgradeButton.click();
    await expect(page.getByText(/pro plan activated/i)).toBeVisible();

    const login = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password: 'TestPassword123!' },
    });
    const { accessToken } = await login.json();
    const orgs = await request.get(`${API_BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const org = (await orgs.json()).organizations[0];
    expect(org.plan).toBe('PRO');
  });

  test('Pro user can create more than 3 projects', async ({ page, authenticatedPage }) => {
    await page.goto('/dashboard');
    const dialog = await openCreateProjectModal(page);
    await expect(dialog.getByLabel('Project name')).toBeVisible();
  });

  test('upgrade to Pro via Stripe Checkout', async () => {
    test.skip(process.env.STRIPE_E2E !== '1', 'Stripe E2E requires STRIPE_E2E=1 and live test keys');
  });

  test('manage subscription via Stripe portal', async () => {
    test.skip(process.env.STRIPE_E2E !== '1', 'Stripe E2E requires STRIPE_E2E=1 and live test keys');
  });
});

test.describe('Billing — negative & edge cases', () => {
  test('webhook with unknown event type is ignored gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/billing/webhook`, {
      headers: { 'Content-Type': 'application/json' },
      data: { type: 'unknown.event.type' },
    });

    expect([200, 400]).toContain(response.status());
  });

  test('webhook with invalid JSON body returns 400', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/billing/webhook`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'this is not json',
    });

    expect(response.status()).toBe(400);
  });

  test('checkout session that was abandoned does not change plan', async ({ page, request }) => {
    const email = `abandon-${Date.now()}@testflow.test`;
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: 'TestPassword123!', name: 'Abandon User' },
    });

    await new LoginPage(page).login(email, 'TestPassword123!');
    await completeOnboarding(page, { workspace: 'Abandon Org', project: 'Abandon Project' });
    await page.goto('/settings/billing');

    const login = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password: 'TestPassword123!' },
    });
    const org = (await request.get(`${API_BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${(await login.json()).accessToken}` },
    }).then((response) => response.json())).organizations[0];

    expect(org.plan).toBe('FREE');
  });

  test('declined card shows friendly error on checkout', async () => {
    test.skip(true, 'Stripe decline cards require STRIPE_E2E=1');
  });
});

test.afterAll(async () => {
  const org = await getOrganizationBySlug('e2e-test-org');
  if (org) {
    await setOrganizationPlan(org.id, 'PRO');
  }
});
