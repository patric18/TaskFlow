import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error(
      { err: error },
      'Database connection failed — is PostgreSQL running? Run: docker compose up -d',
    );
  }

  try {
    await connectRedis();
  } catch (error) {
    logger.warn(
      { err: error },
      'Redis connection failed — rate limiting will use memory store. Run: docker compose up -d',
    );
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`TaskFlow API listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${PORT} is already in use. Free it with: lsof -ti:${PORT} | xargs kill -9`,
      );
      process.exit(1);
    }

    throw err;
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close();
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
