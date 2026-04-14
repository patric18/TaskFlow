import { useTheme } from '../../hooks/useTheme.js';
import { cn } from '../../utils/cn.js';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm font-medium transition',
            theme === option.value
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-950 dark:text-brand-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
