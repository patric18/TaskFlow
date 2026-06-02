import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_E2E_URL =
    process.env.DATABASE_E2E_URL ||
    'postgresql://postgres:postgres@localhost:5432/taskflow_e2e';
  process.env.DATABASE_URL = process.env.DATABASE_E2E_URL;
  delete process.env.DATABASE_TEST_URL;

  try {
    execSync(
      "docker exec taskflow-postgres psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname = 'taskflow_e2e'\" | grep -q 1 || docker exec taskflow-postgres psql -U postgres -c \"CREATE DATABASE taskflow_e2e;\"",
      { stdio: 'inherit' },
    );
  } catch {
    execSync(
      "psql postgresql://postgres:postgres@localhost:5432/postgres -tc \"SELECT 1 FROM pg_database WHERE datname = 'taskflow_e2e'\" | grep -q 1 || psql postgresql://postgres:postgres@localhost:5432/postgres -c \"CREATE DATABASE taskflow_e2e;\"",
      { stdio: 'inherit' },
    );
  }

  execSync('npx prisma generate', {
    cwd: path.join(rootDir, 'server'),
    stdio: 'inherit',
    env: process.env,
  });

  execSync('npx prisma migrate deploy', {
    cwd: path.join(rootDir, 'server'),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });

  execSync('node e2e/scripts/seed-e2e.mjs', {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
}
