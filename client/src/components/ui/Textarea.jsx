import { cn } from '../../utils/cn.js';

export function Textarea({ className, label, error, id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'flex min-h-[96px] w-full rounded-lg border bg-white px-3 py-2 text-sm',
          'text-gray-900 placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
          error ? 'border-red-500' : 'border-gray-300',
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
