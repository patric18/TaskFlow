import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
});
