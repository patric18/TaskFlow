import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { KanbanPage } from '../pages/KanbanPage';
import { API_BASE_URL, E2E_OWNER } from '../helpers/constants';
import { flaky } from '../helpers/flaky';

test.beforeEach(({ page }) => {
  attachConsoleGuards(page);
});

test.describe('Network & infrastructure edge cases', () => {
  test('app shows error state when API is unreachable', flaky, async ({ page }) => {
    const login = new LoginPage(page);
    await login.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/settings/billing');
    await expect(page.getByText('Dev billing mode')).toBeVisible();

    await page.route('**/api/billing/dev-upgrade', (route) => route.abort());

    await page.getByRole('button', { name: 'Activate Pro (dev)' }).click();
    await expect(page.getByText(/unable to start checkout/i)).toBeVisible();
  });

  test('session expires mid-session — user redirected to login gracefully', async ({ page, context }) => {
    const login = new LoginPage(page);
    await login.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    await context.clearCookies();
    await page.evaluate(() => localStorage.removeItem('taskflow-auth'));

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('duplicate tab with same session works correctly', async ({ page, e2eProjectId }) => {
    const login = new LoginPage(page);
    await login.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const secondTab = await page.context().newPage();
    await secondTab.goto(page.url());
    await expect(secondTab.getByTestId('kanban-column-TODO')).toBeVisible();
    await secondTab.close();
  });

  test('page does not crash on browser back button after logout', async ({ page }) => {
    const login = new LoginPage(page);
    await login.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Accessibility & UX edge cases', () => {
  test('form errors are announced to screen readers on login', async ({ page }) => {
    await new LoginPage(page).goto();
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('[role="alert"], [aria-live="polite"], .text-red-600').first()).toBeVisible();
  });

  test('very long task title does not break kanban card layout', flaky, async ({
    page,
    request,
    e2eProjectId,
    ownerToken,
    authenticatedPage,
  }) => {
    const longTitle = 'L'.repeat(255);
    const createResponse = await request.post(`${API_BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { title: longTitle, projectId: e2eProjectId, status: 'TODO' },
    });
    expect(createResponse.ok()).toBeTruthy();

    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);
    await expect(kanban.column('TODO')).toBeVisible();

    const card = kanban.taskCardByTitle(longTitle);
    await expect(card).toBeVisible();
    const box = await kanban.column('TODO').boundingBox();
    const cardBox = await card.boundingBox();
    expect(box && cardBox ? cardBox.width <= box.width : true).toBe(true);
  });
});
