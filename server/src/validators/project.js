import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  organizationId: z.string().min(1, 'organizationId is required'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required').max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listProjectsQuerySchema = z.object({
  organizationId: z.string().min(1, 'organizationId is required'),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
