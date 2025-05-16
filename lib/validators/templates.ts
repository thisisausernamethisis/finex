import { z } from 'zod';

export const TemplateUpsert = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  payload: z.record(z.any()).optional()
});

export type TemplateUpsertData = z.infer<typeof TemplateUpsert>;
