import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { useBilling } from '../../hooks/useBilling.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

export default function BillingSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    plans,
    stripeConfigured,
    devBillingAvailable,
    isLoadingPlans,
    currentOrganization,
    isOwner,
    isPro,
    startCheckout,
    openPortal,
    devUpgrade,
    devDowngrade,
    isCheckingOut,
    isOpeningPortal,
    isDevUpgrading,
    isDevDowngrading,
    refreshOrganizations,
  } = useBilling();

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success('Subscription activated! Welcome to Pro.');
      refreshOrganizations();
      setSearchParams({}, { replace: true });
    }

    if (searchParams.get('canceled') === '1') {
      toast('Checkout canceled');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshOrganizations]);

  const handleUpgrade = async () => {
    try {
      if (devBillingAvailable && !stripeConfigured) {
        await devUpgrade();
        toast.success('Pro plan activated (dev mode)');
        refreshOrganizations();
        return;
      }

      await startCheckout();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to start checkout');
    }
  };

  const handleManage = async () => {
    try {
      if (devBillingAvailable && !stripeConfigured) {
        await devDowngrade();
        toast.success('Downgraded to Free (dev mode)');
        refreshOrganizations();
        return;
      }

      await openPortal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to open billing portal');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Billing</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {currentOrganization?.name} · Current plan:{' '}
          <Badge color={isPro ? 'green' : 'gray'}>{currentOrganization?.plan || 'FREE'}</Badge>
        </p>
      </div>

      {!stripeConfigured && devBillingAvailable && isOwner && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">Dev billing mode</p>
          <p className="mt-1 text-blue-800 dark:text-blue-300">
            Stripe is not configured, so you can activate Pro locally without payment. This only
            works in development — production always requires Stripe.
          </p>
        </div>
      )}

      {!stripeConfigured && !devBillingAvailable && isOwner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Stripe is not configured yet</p>
          <p className="mt-1 text-amber-800 dark:text-amber-300">
            Add real test keys to <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">server/.env</code>{' '}
            (<code>STRIPE_SECRET_KEY</code>, <code>STRIPE_PRO_PRICE_ID</code>,{' '}
            <code>STRIPE_WEBHOOK_SECRET</code>), restart the server, then try again.
          </p>
        </div>
      )}

      {!isOwner && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          Only the workspace owner can manage billing and subscriptions.
        </div>
      )}

      {isLoadingPlans ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan, index) => {
            const active = currentOrganization?.plan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex flex-col rounded-xl border p-6',
                  active
                    ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-600'
                    : 'border-gray-200 dark:border-gray-800',
                  'bg-white dark:bg-gray-900',
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  {active && <Badge color="green">Current</Badge>}
                  {plan.id === 'PRO' && !active && (
                    <Badge color="blue">Popular</Badge>
                  )}
                </div>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>

                <p className="mt-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-brand-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {plan.id === 'FREE' && active && (
                    <Button variant="secondary" className="w-full" disabled>
                      Current plan
                    </Button>
                  )}

                  {plan.id === 'PRO' && !isPro && isOwner && (
                    <Button
                      className="w-full"
                      loading={isCheckingOut || isDevUpgrading}
                      disabled={!stripeConfigured && !devBillingAvailable}
                      onClick={handleUpgrade}
                    >
                      {devBillingAvailable && !stripeConfigured
                        ? 'Activate Pro (dev)'
                        : 'Upgrade to Pro'}
                    </Button>
                  )}

                  {plan.id === 'PRO' && isPro && isOwner && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      loading={isOpeningPortal || isDevDowngrading}
                      disabled={!stripeConfigured && !devBillingAvailable}
                      onClick={handleManage}
                    >
                      {devBillingAvailable && !stripeConfigured
                        ? 'Downgrade to Free (dev)'
                        : 'Manage subscription'}
                    </Button>
                  )}

                  {plan.id === 'PRO' && !isOwner && (
                    <Button variant="secondary" className="w-full" disabled>
                      Owner manages billing
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {devBillingAvailable && !stripeConfigured
          ? 'Dev mode: plan changes are applied directly in the database. Use Stripe in production.'
          : 'Payments are processed securely by Stripe. Configure '}
        {!devBillingAvailable || stripeConfigured ? (
          <>
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">STRIPE_*</code> env vars for
            production checkout.
          </>
        ) : null}
      </p>
    </div>
  );
}
