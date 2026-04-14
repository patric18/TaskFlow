import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '../api/projects.js';
import { useOrgStore } from '../store/orgStore.js';
import { useEffect } from 'react';

export function useOrganizations() {
  const currentOrganizationId = useOrgStore((s) => s.currentOrganizationId);
  const setCurrentOrganizationId = useOrgStore((s) => s.setCurrentOrganizationId);

  const query = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await organizationsApi.list();
      return data.organizations;
    },
  });

  const organizations = query.data ?? [];
  const currentOrganization =
    organizations.find((org) => org.id === currentOrganizationId) ?? organizations[0] ?? null;

  useEffect(() => {
    if (currentOrganization && currentOrganizationId !== currentOrganization.id) {
      setCurrentOrganizationId(currentOrganization.id);
    }
  }, [currentOrganization, currentOrganizationId, setCurrentOrganizationId]);

  return {
    organizations,
    currentOrganization,
    setCurrentOrganizationId,
    isLoading: query.isLoading,
    error: query.error,
  };
}
