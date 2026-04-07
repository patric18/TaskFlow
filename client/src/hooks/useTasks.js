import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks.js';
import { applyOptimisticMove } from '../utils/kanban.js';

export function useTasks(projectId) {
  const queryClient = useQueryClient();
  const queryKey = ['tasks', projectId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await tasksApi.list({ projectId });
      return data.tasks;
    },
    enabled: Boolean(projectId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (payload) => tasksApi.create({ ...payload, projectId }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => tasksApi.update(id, payload),
    onSuccess: (_data, variables) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }) => tasksApi.updatePosition(id, { status, position }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old = []) =>
        applyOptimisticMove(old, variables.id, {
          status: variables.status,
          position: variables.position,
        }),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    moveTask: moveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isMoving: moveMutation.isPending,
  };
}

export function useTask(taskId, enabled = true) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data } = await tasksApi.get(taskId);
      return data.task;
    },
    enabled: Boolean(taskId) && enabled,
  });
}
