import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});
