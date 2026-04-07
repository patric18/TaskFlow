import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../api/comments.js';
import { useAuthStore } from '../store/authStore.js';

export function useComments(taskId, enabled = true) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const queryKey = ['comments', taskId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await commentsApi.list(taskId);
      return data.comments;
    },
    enabled: Boolean(taskId) && enabled,
  });

  const addMutation = useMutation({
    mutationFn: (content) => commentsApi.create(taskId, { content }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey) || [];

      const optimistic = {
        id: `optimistic-${Date.now()}`,
        content,
        taskId,
        authorId: user?.id,
        author: {
          id: user?.id,
          name: user?.name,
          avatar: user?.avatar,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, [...previous, optimistic]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentsApi.delete(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    addComment: addMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
