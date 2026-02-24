import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis;

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
  });
}

export const prisma = globalForPrisma.__taskflowPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__taskflowPrisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (event) => {
    logger.debug({ query: event.query, duration: `${event.duration}ms` });
  });
}

export async function connectDatabase() {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return { status: 'error', message: error.message };
  }
}
