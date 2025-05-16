import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Container, TOKEN_PRISMA } from '../../lib/container';
import { TEST_USER_ID } from '../contract/constants';

// Basic seed function since buildTestSeed isn't available
async function buildTestSeed(prisma: PrismaClient) {
  // Create test user
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: { id: TEST_USER_ID }
  });
  
  // Create a sample asset to verify database setup
  const assetExists = await prisma.asset.findFirst({
    where: { userId: TEST_USER_ID }
  });
  
  if (!assetExists) {
    await prisma.asset.create({
      data: {
        name: 'Test Asset',
        description: 'Created during SQLite test setup',
        userId: TEST_USER_ID
      }
    });
  }
  
  console.log('Test database seeded successfully');
}

export default async () => {
  process.env.DATABASE_URL = 'file:./finex_test.db';
  execSync('prisma migrate deploy --schema=prisma/schema.test.prisma', { stdio: 'inherit' });

  const prisma = new PrismaClient();
  await buildTestSeed(prisma);
  Container.set(TOKEN_PRISMA, prisma);
};
