import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.js';

const notificationsKey = ['notifications'];

export function useNotifications({ listEnabled = false } = {}) {
  const queryClient = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: [...notificationsKey, 'unread-count'],
    queryFn: async () => {
      const { data } = await notificationsApi.unreadCount();
      return data.count;
    },
    refetchInterval: 30_000,
  });

  const listQuery = useQuery({
    queryKey: [...notificationsKey, 'list'],
    queryFn: async () => {
      const { data } = await notificationsApi.list({ limit: 20 });
      return data.notifications;
    },
    enabled: listEnabled,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });

      const previousList = queryClient.getQueryData([...notificationsKey, 'list']);
      const previousCount = queryClient.getQueryData([...notificationsKey, 'unread-count']);

      if (Array.isArray(previousList)) {
        queryClient.setQueryData(
          [...notificationsKey, 'list'],
          previousList.map((item) => (item.id === id ? { ...item, read: true } : item)),
        );
      }

      if (typeof previousCount === 'number' && previousCount > 0) {
        queryClient.setQueryData([...notificationsKey, 'unread-count'], previousCount - 1);
      }

      return { previousList, previousCount };
    },
    onError: (_error, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData([...notificationsKey, 'list'], context.previousList);
      }

      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData([...notificationsKey, 'unread-count'], context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });

      const previousList = queryClient.getQueryData([...notificationsKey, 'list']);
      const previousCount = queryClient.getQueryData([...notificationsKey, 'unread-count']);

      if (Array.isArray(previousList)) {
        queryClient.setQueryData(
          [...notificationsKey, 'list'],
          previousList.map((item) => ({ ...item, read: true })),
        );
      }

      queryClient.setQueryData([...notificationsKey, 'unread-count'], 0);

      return { previousList, previousCount };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData([...notificationsKey, 'list'], context.previousList);
      }

      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData([...notificationsKey, 'unread-count'], context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  return {
    notifications: listQuery.data ?? [],
    unreadCount: unreadQuery.data ?? 0,
    isLoadingList: listQuery.isLoading,
    isLoadingUnread: unreadQuery.isLoading,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,
    refetchList: listQuery.refetch,
  };
}
