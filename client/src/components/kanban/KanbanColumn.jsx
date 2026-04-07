import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard.jsx';

export function KanbanColumn({ column, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{column.title}</h3>
          <span
            data-testid={`kanban-count-${column.id}`}
            className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          >
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          data-testid={`kanban-add-${column.id}`}
          onClick={() => onAddTask(column.id)}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          + Add task
        </button>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-column-${column.id}`}
        className={`flex min-h-[420px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver
            ? 'border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/20'
            : 'border-gray-200 bg-gray-100/50 dark:border-gray-800 dark:bg-gray-900/50'
        }`}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">No tasks yet</p>
        )}
      </div>
    </div>
  );
}
