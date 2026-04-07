import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge, PRIORITY_BADGE } from '../ui/Badge.jsx';
import { cn } from '../../utils/cn.js';

export function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.MEDIUM;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      {...attributes}
      {...listeners}
      onClick={(event) => {
        if (!isDragging) {
          onClick?.(task);
        }
        event.stopPropagation();
      }}
      className={cn(
        'cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing',
        'dark:border-gray-700 dark:bg-gray-900',
        isDragging && 'opacity-40',
      )}
      data-testid={`task-card-${task.id}`}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge color={priority.color}>{priority.label}</Badge>
        {task.assignee && (
          <Avatar name={task.assignee.name} src={task.assignee.avatar} size="sm" />
        )}
      </div>
    </motion.div>
  );
}

export function TaskCardOverlay({ task }) {
  if (!task) return null;

  const priority = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.MEDIUM;

  return (
    <div className="rotate-2 rounded-lg border border-brand-300 bg-white p-3 shadow-lg dark:border-brand-700 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
      <div className="mt-3">
        <Badge color={priority.color}>{priority.label}</Badge>
      </div>
    </div>
  );
}
