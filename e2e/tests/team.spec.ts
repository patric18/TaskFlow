import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';
import { E2E_MEMBER, E2E_OWNER, API_BASE_URL } from '../helpers/constants';
import { findUserByEmail } from '../helpers/db';
import { flaky } from '../helpers/flaky';

test.beforeEach(({ page }) => {
  attachConsoleGuards(page);
});

test.describe('Team management', () => {
  test('invite existing member via email', async ({ page, request, authenticatedPage }) => {
    const inviteEmail = `invite-target-${Date.now()}@testflow.test`;
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email: inviteEmail, password: 'TestPassword123!', name: 'Invite Target' },
    });

    const settings = new SettingsPage(page);
    await settings.gotoTeam();
    await settings.inviteMember(inviteEmail, 'MEMBER');

    await expect(settings.memberRow(inviteEmail)).toBeVisible();

    const user = await findUserByEmail(inviteEmail);
    expect(user).toBeTruthy();
  });

  test('invited member can join via email link', async () => {
    test.skip(true, 'Invitation token flow (/invite?token=) is not implemented — invites require existing accounts');
  });

  test('MEMBER cannot access team management actions', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(E2E_MEMBER.email, E2E_MEMBER.password);
    await page.waitForURL(/\/dashboard/);

    await page.goto('/settings/team');
    await expect(page.getByRole('button', { name: 'Invite member' })).toHaveCount(0);
  });

  test('OWNER can change member role to ADMIN', flaky, async ({ page, browser }) => {
    const settings = new SettingsPage(page);
    await page.goto('/login');
    await new LoginPage(page).loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    await settings.gotoTeam();
    const memberRow = settings.memberRow(E2E_MEMBER.email);
    await memberRow.locator('select').selectOption('ADMIN');
    await expect(memberRow.locator('select')).toHaveValue('ADMIN', { timeout: 10000 });

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await new LoginPage(memberPage).login(E2E_MEMBER.email, E2E_MEMBER.password);
    await memberPage.waitForURL(/\/dashboard/);
    await memberPage.goto('/settings/team');
    await expect(memberPage.getByRole('button', { name: 'Invite member' }).first()).toBeVisible();
    await memberContext.close();
  });

  test('remove member from organization', async ({ page, browser, request }) => {
    const removableEmail = `remove-me-${Date.now()}@testflow.test`;
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email: removableEmail, password: 'TestPassword123!', name: 'Remove Me' },
    });

    const ownerLogin = new LoginPage(page);
    await ownerLogin.loginAsOwner();
    await page.waitForURL(/\/dashboard/);

    const settings = new SettingsPage(page);
    await settings.gotoTeam();
    await settings.inviteMember(removableEmail, 'MEMBER');
    await expect(settings.memberRow(removableEmail)).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await settings.memberRow(removableEmail).getByRole('button', { name: 'Remove' }).click();
    await expect(settings.memberRow(removableEmail)).toHaveCount(0);

    const removedContext = await browser.newContext();
    const removedPage = await removedContext.newPage();
    await new LoginPage(removedPage).login(removableEmail, 'TestPassword123!');
    await removedPage.goto('/dashboard');
    await expect(removedPage.getByText(/E2E Test Org/i)).toHaveCount(0);
    await removedContext.close();
  });
});

test.describe('Team — negative & edge cases', () => {
  test('cannot invite user who is already a member', async ({ page, authenticatedPage }) => {
    const settings = new SettingsPage(page);
    await settings.gotoTeam();
    await settings.inviteMember(E2E_MEMBER.email, 'MEMBER');

    await expect(page.getByText(/already a member/i)).toBeVisible();
  });

  test('cannot invite with invalid email format', async ({ page, authenticatedPage }) => {
    const settings = new SettingsPage(page);
    await settings.gotoTeam();
    await settings.openInviteModal();
    const emailInput = settings.inviteEmailInput();
    await emailInput.fill('notanemail');

    const valid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(valid).toBe(false);
  });

  test('owner cannot remove themselves', async ({ page, request, ownerToken, authenticatedPage }) => {
    const settings = new SettingsPage(page);
    await settings.gotoTeam();
    await expect(settings.memberRow(E2E_OWNER.email).getByRole('button', { name: 'Remove' })).toHaveCount(0);

    const orgs = await request.get(`${API_BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const org = (await orgs.json()).organizations.find((item: { name: string }) => item.name === 'E2E Test Org');
    const owner = await findUserByEmail(E2E_OWNER.email);

    const response = await request.delete(`${API_BASE_URL}/organizations/${org.id}/members/${owner!.id}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(response.status()).toBe(403);
  });
});
