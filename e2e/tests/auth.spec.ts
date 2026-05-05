import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { API_BASE_URL, E2E_OWNER } from '../helpers/constants';
import {
  createExpiredPasswordResetToken,
  createPasswordResetToken,
  deleteUserByEmail,
  findUserByEmail,
  verifyUserPassword,
} from '../helpers/db';
import { uniqueName } from '../fixtures/data.fixture';

test.beforeEach(({ page }) => {
  attachConsoleGuards(page);
});

test.describe('Auth', () => {
  test('full registration flow', async ({ page }) => {
    const email = `e2e-register-${Date.now()}@testflow.test`;
    const password = 'TestPassword123!';
    const name = uniqueName('E2E User');

    const register = new RegisterPage(page);
    await register.register(name, email, password);

    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByRole('heading', { name: 'Name your workspace' })).toBeVisible();

    const user = await findUserByEmail(email);
    expect(user).toBeTruthy();
    expect(await verifyUserPassword(email, password)).toBe(true);
  });

  test('login with valid credentials', async ({ page, context }) => {
    const login = new LoginPage(page);
    await login.login(E2E_OWNER.email, E2E_OWNER.password);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(new DashboardPage(page).heading()).toBeVisible();

    const cookies = await context.cookies();
    const refreshCookie = cookies.find((cookie) => cookie.name === 'refreshToken');
    expect(refreshCookie).toBeTruthy();
    expect(refreshCookie?.httpOnly).toBe(true);
  });

  test('login with wrong password shows generic error', async ({ page, context }) => {
    const login = new LoginPage(page);
    await login.login(E2E_OWNER.email, 'WrongPassword999!');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Invalid credentials')).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'refreshToken')).toBeFalsy();
  });

  test('token refresh happens transparently', async ({ page }) => {
    const login = new LoginPage(page);
    await login.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    await page.evaluate(() => {
      const raw = localStorage.getItem('taskflow-auth');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = 'expired-token-for-e2e';
      localStorage.setItem('taskflow-auth', JSON.stringify(parsed));
    });

    const refreshResponse = page.waitForResponse(
      (response) => response.url().includes('/auth/refresh') && response.ok(),
    );
    await page.goto('/dashboard');
    await refreshResponse;
    await expect(new DashboardPage(page).heading()).toBeVisible({ timeout: 15_000 });

    const after = await page.evaluate(() => {
      const raw = localStorage.getItem('taskflow-auth');
      return raw ? JSON.parse(raw).state.accessToken : null;
    });

    expect(after).toBeTruthy();
    expect(after).not.toBe('expired-token-for-e2e');
  });

  test('logout clears session completely', async ({ page, context }) => {
    const login = new LoginPage(page);
    await login.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'refreshToken')).toBeFalsy();
  });

  test('forgot password → reset password full flow', async ({ page, request }) => {
    const email = `e2e-reset-flow-${Date.now()}@testflow.test`;
    const oldPassword = 'TestPassword123!';
    const newPassword = 'NewTestPassword123!';

    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: oldPassword, name: 'Reset Flow User' },
    });

    const rawToken = `e2e-reset-${Date.now()}`;
    await createPasswordResetToken(email, rawToken);

    await page.goto(`/reset-password?token=${rawToken}`);
    await page.getByLabel('New password').fill(newPassword);
    await page.getByLabel('Confirm password').fill(newPassword);
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page).toHaveURL(/\/login/);

    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password: newPassword },
    });
    expect(loginResponse.status()).toBe(200);

    const oldLoginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password: oldPassword },
    });
    expect(oldLoginResponse.status()).toBe(401);
  });

  test('rate limiting blocks after 5 failed logins', async ({ page, request }) => {
    test.skip(process.env.E2E_RATE_LIMIT !== '1', 'Set E2E_RATE_LIMIT=1 and AUTH_RATE_LIMIT_MAX=5 to run');

    const login = new LoginPage(page);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login.login('nobody@test.com', 'wrong');
      await expect(page).toHaveURL(/\/login/);
    }

    const apiResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: 'nobody@test.com', password: 'wrong' },
    });
    expect(apiResponse.status()).toBe(429);

    await login.login('nobody@test.com', 'wrong');
    await expect(page.getByText(/Too many authentication attempts/i)).toBeVisible();
  });
});

test.describe('Auth — negative & edge cases', () => {
  test('register with email whitespace is trimmed or rejected', async ({ request }) => {
    const email = `  e2e-trim-${Date.now()}@testflow.test  `;
    const normalized = email.trim().toLowerCase();

    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: { name: 'Trim User', email, password: 'TestPassword123!' },
    });

    expect(response.status()).not.toBe(500);

    if (response.ok()) {
      const user = await findUserByEmail(normalized);
      expect(user?.email).toBe(normalized);
      return;
    }

    expect(response.status()).toBe(400);
    expect(await findUserByEmail(normalized)).toBeNull();
  });

  test('register with extremely long inputs returns validation error', async ({ page, request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        name: 'x'.repeat(10_000),
        email: `${'a'.repeat(280)}@test.com`,
        password: 'TestPassword123!',
      },
    });

    expect(response.status()).toBe(400);
    expect(response.status()).not.toBe(500);
  });

  test('register with SQL injection attempt does not break database', async ({ page }) => {
    const email = `e2e-sql-${Date.now()}@testflow.test`;
    const register = new RegisterPage(page);
    await register.register("'); DROP TABLE users; --", email, 'TestPassword123!');

    await expect(page).toHaveURL(/\/onboarding/);
    const usersTable = await findUserByEmail(email);
    expect(usersTable).toBeTruthy();
  });

  test('register with XSS payload shows escaped name on dashboard', async ({ page }) => {
    const email = `e2e-xss-${Date.now()}@testflow.test`;
    const xssName = "<script>alert('xss')</script>";
    let alertFired = false;

    page.on('dialog', () => {
      alertFired = true;
    });

    const register = new RegisterPage(page);
    await register.register(xssName, email, 'TestPassword123!');

    await expect(page.getByPlaceholder('Acme Inc.')).toHaveValue(`${xssName}'s Workspace`);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByPlaceholder('Product Launch').fill('Safe Project');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Skip for now' }).click();

    await expect(page).toHaveURL(/\/(projects|dashboard)/);
    await expect(page.locator('header').getByText(xssName)).toBeVisible();
    expect(alertFired).toBe(false);
  });

  test('cannot log in to deleted account', async ({ request }) => {
    const email = `e2e-deleted-${Date.now()}@testflow.test`;
    const password = 'TestPassword123!';

    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password, name: 'Deleted User' },
    });

    await deleteUserByEmail(email);

    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password },
    });

    expect(response.status()).toBe(401);
  });

  test('reset password token cannot be used twice', async ({ page, request }) => {
    const email = `e2e-reset-twice-${Date.now()}@testflow.test`;
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: 'TestPassword123!', name: 'Reset Twice' },
    });

    const rawToken = `twice-${Date.now()}`;
    await createPasswordResetToken(email, rawToken);

    await page.goto(`/reset-password?token=${rawToken}`);
    await page.getByLabel('New password').fill('AnotherPass123!');
    await page.getByLabel('Confirm password').fill('AnotherPass123!');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page).toHaveURL(/\/login/);

    const secondAttempt = await request.post(`${API_BASE_URL}/auth/reset-password`, {
      data: { token: rawToken, password: 'ThirdPass123!' },
    });
    expect(secondAttempt.status()).toBe(400);
    expect((await secondAttempt.json()).message).toMatch(/already used/i);
  });

  test('reset password token cannot be used after expiry', async ({ page, request }) => {
    const email = `e2e-expired-${Date.now()}@testflow.test`;
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email, password: 'TestPassword123!', name: 'Expired Token User' },
    });

    const rawToken = `expired-${Date.now()}`;
    await createExpiredPasswordResetToken(email, rawToken);

    await page.goto(`/reset-password?token=${rawToken}`);
    await page.getByLabel('New password').fill('FreshPass123!');
    await page.getByLabel('Confirm password').fill('FreshPass123!');
    await page.getByRole('button', { name: 'Reset password' }).click();

    await expect(page.getByText(/expired|invalid/i)).toBeVisible();
  });

  test('login page does not leak whether email exists', async ({ request }) => {
    const existing = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: E2E_OWNER.email, password: 'wrong-password' },
    });
    const missing = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: 'nonexistent@email.com', password: 'wrong-password' },
    });

    expect(existing.status()).toBe(missing.status());
    expect(await existing.json()).toEqual(await missing.json());
  });

  test('concurrent login from two devices both work', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const loginA = new LoginPage(pageA);
    const loginB = new LoginPage(pageB);

    await loginA.loginAsOwner();
    await loginB.loginAsOwner();

    await pageA.goto('/dashboard');
    await pageB.goto('/dashboard');

    await expect(new DashboardPage(pageA).heading()).toBeVisible();
    await expect(new DashboardPage(pageB).heading()).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
