import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../api/projects.js';
import { useOrganizations } from './useOrganizations.js';

export function useTeam() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganizations();
  const organizationId = currentOrganization?.id;
  const membersKey = ['organization-members', organizationId];

  const membersQuery = useQuery({
    queryKey: membersKey,
    queryFn: async () => {
      const { data } = await organizationsApi.listMembers(organizationId);
      return data.members;
    },
    enabled: Boolean(organizationId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: membersKey });
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
  };

  const inviteMutation = useMutation({
    mutationFn: (payload) => organizationsApi.inviteMember(organizationId, payload),
    onSuccess: invalidate,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      organizationsApi.updateMemberRole(organizationId, userId, { role }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => organizationsApi.removeMember(organizationId, userId),
    onSuccess: invalidate,
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    currentOrganization,
    inviteMember: inviteMutation.mutateAsync,
    updateMemberRole: updateRoleMutation.mutateAsync,
    removeMember: removeMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
