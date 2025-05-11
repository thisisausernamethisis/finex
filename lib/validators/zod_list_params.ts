import { z } from 'zod';
import { booleanFromString } from './transforms';

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
  // Use standard boolean transformer that handles 'false' string correctly
  mine : booleanFromString.optional() // This can now use optional() because booleanFromString is a Zod schema
});

export type ListParams = z.infer<typeof ListParamsSchema>;
