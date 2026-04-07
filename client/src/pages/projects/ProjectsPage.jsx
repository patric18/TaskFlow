import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useProjects } from '../../hooks/useProjects.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal.jsx';

export default function ProjectsPage() {
  const { projects, isLoading, createProject, isCreating, currentOrganization } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const canManage = currentOrganization?.role !== 'MEMBER';

  const handleCreate = async (payload) => {
    await createProject(payload);
    toast.success('Project created');
  };

  return (
    <div className="page-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {currentOrganization?.name}
          </p>
        </div>
        {canManage && <Button onClick={() => setShowCreate(true)}>+ New project</Button>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start organizing tasks."
          action={
            canManage ? (
              <Button onClick={() => setShowCreate(true)}>Create project</Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/projects/${project.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                      {project.name}
                    </h2>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                        {project.description}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-gray-400">
                      {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        loading={isCreating}
      />
    </div>
  );
}
