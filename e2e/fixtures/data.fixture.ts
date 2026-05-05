import type { APIRequestContext } from '@playwright/test';
import { API_BASE_URL } from '../helpers/constants';
import { getE2eProjectId, getTasks } from '../helpers/api';

const DEFAULT_TASKS = [
  { title: 'E2E Todo One', status: 'TODO', position: 0, priority: 'MEDIUM' },
  { title: 'E2E Todo Two', status: 'TODO', position: 1, priority: 'LOW' },
  { title: 'E2E In Progress', status: 'IN_PROGRESS', position: 0, priority: 'HIGH' },
  { title: 'E2E Review Task', status: 'REVIEW', position: 0, priority: 'MEDIUM' },
  { title: 'E2E Done Task', status: 'DONE', position: 0, priority: 'LOW' },
  { title: 'Fix login bug', status: 'TODO', position: 2, priority: 'URGENT' },
] as const;

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}`;
}

export async function resetKanbanSeed(request: APIRequestContext) {
  const { accessToken, projectId, organizationId } = await getE2eProjectId(request);
  const tasks = await getTasks(request, accessToken, projectId);

  for (const task of tasks) {
    await request.delete(`${API_BASE_URL}/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  for (const task of DEFAULT_TASKS) {
    await request.post(`${API_BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: task.title,
        projectId,
        status: task.status,
        priority: task.priority,
      },
    });
  }

  return { accessToken, projectId, organizationId };
}

export async function createProject(
  request: APIRequestContext,
  accessToken: string,
  organizationId: string,
  name: string,
) {
  const response = await request.post(`${API_BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { name, organizationId, color: '#3b82f6' },
  });

  const body = await response.json();
  return body.project as { id: string; name: string };
}

export async function createTask(
  request: APIRequestContext,
  accessToken: string,
  projectId: string,
  data: {
    title: string;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
  },
) {
  const response = await request.post(`${API_BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { projectId, ...data },
  });

  const body = await response.json();
  return body.task as { id: string; title: string; status: string; position: number };
}

export async function registerUserViaApi(
  request: APIRequestContext,
  data: { name: string; email: string; password: string },
) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, { data });
  return { response, body: response.ok() ? await response.json() : await response.json() };
}
