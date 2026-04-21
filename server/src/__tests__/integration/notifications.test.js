import request from 'supertest';
import { getTestApp, registerUser, authHeader, completeUserOnboarding } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';
import { prisma } from '../../config/database.js';

const app = getTestApp();

describe('Notifications API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('lists notifications and marks them read', async () => {
    const ownerRegister = await registerUser(app, { email: 'owner@notify.test' });
    await completeUserOnboarding(ownerRegister.body.accessToken);

    const assigneeRegister = await registerUser(app, { email: 'assignee@notify.test' });
    await completeUserOnboarding(assigneeRegister.body.accessToken);

    const orgs = await request(app)
      .get('/api/organizations')
      .set(authHeader(ownerRegister.body.accessToken));

    const organization = orgs.body.organizations[0];

    await request(app)
      .post(`/api/organizations/${organization.id}/members/invite`)
      .set(authHeader(ownerRegister.body.accessToken))
      .send({ email: 'assignee@notify.test', role: 'MEMBER' });

    const project = await request(app)
      .post('/api/projects')
      .set(authHeader(ownerRegister.body.accessToken))
      .send({
        name: 'Notify Project',
        color: '#3b82f6',
        organizationId: organization.id,
      });

    await request(app)
      .post('/api/tasks')
      .set(authHeader(ownerRegister.body.accessToken))
      .send({
        title: 'Assigned task',
        projectId: project.body.project.id,
        assigneeId: assigneeRegister.body.user.id,
      });

    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader(assigneeRegister.body.accessToken));

    expect(unread.body.count).toBeGreaterThanOrEqual(1);

    const list = await request(app)
      .get('/api/notifications')
      .set(authHeader(assigneeRegister.body.accessToken));

    expect(list.body.notifications.length).toBeGreaterThanOrEqual(1);

    const notificationId = list.body.notifications[0].id;

    const markRead = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(authHeader(assigneeRegister.body.accessToken));

    expect(markRead.status).toBe(200);
    expect(markRead.body.notification.read).toBe(true);

    await request(app)
      .post('/api/notifications/read-all')
      .set(authHeader(assigneeRegister.body.accessToken));

    const remaining = await prisma.notification.count({
      where: { userId: assigneeRegister.body.user.id, read: false },
    });

    expect(remaining).toBe(0);
  });
});
