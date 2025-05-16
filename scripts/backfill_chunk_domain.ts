import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function backfillChunkDomain() {
  console.log('▶ Back-fill Chunk.domain …');

  await prisma.$executeRawUnsafe(`
    UPDATE "Chunk" c
    SET    "domain" = 'ASSET'
    FROM   "Card" cr
    JOIN   "Theme" t ON t.id = cr."themeId"
    WHERE  c."cardId" = cr.id
      AND  t."assetId" IS NOT NULL
      AND  c."domain" = 'OTHER'
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Chunk" c
    SET    "domain" = 'GEOGRAPHY'
    FROM   "Card" cr
    JOIN   "Theme" t ON t.id = cr."themeId"
    WHERE  c."cardId" = cr.id
      AND  t."scenarioId" IS NOT NULL
      AND  c."domain" = 'OTHER'
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Chunk"
    SET    "domain" = 'SUPPLY_CHAIN'
    WHERE  "domain" = 'OTHER'
      AND  content ILIKE ANY (ARRAY['%supply chain%','%logistics%','%inventory%'])
  `);

  // Use raw SQL for count since Prisma client might not be updated yet with the new domain field
  const countResult = await prisma.$queryRaw<[{count: number}]>`
    SELECT COUNT(*) as count FROM "Chunk" WHERE "domain" = 'OTHER'
  `;
  const remaining = countResult[0].count;
  console.log(`✓ Back-fill done; OTHER left: ${remaining}`);
  await prisma.$disconnect();
}
