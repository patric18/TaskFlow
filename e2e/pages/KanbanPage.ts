import type { Page } from '@playwright/test';
import { TaskModalPage } from './TaskModalPage';

export class KanbanPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
  }

  column(status: string) {
    return this.page.getByTestId(`kanban-column-${status}`);
  }

  columnCount(status: string) {
    return this.page.getByTestId(`kanban-count-${status}`);
  }

  addTaskButton(status: string) {
    return this.page.getByTestId(`kanban-add-${status}`);
  }

  taskCardByTitle(title: string) {
    return this.page.locator('[data-testid^="task-card-"]', { hasText: title });
  }

  async openAddTaskModal(status: string) {
    await this.addTaskButton(status).click();
    await this.page.getByRole('dialog').waitFor();
  }

  async createTask(title: string, priority = 'HIGH') {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByPlaceholder('Task title').fill(title);
    await dialog.locator('#priority').selectOption(priority);
    await dialog.getByRole('button', { name: 'Create task' }).click();
  }

  async dragTask(taskTitle: string, toColumnStatus: string) {
    const card = this.taskCardByTitle(taskTitle);
    const targetColumn = this.column(toColumnStatus);

    const cardBox = await card.boundingBox();
    const columnBox = await targetColumn.boundingBox();

    if (!cardBox || !columnBox) {
      throw new Error('Unable to resolve drag coordinates');
    }

    await this.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + 80, { steps: 12 });
    await this.page.mouse.up();
  }

  async openTask(taskTitle: string) {
    await this.taskCardByTitle(taskTitle).click();
    return new TaskModalPage(this.page);
  }
}
