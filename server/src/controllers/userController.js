import * as userService from '../services/userService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user.id);
  res.json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user.id, req.body);
  res.json({ user });
});

export const completeOnboarding = asyncHandler(async (req, res) => {
  const user = await userService.completeOnboarding(req.user.id);
  res.json({ user });
});
