import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing.js';
import { useOrganizations } from './useOrganizations.js';

export function useBilling() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganizations();
  const organizationId = currentOrganization?.id;
  const isOwner = currentOrganization?.role === 'OWNER';
  const isPro = currentOrganization?.plan === 'PRO';

  const plansQuery = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const { data } = await billingApi.getPlans();
      return data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => billingApi.checkout(organizationId),
    onSuccess: ({ data }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => billingApi.portal(organizationId),
    onSuccess: ({ data }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const devUpgradeMutation = useMutation({
    mutationFn: () => billingApi.devUpgrade(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
  });

  const devDowngradeMutation = useMutation({
    mutationFn: () => billingApi.devDowngrade(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
  });

  const refreshOrganizations = () => {
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
  };

  return {
    plans: plansQuery.data?.plans ?? [],
    stripeConfigured: plansQuery.data?.stripeConfigured ?? false,
    devBillingAvailable: plansQuery.data?.devBillingAvailable ?? false,
    isLoadingPlans: plansQuery.isLoading,
    currentOrganization,
    isOwner,
    isPro,
    startCheckout: checkoutMutation.mutateAsync,
    openPortal: portalMutation.mutateAsync,
    devUpgrade: devUpgradeMutation.mutateAsync,
    devDowngrade: devDowngradeMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
    isOpeningPortal: portalMutation.isPending,
    isDevUpgrading: devUpgradeMutation.isPending,
    isDevDowngrading: devDowngradeMutation.isPending,
    refreshOrganizations,
  };
}
