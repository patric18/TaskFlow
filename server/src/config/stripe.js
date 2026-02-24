import Stripe from 'stripe';
import { env } from './env.js';

let stripeClient = null;

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.startsWith('sk_test_xxx')) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(getStripe() && env.STRIPE_PRO_PRICE_ID && !env.STRIPE_PRO_PRICE_ID.startsWith('price_xxx'));
}
