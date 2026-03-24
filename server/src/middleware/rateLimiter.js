import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

const WINDOW_MS = 15 * 60 * 1000;

function getAuthRateLimitMax() {
  if (process.env.NODE_ENV === 'test') {
    return 1000;
  }

  if (process.env.NODE_ENV === 'production') {
    return 5;
  }

  return Number(process.env.AUTH_RATE_LIMIT_MAX) || 100;
}

function getGeneralRateLimitMax() {
  if (process.env.NODE_ENV === 'production') {
    return 100;
  }

  return Number(process.env.GENERAL_RATE_LIMIT_MAX) || 1000;
}

function buildStore(prefix) {
  if (process.env.NODE_ENV === 'test' || redis.status !== 'ready') {
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rl:${prefix}:`,
  });
}

export function createGeneralLimiter() {
  const store = buildStore('general');

  if (!store && process.env.NODE_ENV !== 'test') {
    logger.debug('Using in-memory store for general rate limiter');
  }

  return rateLimit({
    windowMs: WINDOW_MS,
    max: getGeneralRateLimitMax(),
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: { message: 'Too many requests, please try again later' },
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
}

export function createAuthLimiter() {
  const store = buildStore('auth');

  if (!store && process.env.NODE_ENV !== 'test') {
    logger.debug('Using in-memory store for auth rate limiter');
  }

  return rateLimit({
    windowMs: WINDOW_MS,
    max: getAuthRateLimitMax(),
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: { message: 'Too many authentication attempts, please try again later' },
    handler: (_req, res, _next, options) => {
      const retryAfter = Math.ceil(WINDOW_MS / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json(options.message);
    },
  });
}
