import request from 'supertest';
import { getTestApp, registerUser, authHeader, completeUserOnboarding } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';

const app = getTestApp();

async function setupProject() {
  const register = await registerUser(app);
  await completeUserOnboarding(register.body.accessToken);

  const orgs = await request(app)
    .get('/api/organizations')
    .set(authHeader(register.body.accessToken));

  const organization = orgs.body.organizations[0];

  const project = await request(app)
    .post('/api/projects')
    .set(authHeader(register.body.accessToken))
    .send({
      name: 'Board',
      color: '#3b82f6',
      organizationId: organization.id,
    });

  return {
    token: register.body.accessToken,
    user: register.body.user,
    organization,
    project: project.body.project,
  };
}

describe('Tasks API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates, lists, updates, and deletes tasks', async () => {
    const { token, project } = await setupProject();

    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({
        title: 'First task',
        projectId: project.id,
        status: 'TODO',
        priority: 'HIGH',
      });

    expect(create.status).toBe(201);
    const taskId = create.body.task.id;

    const list = await request(app)
      .get('/api/tasks')
      .query({ projectId: project.id })
      .set(authHeader(token));

    expect(list.body.tasks).toHaveLength(1);

    const update = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(authHeader(token))
      .send({ title: 'Updated task', status: 'IN_PROGRESS' });

    expect(update.status).toBe(200);
    expect(update.body.task.title).toBe('Updated task');
    expect(update.body.task.status).toBe('IN_PROGRESS');

    const del = await request(app).delete(`/api/tasks/${taskId}`).set(authHeader(token));
    expect(del.status).toBe(200);
  });

  it('reorders tasks via position endpoint', async () => {
    const { token, project } = await setupProject();

    const first = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Task A', projectId: project.id, status: 'TODO' });

    const second = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Task B', projectId: project.id, status: 'TODO' });

    const move = await request(app)
      .patch(`/api/tasks/${second.body.task.id}/position`)
      .set(authHeader(token))
      .send({ status: 'IN_PROGRESS', position: 0 });

    expect(move.status).toBe(200);
    expect(move.body.task.status).toBe('IN_PROGRESS');
    expect(move.body.task.position).toBe(0);
    expect(first.body.task.id).not.toBe(second.body.task.id);
  });

  it('creates comments on tasks', async () => {
    const { token, project } = await setupProject();

    const task = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Discuss me', projectId: project.id });

    const comment = await request(app)
      .post(`/api/tasks/${task.body.task.id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Looks good' });

    expect(comment.status).toBe(201);

    const list = await request(app)
      .get(`/api/tasks/${task.body.task.id}/comments`)
      .set(authHeader(token));

    expect(list.body.comments).toHaveLength(1);

    const del = await request(app)
      .delete(`/api/comments/${comment.body.comment.id}`)
      .set(authHeader(token));

    expect(del.status).toBe(200);
  });
});
