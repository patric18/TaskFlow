import { cn } from '../../utils/cn.js';

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ name, src, className, size = 'sm' }) {
  const sizes = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
        'dark:bg-brand-950 dark:text-brand-300',
        sizes[size],
        className,
      )}
      title={name}
    >
      {getInitials(name || '?')}
    </span>
  );
}
