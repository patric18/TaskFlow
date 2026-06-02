/** Marks unstable E2E tests — excluded from required CI via `npm run e2e:ci`. */
export const flaky = { tag: ['@flaky'] as const };
