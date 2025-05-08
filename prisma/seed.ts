import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create a test user
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
        id: userId
      }
    })
  }

  // Create assets
  const nvidia = await prisma.asset.create({
    data: {
      name: 'NVIDIA',
      userId,
      themes: {
        create: [
          { name: 'Growth', themeType: 'GROWTH', manualValue: 25.0 },
          { name: 'Default Theme' }
        ]
      }
    }
  })

  const tesla = await prisma.asset.create({
    data: {
      name: 'Tesla',
      userId,
      themes: {
        create: [
          { name: 'Growth', themeType: 'GROWTH', manualValue: 18.5 },
          { name: 'Default Theme' }
        ]
      }
    }
  })

  const bitcoin = await prisma.asset.create({
    data: {
      name: 'Bitcoin',
      userId,
      themes: {
        create: [
          { name: 'Growth', themeType: 'GROWTH', manualValue: 30.0 },
          { name: 'Default Theme' }
        ]
      }
    }
  })

  // Create scenarios
  const recession = await prisma.scenario.create({
    data: {
      name: 'Global Recession',
      description: 'A severe economic downturn affecting global markets',
      probability: 0.35,
      themes: {
        create: [
          { name: 'Impact Analysis', description: 'How recession affects markets' },
          { name: 'Probability', themeType: 'PROBABILITY', manualValue: 35.0 }
        ]
      }
    }
  })

  const chinaTaiwan = await prisma.scenario.create({
    data: {
      name: 'China invades Taiwan',
      description: 'A military conflict in the South China Sea',
      probability: 0.15,
      themes: {
        create: [
          { name: 'Geopolitical Impact', description: 'Political implications worldwide' },
          { name: 'Probability', themeType: 'PROBABILITY', manualValue: 15.0 }
        ]
      }
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
        title: 'NVIDIA Earnings Report Q1 2025',
        content: 'NVIDIA reported a 220% increase in revenue year over year, driven by AI chip demand.',
        importance: 5,
        source: 'Financial Times',
        themeId: nvidiaTheme.id,
        chunks: {
          create: [
            {
              content: 'NVIDIA reported a 220% increase in revenue year over year.',
              order: 1,
            },
            {
              content: 'AI chip demand continues to outpace supply, with data center revenue quadrupling.',
              order: 2,
            }
          ]
        }
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
        name: 'Demo Template',
        kind: 'TEMPLATE',
        isPublic: true,
        userId,
        themes: {
          create: [
            { name: 'Template Intro' }
          ]
        }
      }
    });

    await prisma.themeTemplate.create({
      data: {
        ownerId: userId,
        name: 'Competitive Analysis',
        isPublic: true,
        payload: {
          theme: { name: 'Competitive Analysis' },
          cards: []
        }
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
