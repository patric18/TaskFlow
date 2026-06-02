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

  inviteDialog() {
    return this.page.getByRole('dialog', { name: 'Invite team member' });
  }

  inviteEmailInput() {
    return this.inviteDialog().getByLabel('Email address');
  }

  async inviteMember(email: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER') {
    await this.openInviteModal();
    await this.inviteEmailInput().fill(email);
    await this.inviteDialog().locator('select').selectOption(role);
    await this.inviteDialog().getByRole('button', { name: 'Send invite' }).click();
  }

  memberRow(email: string) {
    return this.page.locator('tr', { hasText: email });
  }
}
