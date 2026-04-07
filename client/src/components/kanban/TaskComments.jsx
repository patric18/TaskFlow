import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { useComments } from '../../hooks/useComments.js';
import { useAuthStore } from '../../store/authStore.js';
import { Skeleton } from '../ui/Skeleton.jsx';

export function TaskComments({ taskId, enabled }) {
  const user = useAuthStore((state) => state.user);
  const { comments, isLoading, addComment, deleteComment, isAdding } = useComments(taskId, enabled);
  const [content, setContent] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;

    try {
      await addComment(content.trim());
      setContent('');
    } catch {
      // optimistic rollback handled in hook
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Comments</h3>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Avatar name={comment.author?.name} src={comment.author?.avatar} size="md" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {comment.author?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                </div>
                {comment.authorId === user?.id && !comment.id.startsWith('optimistic-') && (
                  <button
                    type="button"
                    onClick={() => deleteComment(comment.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={isAdding} disabled={!content.trim()}>
            Post comment
          </Button>
        </div>
      </form>
    </div>
  );
}
