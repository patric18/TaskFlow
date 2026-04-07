export const KANBAN_COLUMNS = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
];

export const COLUMN_IDS = KANBAN_COLUMNS.map((column) => column.id);

export function groupTasksByStatus(tasks) {
  const grouped = Object.fromEntries(COLUMN_IDS.map((id) => [id, []]));

  tasks.forEach((task) => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  });

  COLUMN_IDS.forEach((id) => {
    grouped[id].sort((a, b) => a.position - b.position);
  });

  return grouped;
}

export function computeDragPosition(tasks, activeId, overId) {
  const activeTask = tasks.find((task) => task.id === activeId);
  if (!activeTask) return null;

  const grouped = groupTasksByStatus(tasks);

  if (COLUMN_IDS.includes(overId)) {
    return {
      status: overId,
      position: grouped[overId].filter((task) => task.id !== activeId).length,
    };
  }

  const overTask = tasks.find((task) => task.id === overId);
  if (!overTask) return null;

  const columnTasks = grouped[overTask.status].filter((task) => task.id !== activeId);
  const overIndex = columnTasks.findIndex((task) => task.id === overId);

  return {
    status: overTask.status,
    position: overIndex >= 0 ? overIndex : columnTasks.length,
  };
}

export function applyOptimisticMove(tasks, activeId, { status, position }) {
  const activeTask = tasks.find((task) => task.id === activeId);
  if (!activeTask) return tasks;

  const grouped = groupTasksByStatus(tasks.filter((task) => task.id !== activeId));
  const updatedTask = { ...activeTask, status, position };
  grouped[status].splice(position, 0, updatedTask);

  return COLUMN_IDS.flatMap((columnId) =>
    grouped[columnId].map((task, index) => ({ ...task, status: columnId, position: index })),
  );
}
