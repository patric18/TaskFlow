import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError, isPrismaUniqueViolation } from '../utils/errors.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import {
  generateSecureToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../utils/password.js';
import {
  getPasswordResetExpiryDate,
  getRefreshTokenExpiryDate,
  signAccessToken,
} from '../utils/jwt.js';
import { sanitizeUser } from '../utils/authCookies.js';
import { createDefaultOrganization } from './organizationService.js';

async function createRefreshToken(userId) {
  const rawToken = generateSecureToken();
  const hashedToken = hashToken(rawToken);

  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt: getRefreshTokenExpiryDate(),
    },
  });

  return rawToken;
}

async function issueAuthSession(userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = await createRefreshToken(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

export async function registerUser({ email, password, name }) {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
      },
    });

    await createDefaultOrganization(user.id, user.name);

    const session = await issueAuthSession(user.id);
    return session;
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      throw new AppError('Email already exists', 409);
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await verifyPassword(password, user.password);

  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  return issueAuthSession(user.id);
}

export async function refreshSession(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  const hashedToken = hashToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.usedAt) {
    await prisma.refreshToken.deleteMany({ where: { userId: storedToken.userId } });
    throw new AppError('Refresh token already used', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { usedAt: new Date() },
  });

  return issueAuthSession(storedToken.userId);
}

export async function logoutUser(rawRefreshToken) {
  if (!rawRefreshToken) {
    return;
  }

  const hashedToken = hashToken(rawRefreshToken);

  await prisma.refreshToken.updateMany({
    where: { token: hashedToken, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export async function forgotPassword({ email }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return;
  }

  const rawToken = generateSecureToken();
  const hashedToken = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt: getPasswordResetExpiryDate(),
    },
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });
}

export async function resetPassword({ token, password }) {
  const hashedToken = hashToken(token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (resetRecord.usedAt) {
    throw new AppError('Reset token already used', 400);
  }

  if (resetRecord.expiresAt < new Date()) {
    throw new AppError('Reset token expired', 400);
  }

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: resetRecord.userId },
    }),
  ]);
}
