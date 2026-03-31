import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../theme/ThemeToggle.jsx';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-brand-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              TF
            </span>
            TaskFlow
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">{footer}</div>
        )}
      </motion.div>
    </div>
  );
}
