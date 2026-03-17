import * as billingService from '../services/billingService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export const getPlans = asyncHandler(async (_req, res) => {
  res.json(billingService.getBillingPlans());
});

export const createCheckout = asyncHandler(async (req, res) => {
  const session = await billingService.createCheckoutSession(req.user.id, req.body);
  res.json(session);
});

export const createPortal = asyncHandler(async (req, res) => {
  const session = await billingService.createPortalSession(req.user.id, req.body);
  res.json(session);
});

export const devUpgrade = asyncHandler(async (req, res) => {
  const result = await billingService.devUpgradeToPro(req.user.id, req.body);
  res.json(result);
});

export const devDowngrade = asyncHandler(async (req, res) => {
  const result = await billingService.devDowngradeToFree(req.user.id, req.body);
  res.json(result);
});

export const stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      throw new AppError('Missing Stripe signature header', 400);
    }

    const result = await billingService.handleStripeWebhook(req.body, signature);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
