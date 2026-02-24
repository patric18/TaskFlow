import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { checkDatabaseHealth } from './config/database.js';
import { createGeneralLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRoutes } from './routes/index.js';
import { stripeWebhook } from './controllers/billingController.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(cookieParser());

  // Stripe webhook requires raw body — must be registered before express.json()
  app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook,
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(createGeneralLimiter());

  app.get('/api/health', async (_req, res) => {
    const db = await checkDatabaseHealth();
    const healthy = db.status === 'ok';

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'taskflow-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: db,
    });
  });

  app.use('/api', createApiRoutes());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
