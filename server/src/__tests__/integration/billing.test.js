import request from 'supertest';
import { getTestApp, registerUser, authHeader, completeUserOnboarding } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';

const app = getTestApp();

describe('Billing API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns billing plans with dev billing flag in test env', async () => {
    const response = await request(app).get('/api/billing/plans');

    expect(response.status).toBe(200);
    expect(response.body.plans).toHaveLength(2);
    expect(response.body.devBillingAvailable).toBe(true);
  });

  it('allows dev upgrade and downgrade for organization owner', async () => {
    const register = await registerUser(app, { email: 'billing@test.com' });
    await completeUserOnboarding(register.body.accessToken);

    const orgs = await request(app)
      .get('/api/organizations')
      .set(authHeader(register.body.accessToken));

    const organizationId = orgs.body.organizations[0].id;

    const upgrade = await request(app)
      .post('/api/billing/dev-upgrade')
      .set(authHeader(register.body.accessToken))
      .send({ organizationId });

    expect(upgrade.status).toBe(200);
    expect(upgrade.body.plan).toBe('PRO');

    const downgrade = await request(app)
      .post('/api/billing/dev-downgrade')
      .set(authHeader(register.body.accessToken))
      .send({ organizationId });

    expect(downgrade.status).toBe(200);
    expect(downgrade.body.plan).toBe('FREE');
  });
});
