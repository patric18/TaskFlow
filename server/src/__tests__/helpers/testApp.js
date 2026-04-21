import request from 'supertest';
import { createApp } from '../../app.js';

let appInstance = null;

export function getTestApp() {
  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance;
}

export function authHeader(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function registerUser(app, overrides = {}) {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'password123',
      name: 'Test User',
      ...overrides,
    });

  return response;
}

export async function completeUserOnboarding(accessToken) {
  return request(getTestApp())
    .post('/api/users/me/complete-onboarding')
    .set(authHeader(accessToken));
}
