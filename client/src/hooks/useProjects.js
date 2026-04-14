import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.js';
import { useOrganizations } from './useOrganizations.js';

export function useProjects() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganizations();
  const organizationId = currentOrganization?.id;

  const query = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      const { data } = await projectsApi.list(organizationId);
      return data.projects;
    },
    enabled: Boolean(organizationId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => projectsApi.create({ ...payload, organizationId }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => projectsApi.update(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    currentOrganization,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProject(projectId) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await projectsApi.get(projectId);
      return data.project;
    },
    enabled: Boolean(projectId),
  });
}
