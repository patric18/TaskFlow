import { Router } from 'express';
import { createAuthRoutes } from './authRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import commentRoutes from './commentRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import userRoutes from './userRoutes.js';
import billingRoutes from './billingRoutes.js';
import notificationRoutes from './notificationRoutes.js';

export function createApiRoutes() {
  const router = Router();

  router.use('/auth', createAuthRoutes());
  router.use('/users', userRoutes);
  router.use('/organizations', organizationRoutes);
  router.use('/comments', commentRoutes);
  router.use('/projects', projectRoutes);
  router.use('/tasks', taskRoutes);
  router.use('/billing', billingRoutes);
  router.use('/notifications', notificationRoutes);

  return router;
}
