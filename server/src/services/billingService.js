import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { getStripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/errors.js';
import { PLAN_LIMITS } from './planService.js';
import { getMembership } from './organizationService.js';

export const BILLING_PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'For small teams getting started',
    features: [
      '1 organization',
      'Up to 3 projects',
      'Up to 5 team members',
      'Kanban boards & tasks',
    ],
    limits: PLAN_LIMITS.FREE,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 12,
    interval: 'month',
    description: 'For growing teams that need more',
    features: [
      'Unlimited projects',
      'Unlimited team members',
      'File uploads (10MB)',
      'Advanced analytics',
      'Priority support',
    ],
    limits: PLAN_LIMITS.PRO,
    priceId: env.STRIPE_PRO_PRICE_ID,
  },
];

export function isDevBillingAvailable() {
  if (env.NODE_ENV === 'production') {
    return false;
  }

  if (env.BILLING_DEV_MODE) {
    return true;
  }

  return !isStripeConfigured();
}

export function getBillingPlans() {
  return {
    plans: BILLING_PLANS,
    stripeConfigured: isStripeConfigured(),
    devBillingAvailable: isDevBillingAvailable(),
  };
}

async function requireOrgOwner(userId, organizationId) {
  const membership = await getMembership(userId, organizationId);

  if (membership.role !== 'OWNER') {
    throw new AppError('Only the organization owner can manage billing', 403);
  }

  return membership;
}

async function getOrCreateStripeCustomer(userId) {
  const stripe = getStripe();
  if (!stripe) {
    throw new AppError('Stripe is not configured', 503);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(userId, { organizationId }) {
  if (!isStripeConfigured()) {
    throw new AppError('Stripe billing is not configured on this server', 503);
  }

  const membership = await requireOrgOwner(userId, organizationId);
  const organization = membership.organization;

  if (organization.plan === 'PRO') {
    throw new AppError('Organization is already on the Pro plan', 400);
  }

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${env.CLIENT_URL}/settings/billing?success=1`,
    cancel_url: `${env.CLIENT_URL}/settings/billing?canceled=1`,
    metadata: { organizationId, userId },
    subscription_data: {
      metadata: { organizationId },
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function createPortalSession(userId, { organizationId }) {
  if (!isStripeConfigured()) {
    throw new AppError('Stripe billing is not configured on this server', 503);
  }

  const membership = await requireOrgOwner(userId, organizationId);
  const organization = membership.organization;

  if (!organization.stripeSubscriptionId) {
    throw new AppError('No active subscription found for this organization', 400);
  }

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.CLIENT_URL}/settings/billing`,
  });

  return { url: session.url };
}

export async function devUpgradeToPro(userId, { organizationId }) {
  if (!isDevBillingAvailable()) {
    throw new AppError('Dev billing is not available', 403);
  }

  await requireOrgOwner(userId, organizationId);

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  if (organization.plan === 'PRO') {
    throw new AppError('Organization is already on the Pro plan', 400);
  }

  await upgradeOrganizationToPro(organizationId, 'dev_subscription');

  return { plan: 'PRO', mode: 'dev' };
}

export async function devDowngradeToFree(userId, { organizationId }) {
  if (!isDevBillingAvailable()) {
    throw new AppError('Dev billing is not available', 403);
  }

  await requireOrgOwner(userId, organizationId);

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  if (organization.plan === 'FREE') {
    throw new AppError('Organization is already on the Free plan', 400);
  }

  await downgradeOrganizationToFree(organizationId);

  return { plan: 'FREE', mode: 'dev' };
}

async function upgradeOrganizationToPro(organizationId, subscriptionId) {
  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        plan: 'PRO',
        stripeSubscriptionId: subscriptionId,
      },
    });

    const ownerMembership = await tx.organizationMember.findFirst({
      where: { organizationId, role: 'OWNER' },
    });

    if (ownerMembership) {
      await tx.user.update({
        where: { id: ownerMembership.userId },
        data: { plan: 'PRO' },
      });

      await tx.notification.create({
        data: {
          userId: ownerMembership.userId,
          type: 'PLAN_UPGRADED',
          message: 'Your workspace was upgraded to Pro',
          metadata: { organizationId },
        },
      });
    }
  });
}

async function downgradeOrganizationToFree(organizationId) {
  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        plan: 'FREE',
        stripeSubscriptionId: null,
      },
    });

    const ownerMembership = await tx.organizationMember.findFirst({
      where: { organizationId, role: 'OWNER' },
    });

    if (ownerMembership) {
      await tx.user.update({
        where: { id: ownerMembership.userId },
        data: { plan: 'FREE' },
      });
    }
  });
}

async function isEventProcessed(eventId) {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId },
  });

  return Boolean(existing);
}

async function markEventProcessed(eventId) {
  await prisma.stripeWebhookEvent.create({
    data: { eventId },
  });
}

export async function handleStripeWebhook(rawBody, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_xxx')) {
    throw new AppError('Stripe webhook secret is not configured', 503);
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new AppError('Stripe is not configured', 503);
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError('Invalid Stripe webhook signature', 400);
  }

  if (await isEventProcessed(event.id)) {
    return { received: true, duplicate: true };
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId && ['active', 'trialing'].includes(subscription.status)) {
        await upgradeOrganizationToPro(organizationId, subscription.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId) {
        await downgradeOrganizationToFree(organizationId);
      } else {
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (org) {
          await downgradeOrganizationToFree(org.id);
        }
      }
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object;
      const organizationId = session.metadata?.organizationId;
      const subscriptionId = session.subscription;

      if (organizationId && subscriptionId) {
        await upgradeOrganizationToPro(organizationId, subscriptionId);
      }
      break;
    }

    default:
      break;
  }

  await markEventProcessed(event.id);

  return { received: true, duplicate: false };
}
