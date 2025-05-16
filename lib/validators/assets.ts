import { z } from 'zod';
import { AssetKind } from '@prisma/client';

export const AssetUpsert = z.object({
  name: z.string().min(3).max(100),
  kind: z.nativeEnum(AssetKind),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  growthValue: z.number().optional().nullable(),
  sourceTemplateId: z.string().optional().nullable()
});

export type AssetUpsertData = z.infer<typeof AssetUpsert>;
