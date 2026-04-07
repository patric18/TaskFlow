import { api } from './client.js';

export const commentsApi = {
  list: (taskId) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};
