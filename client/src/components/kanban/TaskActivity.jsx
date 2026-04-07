import { format } from 'date-fns';

export function TaskActivity({ task, comments }) {
  const events = [
    {
      id: 'created',
      label: 'Task created',
      at: task?.createdAt,
    },
    ...(task?.updatedAt && task.updatedAt !== task.createdAt
      ? [
          {
            id: 'updated',
            label: 'Task updated',
            at: task.updatedAt,
          },
        ]
      : []),
    ...comments.map((comment) => ({
      id: comment.id,
      label: `${comment.author?.name || 'Someone'} commented`,
      at: comment.createdAt,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-gray-200">{event.label}</span>
            <span className="mx-1">·</span>
            {format(new Date(event.at), 'MMM d, yyyy h:mm a')}
          </li>
        ))}
      </ul>
    </div>
  );
}
