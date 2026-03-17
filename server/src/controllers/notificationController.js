import * as notificationService from '../services/notificationService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.user.id, req.query);
  res.json({ notifications });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.json(result);
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(
    req.user.id,
    req.params.id,
  );
  res.json({ notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(req.user.id);
  res.json(result);
});
