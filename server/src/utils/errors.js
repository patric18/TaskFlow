export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export function isAppError(error) {
  return error instanceof AppError || error?.isOperational === true;
}

export function isPrismaUniqueViolation(error) {
  return error?.code === 'P2002';
}
