import type { Page } from '@playwright/test';

export class SettingsPage {
  constructor(private readonly page: Page) {}

  async gotoTeam() {
    await this.page.goto('/settings/team');
  }

  async gotoBilling() {
    await this.page.goto('/settings/billing');
  }

  inviteButton() {
    return this.page.getByRole('button', { name: 'Invite member' }).first();
  }

  async openInviteModal() {
    await this.inviteButton().click();
    await this.page.getByRole('heading', { name: 'Invite team member' }).waitFor();
  }

  async inviteMember(email: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER') {
    await this.openInviteModal();
    await this.page.getByLabel('Email address').fill(email);
    await this.page.locator('select').last().selectOption(role);
    await this.page.getByRole('button', { name: 'Send invite' }).click();
  }

  memberRow(email: string) {
    return this.page.locator('tr', { hasText: email });
  }
}
