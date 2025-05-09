import { z } from 'zod';

/**
 * Standard pagination / search schema:
 *  page   – 1-based positive integer (default 1)
 *  limit  – max 100 (default 20)
 *  q      – optional search string
 *  mine   – optional boolean flag
 */
export const ListParamsSchema = z.object({
  page : z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q    : z.string().trim().max(100).optional(),
  mine : z.coerce.boolean().optional()
});

export type ListParams = z.infer<typeof ListParamsSchema>;
