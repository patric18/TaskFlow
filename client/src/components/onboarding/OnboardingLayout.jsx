import { Link } from 'react-router-dom';
import { ThemeToggle } from '../theme/ThemeToggle.jsx';
import { cn } from '../../utils/cn.js';

const STEPS = [
  { number: 1, label: 'Workspace' },
  { number: 2, label: 'Project' },
  { number: 3, label: 'Team' },
];

export function OnboardingLayout({ currentStep, children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-semibold text-brand-600">
            TaskFlow
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Onboarding progress" className="mb-10">
          <ol className="flex items-center justify-between gap-2">
            {STEPS.map((step, index) => {
              const active = currentStep === step.number;
              const completed = currentStep > step.number;

              return (
                <li key={step.number} className="flex flex-1 items-center">
                  <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        completed && 'bg-brand-600 text-white',
                        active && !completed && 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
                        !active && !completed && 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      {completed ? '✓' : step.number}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium sm:text-sm',
                        active || completed
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400',
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'mx-2 hidden h-px flex-1 sm:block',
                        completed ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-800',
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {children}
      </main>
    </div>
  );
}
