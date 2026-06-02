import type { Page } from '@playwright/test';

export class TaskModalPage {
  constructor(private readonly page: Page) {}

  dialog() {
    return this.page.getByRole('dialog');
  }

  titleInput() {
    return this.dialog().getByPlaceholder('Task title');
  }

  saveButton() {
    return this.dialog().getByRole('button', { name: 'Save changes' });
  }

  closeButton() {
    return this.dialog().locator('.border-t').getByRole('button', { name: 'Close' });
  }

  commentInput() {
    return this.dialog().getByPlaceholder('Write a comment...');
  }

  postCommentButton() {
    return this.dialog().getByRole('button', { name: 'Post comment' });
  }

  assigneeSelect() {
    return this.dialog().locator('select').nth(2);
  }

  async save() {
    await this.saveButton().click();
  }

  async addComment(content: string) {
    await this.commentInput().fill(content);
    const createComment = this.page.waitForResponse(
      (res) => res.url().includes('/comments') && res.request().method() === 'POST',
    );
    await this.postCommentButton().click();
    await createComment;
  }

  async close() {
    await this.closeButton().click();
  }

  async closeWithEscape() {
    await this.page.keyboard.press('Escape');
  }
}
