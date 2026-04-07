import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { useTasks } from '../../hooks/useTasks.js';
import {
  COLUMN_IDS,
  KANBAN_COLUMNS,
  computeDragPosition,
  groupTasksByStatus,
} from '../../utils/kanban.js';
import { KanbanColumn } from './KanbanColumn.jsx';
import { TaskCardOverlay } from './TaskCard.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { CreateTaskModal } from './CreateTaskModal.jsx';

export function KanbanBoard({ projectId, onTaskClick }) {
  const { tasks, isLoading, createTask, moveTask, isCreating } = useTasks(projectId);
  const [activeTask, setActiveTask] = useState(null);
  const [createStatus, setCreateStatus] = useState('TODO');
  const [showCreate, setShowCreate] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const grouped = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  const handleDragStart = (event) => {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const move = computeDragPosition(tasks, active.id, over.id);
    if (!move) return;

    const activeTaskItem = tasks.find((item) => item.id === active.id);
    if (
      activeTaskItem?.status === move.status &&
      activeTaskItem?.position === move.position
    ) {
      return;
    }

    try {
      await moveTask({ id: active.id, status: move.status, position: move.position });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to move task');
    }
  };

  const handleCreate = async (payload) => {
    await createTask({ ...payload, status: createStatus });
    toast.success('Task created');
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_IDS.map((id) => (
          <Skeleton key={id} className="h-[480px] w-72 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={grouped[column.id]}
              onAddTask={(status) => {
                setCreateStatus(status);
                setShowCreate(true);
              }}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>

        <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
      </DndContext>

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        loading={isCreating}
        defaultStatus={createStatus}
      />
    </>
  );
}
