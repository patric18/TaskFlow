import type { APIRequestContext } from '@playwright/test';
import { API_BASE_URL, E2E_OWNER } from './constants';

export async function loginViaApi(request: APIRequestContext, email = E2E_OWNER.email, password = E2E_OWNER.password) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  return body as { accessToken: string; user: { id: string; email: string } };
}

export async function getOrganizations(request: APIRequestContext, accessToken: string) {
  const response = await request.get(`${API_BASE_URL}/organizations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const body = await response.json();
  return body.organizations as Array<{ id: string; name: string; role: string; plan: string }>;
}

export async function getProjects(request: APIRequestContext, accessToken: string, organizationId: string) {
  const response = await request.get(`${API_BASE_URL}/projects?organizationId=${organizationId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const body = await response.json();
  return body.projects as Array<{ id: string; name: string }>;
}

export async function getTasks(request: APIRequestContext, accessToken: string, projectId: string) {
  const response = await request.get(`${API_BASE_URL}/tasks?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const body = await response.json();
  return body.tasks as Array<{
    id: string;
    title: string;
    status: string;
    position: number;
    assigneeId?: string | null;
  }>;
}

export async function findTaskByTitle(
  request: APIRequestContext,
  accessToken: string,
  projectId: string,
  title: string,
) {
  const tasks = await getTasks(request, accessToken, projectId);
  return tasks.find((task) => task.title === title) ?? null;
}

export async function getE2eProjectId(request: APIRequestContext) {
  const session = await loginViaApi(request);
  const orgs = await getOrganizations(request, session.accessToken);
  const org = orgs.find((item) => item.name === 'E2E Test Org');

  if (!org) {
    throw new Error('E2E organization not found — run global setup seed');
  }

  const projects = await getProjects(request, session.accessToken, org.id);
  const project = projects.find((item) => item.name === 'E2E Kanban Project');

  if (!project) {
    throw new Error('E2E project not found — run global setup seed');
  }

  return { accessToken: session.accessToken, organizationId: org.id, projectId: project.id };
}
