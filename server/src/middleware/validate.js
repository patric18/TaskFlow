import { z } from 'zod';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.errors[0];
      return res.status(400).json({
        message: firstError?.message || 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const firstError = result.error.errors[0];
      return res.status(400).json({
        message: firstError?.message || 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    req.query = result.data;
    next();
  };
}

export { z };
