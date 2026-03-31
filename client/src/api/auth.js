import { api } from './client.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  completeOnboarding: () => api.post('/users/me/complete-onboarding'),
};

export { organizationsApi, projectsApi } from './projects.js';
export { tasksApi } from './tasks.js';
export { commentsApi } from './comments.js';
export { billingApi } from './billing.js';
