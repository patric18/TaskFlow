const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

process.env.NODE_ENV = 'test';

if (process.env.DATABASE_TEST_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
}

process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-min-32-characters-long';
process.env.REDIS_URL ||= 'redis://localhost:6379';
