import request from 'supertest';
import { getTestApp, registerUser, authHeader, completeUserOnboarding } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';

const app = getTestApp();

describe('Users API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('updates profile and completes onboarding', async () => {
    const register = await registerUser(app, { email: 'profile@test.com' });

    const update = await request(app)
      .patch('/api/users/me')
      .set(authHeader(register.body.accessToken))
      .send({ name: 'Updated Name' });

    expect(update.status).toBe(200);
    expect(update.body.user.name).toBe('Updated Name');

    const complete = await completeUserOnboarding(register.body.accessToken);

    expect(complete.status).toBe(200);
    expect(complete.body.user.onboardingCompleted).toBe(true);
  });
});

describe('Organizations API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('renames an organization', async () => {
    const register = await registerUser(app, { email: 'org@test.com' });
    await completeUserOnboarding(register.body.accessToken);

    const orgs = await request(app)
      .get('/api/organizations')
      .set(authHeader(register.body.accessToken));

    const organizationId = orgs.body.organizations[0].id;

    const response = await request(app)
      .patch(`/api/organizations/${organizationId}`)
      .set(authHeader(register.body.accessToken))
      .send({ name: 'Renamed Workspace' });

    expect(response.status).toBe(200);
    expect(response.body.organization.name).toBe('Renamed Workspace');
  });
});
