import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default async function globalTeardown() {
  process.env.DATABASE_URL =
    process.env.DATABASE_E2E_URL ||
    'postgresql://postgres:postgres@localhost:5432/taskflow_e2e';

  execSync('node e2e/scripts/reset-e2e-db.mjs', {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
}
