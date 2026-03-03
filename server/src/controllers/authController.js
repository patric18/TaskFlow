import * as authService from '../services/authService.js';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
} from '../utils/authCookies.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.registerUser(req.body);

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({ accessToken, user });
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body);

  setRefreshTokenCookie(res, refreshToken);

  res.json({ accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.cookies[REFRESH_TOKEN_COOKIE]);
  clearRefreshTokenCookie(res);

  res.json({ message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.refreshSession(
    req.cookies[REFRESH_TOKEN_COOKIE],
  );

  setRefreshTokenCookie(res, refreshToken);

  res.json({ accessToken });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);

  res.json({
    message: 'If an account exists with that email, a reset link has been sent',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);

  res.json({ message: 'Password reset successfully' });
});
