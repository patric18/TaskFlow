export const E2E_OWNER = {
  email: 'e2e@taskflow.test',
  password: 'TestPassword123!',
  name: 'E2E Owner',
};

export const E2E_MEMBER = {
  email: 'e2e-member@testflow.test',
  password: 'TestPassword123!',
  name: 'E2E Member',
};

export const E2E_ORG_NAME = 'E2E Test Org';
export const E2E_PROJECT_NAME = 'E2E Kanban Project';

export const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api';

export const COLUMN_TITLES: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};
