import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your dashboard overview. Open a project from the sidebar or{' '}
          <Link to="/projects" className="font-medium text-brand-600 hover:underline">
            view all projects
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Tasks due today', value: '—' },
            { label: 'Overdue', value: '—' },
            { label: 'Completed this week', value: '—' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
