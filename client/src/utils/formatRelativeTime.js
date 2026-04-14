export function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) {
    return 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);

  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);

  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  const diffDay = Math.floor(diffHour / 24);

  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }

  return date.toLocaleDateString();
}
