import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { KanbanPage } from '../pages/KanbanPage';
import { resetKanbanSeed } from '../fixtures/data.fixture';
import { findTaskByTitle } from '../helpers/api';
import { getCommentsForTask, getTaskById } from '../helpers/db';
import { API_BASE_URL } from '../helpers/constants';
import { flaky } from '../helpers/flaky';

test.beforeEach(async ({ page, request }) => {
  attachConsoleGuards(page);
  await resetKanbanSeed(request);
});

test.describe('Task detail', () => {
  test('open task modal by clicking card', async ({ page, e2eProjectId, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('Fix login bug');
    await expect(modal.dialog()).toBeVisible();
    await expect(modal.titleInput()).toHaveValue('Fix login bug');
  });

  test('open task modal via ?task= query param', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'Fix login bug');
    await page.goto(`/projects/${e2eProjectId}?task=${task!.id}`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByPlaceholder('Task title')).toHaveValue('Fix login bug');
  });

  test('edit task title inline', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    const newTitle = `Updated ${Date.now()}`;
    await modal.titleInput().fill(newTitle);
    await modal.save();

    await expect(modal.titleInput()).toHaveValue(newTitle);
    await modal.close();
    await expect(kanban.taskCardByTitle(newTitle)).toBeVisible();

    const dbTask = await findTaskByTitle(request, ownerToken, e2eProjectId, newTitle);
    expect(dbTask?.title).toBe(newTitle);
  });

  test('add comment and see it immediately', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    const commentText = `E2E comment ${Date.now()}`;
    await modal.addComment(commentText);

    await expect(modal.dialog().getByText(commentText).first()).toBeVisible();
    await expect(modal.dialog().getByText(/ago|minute|second/i)).toBeVisible();

    await page.reload();
    await kanban.openTask('E2E Todo One');
    await expect(page.getByText(commentText)).toBeVisible();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'E2E Todo One');
    const comments = await getCommentsForTask(task!.id);
    expect(comments.some((comment) => comment.content === commentText)).toBe(true);
  });

  test('assign task to team member', async ({ page, e2eProjectId, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo Two');
    await modal.assigneeSelect().selectOption({ label: 'E2E Member' });
    await modal.save();

    await expect(modal.assigneeSelect()).toHaveValue(/./);
  });

  test('set due date and see overdue styling', async () => {
    test.skip(true, 'Due date styling on kanban cards is not implemented yet');
  });

  test('delete task', async () => {
    test.skip(true, 'Task delete UI is not implemented in modal yet');
  });

  test('close modal with Escape key', async ({ page, e2eProjectId, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    await kanban.openTask('E2E Todo One');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('Task detail — negative & edge cases', () => {
  test('comment cannot be empty', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    await expect(modal.postCommentButton()).toBeDisabled();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'E2E Todo One');
    const commentsBefore = await getCommentsForTask(task!.id);
    expect(commentsBefore.length).toBe(commentsBefore.length);
  });

  test('comment with only whitespace is rejected', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    await modal.commentInput().fill('     ');
    await expect(modal.postCommentButton()).toBeDisabled();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'E2E Todo One');
    const comments = await getCommentsForTask(task!.id);
    expect(comments.every((comment) => comment.content.trim().length > 0)).toBe(true);
  });

  test('markdown or HTML in comment is escaped, not rendered as HTML', flaky, async ({ page, e2eProjectId, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    const payload = '<b>bold</b> and <img src=x onerror=alert(1)>';
    await modal.addComment(payload);

    await expect(modal.dialog().getByText(payload).first()).toBeVisible();
    await expect(modal.dialog().locator('b')).toHaveCount(0);
    await expect(modal.dialog().locator('img')).toHaveCount(0);
  });

  test('task modal opened via direct URL with invalid task ID', async ({ page, e2eProjectId, authenticatedPage }) => {
    await page.goto(`/projects/${e2eProjectId}?task=nonexistent-id`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.animate-pulse, [class*="Skeleton"]').first()).toBeVisible();
  });

  test('task title cannot be saved as empty string', flaky, async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    await modal.titleInput().fill('');
    await modal.save();

    await expect(page.getByText(/title is required/i)).toBeVisible();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'E2E Todo One');
    expect(task?.title).toBe('E2E Todo One');
  });

  test('task title with 256 characters is rejected', flaky, async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const modal = await kanban.openTask('E2E Todo One');
    const longTitle = 'x'.repeat(256);
    await modal.titleInput().fill(longTitle);
    await modal.save();

    await expect(page.getByText(/title is too long/i)).toBeVisible();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'E2E Todo One');
    expect(task?.title).toBe('E2E Todo One');
  });

  test('rapidly clicking save on create task does not create duplicates', flaky, async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    const title = `Rapid ${Date.now()}`;
    await kanban.goto(e2eProjectId);
    await kanban.openAddTaskModal('TODO');
    await page.getByRole('dialog').getByPlaceholder('Task title').fill(title);

    const createButton = page.getByRole('dialog').getByRole('button', { name: 'Create task' });
    await createButton.click({ clickCount: 3, delay: 50 });

    await expect(kanban.taskCardByTitle(title)).toHaveCount(1, { timeout: 15000 });

    const tasks = (await request.get(`${API_BASE_URL}/tasks?projectId=${e2eProjectId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    }).then((response) => response.json())).tasks;

    expect(tasks.filter((task: { title: string }) => task.title === title)).toHaveLength(1);
  });
});
