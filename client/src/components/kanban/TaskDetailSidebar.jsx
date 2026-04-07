import { KANBAN_COLUMNS } from '../../utils/kanban.js';
import { Avatar } from '../ui/Avatar.jsx';
import { TaskActivity } from './TaskActivity.jsx';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function TaskDetailSidebar({
  form,
  onChange,
  members,
  task,
  comments,
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</label>
        <select
          value={form.status}
          onChange={(e) => onChange('status', e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {KANBAN_COLUMNS.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Priority</label>
        <select
          value={form.priority}
          onChange={(e) => onChange('priority', e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Assignee</label>
        <select
          value={form.assigneeId || ''}
          onChange={(e) => onChange('assigneeId', e.target.value || null)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Unassigned</option>
          {members?.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </select>
        {task?.assignee && (
          <div className="flex items-center gap-2 pt-1">
            <Avatar name={task.assignee.name} src={task.assignee.avatar} size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{task.assignee.name}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Due date</label>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => onChange('dueDate', e.target.value || null)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Labels</label>
        <p className="text-sm text-gray-500 dark:text-gray-400">Label management coming in a future update.</p>
      </div>

      <TaskActivity task={task} comments={comments} />
    </div>
  );
}
