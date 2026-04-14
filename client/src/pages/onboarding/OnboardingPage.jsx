import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PROJECT_COLORS } from '../../components/projects/CreateProjectModal.jsx';
import { useOrganizations } from '../../hooks/useOrganizations.js';
import { useProjects } from '../../hooks/useProjects.js';
import { useTeam } from '../../hooks/useTeam.js';
import { organizationsApi } from '../../api/projects.js';
import { usersApi } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';
import { useQueryClient } from '@tanstack/react-query';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const { currentOrganization, isLoading: orgLoading, setCurrentOrganizationId } =
    useOrganizations();
  const { createProject, isCreating } = useProjects();
  const { inviteMember, isInviting } = useTeam();

  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (currentOrganization?.name && !workspaceName) {
      setWorkspaceName(currentOrganization.name);
    }
  }, [currentOrganization?.name, workspaceName]);

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  if (orgLoading) {
    return (
      <OnboardingLayout currentStep={1}>
        <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your workspace…</p>
        </div>
      </OnboardingLayout>
    );
  }

  const finishOnboarding = async (destination) => {
    setFinishing(true);

    try {
      const { data } = await usersApi.completeOnboarding();
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Welcome to TaskFlow!');
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete setup');
      setFinishing(false);
    }
  };

  const handleWorkspaceSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const name = workspaceName.trim();

    if (!name) {
      setError('Workspace name is required');
      return;
    }

    if (!currentOrganization?.id) {
      setError('No workspace found. Try refreshing the page.');
      return;
    }

    try {
      await organizationsApi.update(currentOrganization.id, { name });
      setCurrentOrganizationId(currentOrganization.id);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workspace');
    }
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const name = projectName.trim();

    if (!name) {
      setError('Project name is required');
      return;
    }

    try {
      const { data } = await createProject({
        name,
        description: projectDescription,
        color: projectColor,
      });
      setCreatedProjectId(data.project.id);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const email = inviteEmail.trim();

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      await inviteMember({ email, role: 'MEMBER' });
      const destination = createdProjectId
        ? `/projects/${createdProjectId}`
        : '/dashboard';
      await finishOnboarding(destination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const handleSkipInvite = async () => {
    const destination = createdProjectId ? `/projects/${createdProjectId}` : '/dashboard';
    await finishOnboarding(destination);
  };

  return (
    <OnboardingLayout currentStep={step}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8"
        >
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Name your workspace
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This is where your team&apos;s projects live. You can change it later in settings.
              </p>

              <form onSubmit={handleWorkspaceSubmit} className="mt-6 space-y-4">
                {error && <ErrorBanner message={error} />}
                <Input
                  label="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Inc."
                  autoFocus
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit">Continue</Button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create your first project
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Projects organize tasks on kanban boards. Most teams start with one main project.
              </p>

              <form onSubmit={handleProjectSubmit} className="mt-6 space-y-4">
                {error && <ErrorBanner message={error} />}
                <Input
                  label="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Product Launch"
                  autoFocus
                />
                <Textarea
                  label="Description (optional)"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What are you working on?"
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Select color ${color}`}
                        className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110 dark:ring-offset-gray-900 ${
                          projectColor === color ? 'ring-brand-500' : 'ring-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setProjectColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" loading={isCreating}>
                    Continue
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Invite a teammate
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                TaskFlow works best with your team. They need a TaskFlow account before you can
                invite them by email.
              </p>

              <form onSubmit={handleInviteSubmit} className="mt-6 space-y-4">
                {error && <ErrorBanner message={error} />}
                <Input
                  label="Teammate email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  autoFocus
                />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      loading={finishing}
                      onClick={handleSkipInvite}
                    >
                      Skip for now
                    </Button>
                    <Button type="submit" loading={isInviting || finishing}>
                      Send invite & finish
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
      {message}
    </div>
  );
}
