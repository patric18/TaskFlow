import { cn } from '../../utils/cn.js';

const colors = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export function Badge({ children, color = 'gray', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[color] || colors.gray,
        className,
      )}
    >
      {children}
    </span>
  );
}

export const PRIORITY_BADGE = {
  LOW: { label: 'Low', color: 'gray' },
  MEDIUM: { label: 'Medium', color: 'blue' },
  HIGH: { label: 'High', color: 'yellow' },
  URGENT: { label: 'Urgent', color: 'red' },
};
