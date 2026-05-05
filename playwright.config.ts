import { defineConfig, devices } from '@playwright/test';

const e2eDatabaseUrl =
  process.env.DATABASE_E2E_URL ||
  'postgresql://postgres:postgres@localhost:5432/taskflow_e2e';

process.env.DATABASE_E2E_URL = e2eDatabaseUrl;
delete process.env.DATABASE_TEST_URL;

const serverEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: e2eDatabaseUrl,
  DATABASE_TEST_URL: e2eDatabaseUrl,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'test-access-secret-min-32-characters-long',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-min-32-characters-long',
  CLIENT_URL: 'http://localhost:5173',
  BILLING_DEV_MODE: 'true',
  LOG_LEVEL: 'error',
};

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './e2e/global-setup.mjs',
  globalTeardown: './e2e/global-teardown.mjs',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: serverEnv,
    },
    {
      command: 'npm run dev:client',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
