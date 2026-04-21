import { AppError, isAppError, isPrismaUniqueViolation } from '../../utils/errors.js';

describe('errors utils', () => {
  it('creates operational AppError', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
    expect(isAppError(error)).toBe(true);
  });

  it('detects prisma unique violations', () => {
    expect(isPrismaUniqueViolation({ code: 'P2002' })).toBe(true);
    expect(isPrismaUniqueViolation(new Error('other'))).toBe(false);
  });
});
