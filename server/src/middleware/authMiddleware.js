import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from './asyncHandler.js';

export const authMiddleware = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.slice(7);

  if (!token || token.split('.').length !== 3) {
    throw new AppError('Invalid token', 401);
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }

    throw new AppError('Invalid token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      plan: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid token', 401);
  }

  req.user = user;
  next();
});

export { jwt };
