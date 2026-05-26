import { Link } from 'react-router-dom';
import { useOrganizations } from '../../hooks/useOrganizations.js';
import { Button } from '../ui/Button.jsx';

export function PlanGuard({ feature = 'fileUpload', children }) {
  const { currentOrganization } = useOrganizations();
  const isPro = currentOrganization?.plan === 'PRO';

  const blocked =
    (feature === 'fileUpload' && !isPro) ||
    (feature === 'analytics' && !isPro);

  if (!blocked) {
    return children;
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center dark:border-brand-900 dark:bg-brand-950/30">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Upgrade to Pro
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        This feature requires a Pro subscription.
      </p>
      <Link to="/settings/billing" className="mt-4 inline-block">
        <Button>View plans</Button>
      </Link>
    </div>
  );
}
