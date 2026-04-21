import { describe, it, expect } from 'vitest';
import { getNotificationHref, NOTIFICATION_TYPE_LABELS } from '../../utils/notificationLinks.js';

describe('notificationLinks', () => {
  it('builds task links from metadata', () => {
    const href = getNotificationHref({
      type: 'TASK_ASSIGNED',
      metadata: { projectId: 'proj-1', taskId: 'task-1' },
    });

    expect(href).toBe('/projects/proj-1?task=task-1');
  });

  it('builds settings links for team and billing events', () => {
    expect(getNotificationHref({ type: 'MEMBER_INVITED' })).toBe('/settings/team');
    expect(getNotificationHref({ type: 'PLAN_UPGRADED' })).toBe('/settings/billing');
  });

  it('exposes labels for known notification types', () => {
    expect(NOTIFICATION_TYPE_LABELS.TASK_COMMENT).toBe('New comment');
  });
});
