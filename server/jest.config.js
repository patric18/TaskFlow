/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/src/__tests__/env.setup.cjs'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/**/__tests__/**',
    '!src/utils/email.js',
    '!src/utils/logger.js',
    '!src/config/redis.js',
    '!src/config/stripe.js',
    '!src/services/billingService.js',
    '!src/services/memberService.js',
    '!src/**/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 30000,
};
