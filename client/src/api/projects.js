import { api } from './client.js';

export const organizationsApi = {
  list: () => api.get('/organizations'),
  get: (id) => api.get(`/organizations/${id}`),
  update: (id, data) => api.patch(`/organizations/${id}`, data),
  listMembers: (id) => api.get(`/organizations/${id}/members`),
  inviteMember: (id, data) => api.post(`/organizations/${id}/members/invite`, data),
  updateMemberRole: (id, userId, data) => api.patch(`/organizations/${id}/members/${userId}`, data),
  removeMember: (id, userId) => api.delete(`/organizations/${id}/members/${userId}`),
};

export const projectsApi = {
  list: (organizationId) => api.get('/projects', { params: { organizationId } }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};
