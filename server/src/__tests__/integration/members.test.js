import request from 'supertest';
import { getTestApp, registerUser, authHeader, completeUserOnboarding } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';

const app = getTestApp();

describe('Members API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('invites an existing user to the organization', async () => {
    const ownerRegister = await registerUser(app, { email: 'owner@team.test' });
    await completeUserOnboarding(ownerRegister.body.accessToken);

    const memberRegister = await registerUser(app, { email: 'member@team.test' });
    await completeUserOnboarding(memberRegister.body.accessToken);

    const orgs = await request(app)
      .get('/api/organizations')
      .set(authHeader(ownerRegister.body.accessToken));

    const organizationId = orgs.body.organizations[0].id;

    const invite = await request(app)
      .post(`/api/organizations/${organizationId}/members/invite`)
      .set(authHeader(ownerRegister.body.accessToken))
      .send({ email: 'member@team.test', role: 'MEMBER' });

    expect(invite.status).toBe(201);

    const members = await request(app)
      .get(`/api/organizations/${organizationId}/members`)
      .set(authHeader(ownerRegister.body.accessToken));

    expect(members.body.members).toHaveLength(2);
    expect(members.body.members.some((member) => member.email === 'member@team.test')).toBe(true);
  });

  it('rejects invite for unknown email', async () => {
    const ownerRegister = await registerUser(app, { email: 'owner2@team.test' });
    await completeUserOnboarding(ownerRegister.body.accessToken);

    const orgs = await request(app)
      .get('/api/organizations')
      .set(authHeader(ownerRegister.body.accessToken));

    const organizationId = orgs.body.organizations[0].id;

    const invite = await request(app)
      .post(`/api/organizations/${organizationId}/members/invite`)
      .set(authHeader(ownerRegister.body.accessToken))
      .send({ email: 'ghost@team.test', role: 'MEMBER' });

    expect(invite.status).toBe(404);
  });
});
