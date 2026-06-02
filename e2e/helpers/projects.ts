import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export function createProjectDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Create project' });
}

export async function openCreateProjectModal(page: Page) {
  await page.getByRole('button', { name: '+ New' }).click();
  const dialog = createProjectDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function submitCreateProject(page: Page, name: string) {
  const dialog = createProjectDialog(page);
  await dialog.getByLabel('Project name').fill(name);
  await dialog.getByRole('button', { name: 'Create project' }).click();
}
