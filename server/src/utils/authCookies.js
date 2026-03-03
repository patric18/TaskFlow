export function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    plan: user.plan,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    createdAt: user.createdAt,
  };
}

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_TOKEN_COOKIE, token, REFRESH_COOKIE_OPTIONS);
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
}
