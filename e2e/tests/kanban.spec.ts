import { test, expect, attachConsoleGuards } from '../fixtures/auth.fixture';
import { KanbanPage } from '../pages/KanbanPage';
import { resetKanbanSeed, uniqueName } from '../fixtures/data.fixture';
import { findTaskByTitle, getTasks } from '../helpers/api';
import { getTaskById } from '../helpers/db';

test.beforeEach(async ({ page, request }) => {
  attachConsoleGuards(page);
  await resetKanbanSeed(request);
});

test.describe('Kanban', () => {
  test('renders all 4 columns with correct task counts', async ({ page, e2eProjectId, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    await expect(kanban.column('TODO')).toBeVisible();
    await expect(kanban.column('IN_PROGRESS')).toBeVisible();
    await expect(kanban.column('REVIEW')).toBeVisible();
    await expect(kanban.column('DONE')).toBeVisible();

    await expect(kanban.columnCount('TODO')).toHaveText('3');
    await expect(kanban.columnCount('IN_PROGRESS')).toHaveText('1');
    await expect(kanban.columnCount('REVIEW')).toHaveText('1');
    await expect(kanban.columnCount('DONE')).toHaveText('1');
  });

  test('create new task via "+ Add task" button', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    const title = uniqueName('New E2E task');

    await kanban.goto(e2eProjectId);
    await kanban.openAddTaskModal('TODO');
    await kanban.createTask(title, 'High');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(kanban.taskCardByTitle(title)).toBeVisible();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, title);
    expect(task).toBeTruthy();
    expect(task?.status).toBe('TODO');
  });

  test('drag task from TODO to IN PROGRESS', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    await kanban.dragTask('Fix login bug', 'IN_PROGRESS');
    await expect(kanban.column('IN_PROGRESS').getByText('Fix login bug')).toBeVisible();

    const task = await findTaskByTitle(request, ownerToken, e2eProjectId, 'Fix login bug');
    expect(task?.status).toBe('IN_PROGRESS');

    const dbTask = await getTaskById(task!.id);
    expect(dbTask?.status).toBe('IN_PROGRESS');

    const tasks = await getTasks(request, ownerToken, e2eProjectId);
    const inProgress = tasks.filter((item) => item.status === 'IN_PROGRESS').sort((a, b) => a.position - b.position);
    inProgress.forEach((item, index) => {
      expect(item.position).toBe(index);
    });
  });

  test('drag reorders tasks within same column', async () => {
    test.skip(true, 'Same-column reorder requires precise pointer coordinates with @dnd-kit');
  });

  test('task card shows priority badge and assignee avatar', async ({ page, e2eProjectId, authenticatedPage }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    const card = kanban.taskCardByTitle('Fix login bug');
    await expect(card.getByText('Urgent')).toBeVisible();
    await expect(card.locator('[class*="rounded-full"]').first()).toBeVisible();
  });

  test('filter tasks by assignee', async () => {
    test.skip(true, 'Assignee filter UI is not implemented yet');
  });
});

test.describe('Kanban — negative & edge cases', () => {
  test('kanban board loads correctly with 0 tasks in all columns', async ({ page, request, e2eProjectId, ownerToken, authenticatedPage }) => {
    const { accessToken, projectId } = await resetKanbanSeed(request);
    const tasks = await getTasks(request, accessToken, projectId);
    for (const task of tasks) {
      await request.delete(`http://localhost:3001/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    const kanban = new KanbanPage(page);
    await kanban.goto(e2eProjectId);

    await expect(kanban.column('TODO')).toBeVisible();
    await expect(kanban.columnCount('TODO')).toHaveText('0');
    await expect(kanban.columnCount('IN_PROGRESS')).toHaveText('0');
    await expect(kanban.columnCount('REVIEW')).toHaveText('0');
    await expect(kanban.columnCount('DONE')).toHaveText('0');
  });

  test('cannot create task in project you are not a member of', async ({ request, ownerToken, e2eProjectId }) => {
    const outsiderEmail = `outsider-${Date.now()}@testflow.test`;
    await request.post('http://localhost:3001/api/auth/register', {
      data: { email: outsiderEmail, password: 'TestPassword123!', name: 'Outsider' },
    });

    const login = await request.post('http://localhost:3001/api/auth/login', {
      data: { email: outsiderEmail, password: 'TestPassword123!' },
    });
    const outsiderToken = (await login.json()).accessToken;

    const response = await request.post('http://localhost:3001/api/tasks', {
      headers: { Authorization: `Bearer ${outsiderToken}` },
      data: { title: 'Forbidden task', projectId: e2eProjectId },
    });

    expect(response.status()).toBe(403);
  });

  test('kanban board handles 200 tasks without freezing', async () => {
    test.skip(true, '200-task performance seed is too heavy for default CI runs');
  });
});
