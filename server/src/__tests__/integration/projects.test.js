import request from 'supertest';
import { getTestApp, registerUser, authHeader, completeUserOnboarding } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';
import { prisma } from '../../config/database.js';

const app = getTestApp();

async function setupOwner() {
  const register = await registerUser(app);
  await completeUserOnboarding(register.body.accessToken);

  const orgs = await request(app)
    .get('/api/organizations')
    .set(authHeader(register.body.accessToken));

  return {
    token: register.body.accessToken,
    user: register.body.user,
    organization: orgs.body.organizations[0],
  };
}

describe('Projects API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates and lists projects', async () => {
    const { token, organization } = await setupOwner();

    const create = await request(app)
      .post('/api/projects')
      .set(authHeader(token))
      .send({
        name: 'Website',
        description: 'Redesign',
        color: '#3b82f6',
        organizationId: organization.id,
      });

    expect(create.status).toBe(201);
    expect(create.body.project.name).toBe('Website');

    const list = await request(app)
      .get('/api/projects')
      .query({ organizationId: organization.id })
      .set(authHeader(token));

    expect(list.status).toBe(200);
    expect(list.body.projects).toHaveLength(1);

    const get = await request(app)
      .get(`/api/projects/${create.body.project.id}`)
      .set(authHeader(token));

    expect(get.status).toBe(200);
    expect(get.body.project.name).toBe('Website');
  });

  it('enforces free plan project limit', async () => {
    const { token, organization } = await setupOwner();

    for (let index = 0; index < 3; index += 1) {
      await request(app)
        .post('/api/projects')
        .set(authHeader(token))
        .send({
          name: `Project ${index + 1}`,
          color: '#3b82f6',
          organizationId: organization.id,
        });
    }

    const response = await request(app)
      .post('/api/projects')
      .set(authHeader(token))
      .send({
        name: 'Project 4',
        color: '#ef4444',
        organizationId: organization.id,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Project limit/);
  });

  it('updates and deletes a project', async () => {
    const { token, organization } = await setupOwner();

    const create = await request(app)
      .post('/api/projects')
      .set(authHeader(token))
      .send({
        name: 'Old Name',
        color: '#3b82f6',
        organizationId: organization.id,
      });

    const projectId = create.body.project.id;

    const update = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set(authHeader(token))
      .send({ name: 'New Name' });

    expect(update.status).toBe(200);
    expect(update.body.project.name).toBe('New Name');

    const del = await request(app).delete(`/api/projects/${projectId}`).set(authHeader(token));

    expect(del.status).toBe(200);

    const remaining = await prisma.project.count({ where: { id: projectId } });
    expect(remaining).toBe(0);
  });
});
