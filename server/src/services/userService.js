import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { sanitizeUser } from '../utils/authCookies.js';

export async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
}

export async function updateUserProfile(userId, { name }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
    },
  });

  return sanitizeUser(user);
}

export async function completeOnboarding(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: new Date() },
  });

  return sanitizeUser(user);
}
