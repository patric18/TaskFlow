import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '../api/projects.js';

export function useOrganizationMembers(organizationId, enabled = true) {
  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      const { data } = await organizationsApi.listMembers(organizationId);
      return data.members;
    },
    enabled: Boolean(organizationId) && enabled,
  });
}
