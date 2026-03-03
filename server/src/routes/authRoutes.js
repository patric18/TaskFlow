import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { createAuthLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.js';

export function createAuthRoutes() {
  const router = Router();
  const authLimiter = createAuthLimiter();

  router.use(authLimiter);

  router.post('/register', validateBody(registerSchema), authController.register);
  router.post('/login', validateBody(loginSchema), authController.login);
  router.post('/logout', authController.logout);
  router.post('/refresh', authController.refresh);
  router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
  router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

  return router;
}
