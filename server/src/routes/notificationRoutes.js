import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateQuery } from '../middleware/validate.js';
import { listNotificationsQuerySchema } from '../validators/notification.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validateQuery(listNotificationsQuerySchema),
  notificationController.listNotifications,
);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markRead);
router.post('/read-all', notificationController.markAllRead);

export default router;
