import request from 'supertest';
import { getTestApp, registerUser, authHeader } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/testDb.js';

const app = getTestApp();

describe('Auth API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('creates a user and returns tokens', async () => {
      const response = await registerUser(app, { email: 'new@test.com', name: 'New User' });

      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('new@test.com');
      expect(response.body.user.onboardingCompleted).toBe(false);
      expect(response.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
    });

    it('rejects duplicate email', async () => {
      await registerUser(app, { email: 'dup@test.com' });
      const response = await registerUser(app, { email: 'dup@test.com' });

      expect(response.status).toBe(409);
    });

    it('validates input', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'bad-email',
        password: 'short',
        name: '',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await registerUser(app, { email: 'login@test.com' });

      const response = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    it('rejects invalid credentials', async () => {
      await registerUser(app, { email: 'login2@test.com' });

      const response = await request(app).post('/api/auth/login').send({
        email: 'login2@test.com',
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/me', () => {
    it('returns profile for authenticated user', async () => {
      const register = await registerUser(app, { email: 'me@test.com' });

      const response = await request(app)
        .get('/api/users/me')
        .set(authHeader(register.body.accessToken));

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('me@test.com');
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/users/me');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('issues a new access token when refresh cookie is present', async () => {
      const agent = request.agent(app);

      await agent.post('/api/auth/register').send({
        email: 'refresh@test.com',
        password: 'password123',
        name: 'Refresh User',
      });

      const response = await agent.post('/api/auth/refresh');

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the refresh session', async () => {
      const agent = request.agent(app);

      await agent.post('/api/auth/register').send({
        email: 'logout@test.com',
        password: 'password123',
        name: 'Logout User',
      });

      const response = await agent.post('/api/auth/logout');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('accepts forgot-password requests', async () => {
      await registerUser(app, { email: 'forgot@test.com' });

      const response = await request(app).post('/api/auth/forgot-password').send({
        email: 'forgot@test.com',
      });

      expect(response.status).toBe(200);
    });
  });
});
