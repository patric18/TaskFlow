export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
