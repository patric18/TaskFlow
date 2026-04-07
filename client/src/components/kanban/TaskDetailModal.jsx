import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { RichTextEditor } from '../ui/RichTextEditor.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { useTask, useTasks } from '../../hooks/useTasks.js';
import { useComments } from '../../hooks/useComments.js';
import { useOrganizationMembers } from '../../hooks/useOrganizationMembers.js';
import { TaskComments } from './TaskComments.jsx';
import { TaskDetailSidebar } from './TaskDetailSidebar.jsx';

function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function TaskDetailModal({ taskId, open, onClose, organizationId, projectId }) {
  const { data: task, isLoading } = useTask(taskId, open);
  const { comments } = useComments(taskId, open);
  const { data: members } = useOrganizationMembers(organizationId, open);
  const { updateTask, isUpdating } = useTasks(projectId);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: null,
    dueDate: '',
  });

  useEffect(() => {
    if (!task) return;

    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      dueDate: toDateInputValue(task.dueDate),
    });
  }, [task]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!taskId || !form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await updateTask({
        id: taskId,
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      toast.success('Task saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          {isLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <Input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              placeholder="Task title"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid flex-1 overflow-y-auto md:grid-cols-3">
          <div className="space-y-6 border-b border-gray-200 p-6 md:col-span-2 md:border-b-0 md:border-r dark:border-gray-800">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(html) => handleChange('description', html)}
                  />
                </div>
                <TaskComments taskId={taskId} enabled={open} />
              </>
            )}
          </div>

          <div className="p-6">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <TaskDetailSidebar
                form={form}
                onChange={handleChange}
                members={members}
                task={task}
                comments={comments}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} loading={isUpdating}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
