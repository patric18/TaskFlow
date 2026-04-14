export function getNotificationHref(notification) {
  const { type, metadata } = notification;

  if (metadata?.projectId && metadata?.taskId) {
    return `/projects/${metadata.projectId}?task=${metadata.taskId}`;
  }

  if (type === 'MEMBER_INVITED' || type === 'MEMBER_REMOVED') {
    return '/settings/team';
  }

  if (type === 'PLAN_UPGRADED') {
    return '/settings/billing';
  }

  return null;
}

export const NOTIFICATION_TYPE_LABELS = {
  TASK_ASSIGNED: 'Task assigned',
  TASK_COMMENT: 'New comment',
  TASK_STATUS_CHANGED: 'Status changed',
  MEMBER_INVITED: 'Team invite',
  MEMBER_REMOVED: 'Removed from team',
  PLAN_UPGRADED: 'Plan upgraded',
  GENERAL: 'Notification',
};
