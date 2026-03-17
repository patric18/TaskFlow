import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';

function formatNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };
}

export async function listNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { read: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return notifications.map(formatNotification);
}

export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: { userId, read: false },
  });

  return { count };
}

async function getOwnedNotification(userId, notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
}

export async function markNotificationRead(userId, notificationId) {
  await getOwnedNotification(userId, notificationId);

  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return formatNotification(notification);
}

export async function markAllNotificationsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { updated: result.count };
}
