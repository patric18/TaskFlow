import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProject, useProjects } from '../../hooks/useProjects.js';
import { KanbanBoard } from '../../components/kanban/KanbanBoard.jsx';
import { TaskDetailModal } from '../../components/kanban/TaskDetailModal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { PROJECT_COLORS } from '../../components/projects/CreateProjectModal.jsx';

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading } = useProject(id);
  const { updateProject, deleteProject, isUpdating, isDeleting, currentOrganization } =
    useProjects();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const canManage = currentOrganization?.role !== 'MEMBER';

  useEffect(() => {
    const taskFromUrl = searchParams.get('task');

    if (taskFromUrl) {
      setSelectedTaskId(taskFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openEdit = () => {
    setName(project.name);
    setDescription(project.description || '');
    setColor(project.color);
    setShowEdit(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      await updateProject({ id, name, description, color });
      toast.success('Project updated');
      setShowEdit(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <p className="text-gray-600 dark:text-gray-400">Project not found.</p>
        <Link to="/projects" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-2 h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
              {project.description && (
                <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={openEdit}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <KanbanBoard projectId={id} onTaskClick={(task) => setSelectedTaskId(task.id)} />
      </div>

      <TaskDetailModal
        taskId={selectedTaskId}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        organizationId={currentOrganization?.id}
        projectId={id}
      />

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit project">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 dark:ring-offset-gray-900 ${
                  color === c ? 'ring-brand-500' : 'ring-transparent'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isUpdating}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete project?">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          This will permanently delete <strong>{project.name}</strong> and all its tasks. This
          action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="destructive" loading={isDeleting} onClick={handleDelete}>
            Delete project
          </Button>
        </div>
      </Modal>
    </div>
  );
}
