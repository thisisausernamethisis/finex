// @ts-nocheck TODO(T-176): remove and tighten types
import { PrismaClient } from '@prisma/client'
import { customAlphabet } from 'nanoid'
import seedrandom from 'seedrandom'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/en'

// Configure dayjs for deterministic timestamps
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('UTC')

const prisma = new PrismaClient()

// Our own implementation of deterministic ID generation
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Counter to ensure uniqueness even with the same seed
let idCounter = 0;

// The main ID generation function
function mkId() {
  // If SEED_UID is set, use deterministic ID generation
  if (process.env.SEED_UID) {
    // Store the counter value before incrementing
    const counter = idCounter++;
    
    // We need to seed the same exact way each time
    const localRng = seedrandom(`${process.env.SEED_UID}_${counter}`);
    
    // Generate a truly deterministic ID
    let id = '';
    const len = ALPHABET.length;
    for (let i = 0; i < 24; i++) {
      id += ALPHABET[Math.floor(localRng() * len)];
    }
    return id;
  }
  
  // Otherwise, use nanoid's customAlphabet for non-deterministic IDs
  return customAlphabet(ALPHABET, 24)();
}

if (process.env.SEED_UID) {
  console.log(`Seeding with deterministic IDs (SEED_UID=${process.env.SEED_UID})`)
  console.log(`Timezone: ${dayjs.tz.guess()}, Locale: ${dayjs.locale()}`)
}

if (process.env.DEBUG_SEED === 'true') {
  /* eslint-disable no-console */
  console.log('Locale:', dayjs.locale()); // → "en"
}

async function main() {
  // Create a test user - use a fixed ID whether deterministic or not
  const userId = 'user_2NfBzXTP7UMgDtKs'
  
  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId
    }
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: userId,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate()
      }
    })
  }

  // Create assets
  const nvidia = await prisma.asset.create({
    data: {
      id: mkId(),
      name: 'NVIDIA',
      userId,
      themes: {
        create: [
          { id: mkId(), name: 'Growth', themeType: 'GROWTH', manualValue: 25.0 },
          { id: mkId(), name: 'Default Theme' }
        ]
      },
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate()
    }
  })

  const tesla = await prisma.asset.create({
    data: {
      id: mkId(),
      name: 'Tesla',
      userId,
      themes: {
        create: [
          { id: mkId(), name: 'Growth', themeType: 'GROWTH', manualValue: 18.5 },
          { id: mkId(), name: 'Default Theme' }
        ]
      },
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate()
    }
  })

  const bitcoin = await prisma.asset.create({
    data: {
      id: mkId(),
      name: 'Bitcoin',
      userId,
      themes: {
        create: [
          { id: mkId(), name: 'Growth', themeType: 'GROWTH', manualValue: 30.0 },
          { id: mkId(), name: 'Default Theme' }
        ]
      },
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate()
    }
  })

  // Create scenarios
  const recession = await prisma.scenario.create({
    data: {
      id: mkId(),
      name: 'Global Recession',
      description: 'A severe economic downturn affecting global markets',
      probability: 0.35,
      themes: {
        create: [
          { id: mkId(), name: 'Impact Analysis', description: 'How recession affects markets' },
          { id: mkId(), name: 'Probability', themeType: 'PROBABILITY', manualValue: 35.0 }
        ]
      },
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate()
    }
  })

  const chinaTaiwan = await prisma.scenario.create({
    data: {
      id: mkId(),
      name: 'China invades Taiwan',
      description: 'A military conflict in the South China Sea',
      probability: 0.15,
      themes: {
        create: [
          { id: mkId(), name: 'Geopolitical Impact', description: 'Political implications worldwide' },
          { id: mkId(), name: 'Probability', themeType: 'PROBABILITY', manualValue: 15.0 }
        ]
      },
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate()
    }
  })

  // Create some cards and chunks
  const nvidiaTheme = await prisma.theme.findFirst({
    where: {
      name: 'Default Theme',
      assetId: nvidia.id
    }
  })

  if (nvidiaTheme) {
    const nvidiaCard = await prisma.card.create({
      data: {
        id: mkId(),
        title: 'NVIDIA Earnings Report Q1 2025',
        content: 'NVIDIA reported a 220% increase in revenue year over year, driven by AI chip demand.',
        importance: 5,
        source: 'Financial Times',
        themeId: nvidiaTheme.id,
        chunks: {
          create: [
            {
              id: mkId(),
              content: 'NVIDIA reported a 220% increase in revenue year over year.',
              order: 1,
            },
            {
              id: mkId(),
              content: 'AI chip demand continues to outpace supply, with data center revenue quadrupling.',
              order: 2,
            }
          ]
        },
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate()
      }
    })
  }

  // Create matrix results
  await prisma.matrixAnalysisResult.create({
    data: {
      assetId: nvidia.id,
      scenarioId: recession.id,
      impact: -2,
      summary: 'NVIDIA would face moderate negative impact in a global recession scenario, with potential recovery due to AI demand.',
      evidenceIds: 'card_1,card_2',
      status: 'completed',
      completedAt: new Date()
    }
  })

  await prisma.matrixAnalysisResult.create({
    data: {
      assetId: tesla.id,
      scenarioId: recession.id,
      impact: -4,
      summary: 'Tesla would face significant negative impact in a recession scenario due to reduced consumer spending.',
      evidenceIds: 'card_3,card_4',
      status: 'completed',
      completedAt: new Date()
    }
  })

  await prisma.matrixAnalysisResult.create({
    data: {
      assetId: bitcoin.id,
      scenarioId: recession.id,
      impact: -3,
      summary: 'Bitcoin may initially see negative impact in recession, but could become a hedge asset.',
      evidenceIds: 'card_5,card_6',
      status: 'completed',
      completedAt: new Date()
    }
  })

  // Add template seed data
  if (!process.env.SKIP_TEMPLATE_SEED) {
    await prisma.asset.create({
      data: {
        id: mkId(),
        name: 'Demo Template',
        kind: 'TEMPLATE',
        isPublic: true,
        userId,
        themes: {
          create: [
            { id: mkId(), name: 'Template Intro' }
          ]
        },
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate()
      }
    });

    await prisma.themeTemplate.create({
      data: {
        id: mkId(),
        ownerId: userId,
        name: 'Competitive Analysis',
        isPublic: true,
        payload: {
          theme: { name: 'Competitive Analysis' },
          cards: []
        },
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate()
      }
    });
  }

  console.log('Database has been seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
