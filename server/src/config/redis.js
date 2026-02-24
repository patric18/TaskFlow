import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const globalForRedis = globalThis;

function createRedisClient() {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('error', (error) => {
    logger.error({ err: error }, 'Redis connection error');
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  return client;
}

export const redis = globalForRedis.__taskflowRedis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.__taskflowRedis = redis;
}

export async function connectRedis() {
  if (redis.status === 'ready') {
    return;
  }

  await redis.connect();
}

export async function disconnectRedis() {
  if (redis.status === 'end' || redis.status === 'wait') {
    return;
  }

  await redis.quit();
  logger.info('Redis disconnected');
}

export function setRedisClient(client) {
  globalForRedis.__taskflowRedis = client;
}
