import { jest } from '@jest/globals';
import { AppError } from '../../utils/errors.js';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler.js';

function createMockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  it('returns operational errors with status code', () => {
    const res = createMockResponse();

    errorHandler(new AppError('Not allowed', 403), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not allowed' });
  });

  it('handles prisma unique violations', () => {
    const res = createMockResponse();

    errorHandler({ code: 'P2002' }, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Resource already exists' });
  });

  it('handles jwt errors', () => {
    const res = createMockResponse();
    const error = new Error('bad token');
    error.name = 'JsonWebTokenError';

    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns generic message for unexpected errors in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = createMockResponse();
    errorHandler(new Error('secret stack'), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

    process.env.NODE_ENV = originalEnv;
  });
});

describe('notFoundHandler middleware', () => {
  it('returns 404 for unknown routes', () => {
    const res = createMockResponse();
    const req = { originalUrl: '/api/missing' };

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Route not found',
      path: '/api/missing',
    });
  });
});
