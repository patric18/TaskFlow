import { isAppError, isPrismaUniqueViolation } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, _req, res, _next) {
  if (isPrismaUniqueViolation(err)) {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  if (isAppError(err)) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  logger.error({ err }, 'Unhandled error');

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({ message });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
}
