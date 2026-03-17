import { z } from 'zod';

export const billingOrganizationSchema = z.object({
  organizationId: z.string().min(1, 'organizationId is required'),
});
