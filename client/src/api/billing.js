import { api } from './client.js';

export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  checkout: (organizationId) => api.post('/billing/checkout', { organizationId }),
  portal: (organizationId) => api.post('/billing/portal', { organizationId }),
  devUpgrade: (organizationId) => api.post('/billing/dev-upgrade', { organizationId }),
  devDowngrade: (organizationId) => api.post('/billing/dev-downgrade', { organizationId }),
};
