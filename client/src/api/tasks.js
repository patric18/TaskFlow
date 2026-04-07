import { api } from './client.js';

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  updatePosition: (id, data) => api.patch(`/tasks/${id}/position`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};
