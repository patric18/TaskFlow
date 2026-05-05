import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { E2E_OWNER } from '../helpers/constants';
import { getE2eProjectId } from '../helpers/api';

type Fixtures = {
  loginPage: LoginPage;
  ownerToken: string;
  e2eProjectId: string;
  authenticatedPage: void;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  ownerToken: async ({ request }, use) => {
    const { accessToken } = await getE2eProjectId(request);
    await use(accessToken);
  },

  e2eProjectId: async ({ request }, use) => {
    const { projectId } = await getE2eProjectId(request);
    await use(projectId);
  },

  authenticatedPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.login(E2E_OWNER.email, E2E_OWNER.password);
    await page.waitForURL(/\/dashboard/);
    await use();
  },
});

export { expect };

export function attachConsoleGuards(page: import('@playwright/test').Page) {
  page.on('pageerror', (error) => {
    throw error;
  });
}
