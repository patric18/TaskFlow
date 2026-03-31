import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn.js';
import { useProjects } from '../../hooks/useProjects.js';
import { useOrganizations } from '../../hooks/useOrganizations.js';
import { Skeleton } from '../ui/Skeleton.jsx';
import { Button } from '../ui/Button.jsx';
import { CreateProjectModal } from '../projects/CreateProjectModal.jsx';

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { currentOrganization } = useOrganizations();
  const { projects, isLoading, createProject, isCreating } = useProjects();

  const canManage = currentOrganization?.role !== 'MEMBER';

  const handleCreate = async (payload) => {
    await createProject(payload);
    toast.success('Project created');
  };

  return (
    <>
      <aside
        className={cn(
          'flex h-[calc(100vh-3.5rem)] flex-col border-r border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-gray-900',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-800">
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
                Workspace
              </p>
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {currentOrganization?.name || 'Loading...'}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!collapsed && (
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Projects
              </span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  + New
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <nav className="space-y-1">
              {projects.map((project) => {
                const active = location.pathname === `/projects/${project.id}`;

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    title={project.name}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                      collapsed && 'justify-center',
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {!collapsed && <span className="truncate">{project.name}</span>}
                  </Link>
                );
              })}

              {!collapsed && projects.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-gray-500">No projects yet</p>
              )}
            </nav>
          )}
        </div>

        {!collapsed && canManage && (
          <div className="border-t border-gray-200 p-2 dark:border-gray-800">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setShowCreate(true)}
            >
              + Create project
            </Button>
          </div>
        )}
      </aside>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        loading={isCreating}
      />
    </>
  );
}
