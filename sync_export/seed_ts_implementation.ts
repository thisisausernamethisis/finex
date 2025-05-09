// Implementation sample for prisma/seed.ts with deterministic IDs and UTC timezone

import { PrismaClient } from '@prisma/client';
import { createId } from 'cuid2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/en';

// Configure dayjs for deterministic timestamps
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('UTC');

const prisma = new PrismaClient();

// Deterministic ID generator when SEED_UID is set
const mkId = process.env.SEED_UID ? (() => createId({ length: 24 })) : undefined;

async function main() {
  console.log(`Seeding database... [deterministic: ${mkId ? 'YES' : 'NO'}]`);
  console.log(`Timezone: ${dayjs.tz.guess()}, Locale: ${dayjs.locale()}`);
  
  // Clear existing data if needed for clean seeding
  await prisma.$transaction([
    prisma.asset.deleteMany(),
    prisma.scenario.deleteMany(),
    prisma.theme.deleteMany(),
    prisma.card.deleteMany(),
    // Add other tables as needed
  ]);

  // Example: Create a theme with deterministic ID
  const theme = await prisma.theme.create({
    data: {
      id: mkId?.(), // Deterministic ID when SEED_UID is set, otherwise auto-generated
      name: 'Default Theme',
      description: 'System default theme',
      config: { primaryColor: '#007bff' },
      isActive: true,
      createdAt: dayjs().toDate(), // UTC timestamp
      updatedAt: dayjs().toDate()
    }
  });
  
  // Example: Create an asset with deterministic ID and reference to theme
  const asset = await prisma.asset.create({
    data: {
      id: mkId?.() || undefined,
      name: 'NVIDIA',
      symbol: 'NVDA',
      description: 'Technology company',
      themeId: theme.id,
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate()
    }
  });

  // Continue with other seed data...
  
  console.log('Database seeded successfully');
  
  // Optional: Log some sample IDs for verification
  if (process.env.SEED_UID) {
    console.log('Sample deterministic IDs:');
    console.log(`  Theme ID: ${theme.id}`);
    console.log(`  Asset ID: ${asset.id}`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
