import { PrismaClient, TechnologyCategory, ScenarioType, ThemeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with technology-focused data...')

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { id: 'user_test123' },
    update: {},
    create: {
      id: 'user_test123',
    },
  })

  console.log('✅ Created test user:', testUser.id)

  // Create technology-focused assets
  const assets = [
    {
      name: 'NVIDIA Corporation',
      description: 'Leading AI compute infrastructure and semiconductor company',
      category: TechnologyCategory.AI_COMPUTE,
      categoryConfidence: 0.95,
      categoryInsights: {
        primary: 'Dominant AI compute infrastructure provider',
        secondary: '85% revenue from data center AI chips',
        disruption_exposure: 'High positive exposure to AI advancement',
        technology_moats: ['CUDA ecosystem', 'AI chip architecture', 'Software stack'],
      },
      growthValue: 25.0,
    },
    {
      name: 'Tesla Inc',
      description: 'Electric vehicle and robotics/AI company',
      category: TechnologyCategory.ROBOTICS_PHYSICAL_AI,
      categoryConfidence: 0.88,
      categoryInsights: {
        primary: 'Electric vehicle + robotics/AI company',
        secondary: '80% future value from robotics and AI',
        disruption_exposure: 'High exposure to physical AI adoption',
        technology_moats: ['FSD neural networks', 'Manufacturing AI', 'Energy storage'],
      },
      growthValue: 18.5,
    },
    {
      name: 'Google (Alphabet)',
      description: 'Search, cloud, and AI technology conglomerate',
      category: TechnologyCategory.AI_COMPUTE,
      categoryConfidence: 0.82,
      categoryInsights: {
        primary: 'AI-first technology platform',
        secondary: 'Leading in LLM research and deployment',
        disruption_exposure: 'Medium exposure to AI disruption of search',
        technology_moats: ['Data scale', 'AI research', 'Cloud infrastructure'],
      },
      growthValue: 12.3,
    },
    {
      name: 'Microsoft Corporation',
      description: 'Cloud computing and AI platform provider',
      category: TechnologyCategory.AI_COMPUTE,
      categoryConfidence: 0.79,
      categoryInsights: {
        primary: 'Enterprise AI and cloud leader',
        secondary: 'Azure AI and Office 365 integration',
        disruption_exposure: 'High positive exposure to enterprise AI',
        technology_moats: ['Enterprise relationships', 'Azure cloud', 'OpenAI partnership'],
      },
      growthValue: 15.7,
    },
    {
      name: 'IonQ Inc',
      description: 'Quantum computing hardware and software',
      category: TechnologyCategory.QUANTUM_COMPUTING,
      categoryConfidence: 0.93,
      categoryInsights: {
        primary: 'Pure-play quantum computing company',
        secondary: 'Trapped-ion quantum processor technology',
        disruption_exposure: 'High exposure to quantum computing breakthrough',
        technology_moats: ['Quantum hardware IP', 'Trapped-ion architecture'],
      },
      growthValue: 8.2,
    },
    {
      name: 'Boston Dynamics',
      description: 'Advanced robotics and mobility solutions',
      category: TechnologyCategory.ROBOTICS_PHYSICAL_AI,
      categoryConfidence: 0.91,
      categoryInsights: {
        primary: 'Leading robotics technology developer',
        secondary: 'Advanced mobility and manipulation robots',
        disruption_exposure: 'High exposure to robotics commercialization',
        technology_moats: ['Robotics algorithms', 'Mobility solutions', 'Atlas platform'],
      },
      growthValue: 22.1,
    },
  ]

  const createdAssets = []
  for (const assetData of assets) {
    const asset = await prisma.asset.create({
      data: {
        ...assetData,
        userId: testUser.id,
        themes: {
          create: [
            {
              name: 'Growth Analysis',
              themeType: ThemeType.GROWTH,
              manualValue: assetData.growthValue,
              useManualValue: true,
              cards: {
                create: [
                  {
                    title: 'Technology Leadership',
                    content: `Analysis of ${assetData.name}'s position in ${assetData.category} sector`,
                    importance: 5,
                  },
                  {
                    title: 'Market Position',
                    content: 'Competitive advantages and market share analysis',
                    importance: 4,
                  },
                ],
              },
            },
            {
              name: 'Technology Risks',
              description: 'Analysis of technology disruption risks',
              cards: {
                create: [
                  {
                    title: 'Disruption Threats',
                    content: 'Potential threats from emerging technologies',
                    importance: 3,
                  },
                ],
              },
            },
          ],
        },
      },
    })
    createdAssets.push(asset)
    console.log(`✅ Created asset: ${asset.name} (${asset.category})`)
  }

  // Create technology scenarios
  const scenarios = [
    {
      name: 'AI Compute Breakthrough',
      description: 'Major advancement in AI training efficiency reduces compute costs by 10x',
      type: ScenarioType.TECHNOLOGY,
      timeline: '2-5 years',
      probability: 0.4,
    },
    {
      name: 'Physical AI Mass Adoption',
      description: 'Widespread robotics deployment in manufacturing and logistics',
      type: ScenarioType.TECHNOLOGY,
      timeline: '3-7 years',
      probability: 0.6,
    },
    {
      name: 'Quantum Computing Breakthrough',
      description: 'Fault-tolerant quantum computers achieve practical advantage',
      type: ScenarioType.TECHNOLOGY,
      timeline: '5-10 years',
      probability: 0.3,
    },
    {
      name: 'AI Regulation Tightening',
      description: 'Strict AI governance regulations implemented globally',
      type: ScenarioType.REGULATORY,
      timeline: '1-3 years',
      probability: 0.7,
    },
    {
      name: 'Semiconductor Supply Crisis',
      description: 'Major disruption in global semiconductor supply chains',
      type: ScenarioType.GEOPOLITICAL,
      timeline: '1-2 years',
      probability: 0.5,
    },
  ]

  const createdScenarios = []
  for (const scenarioData of scenarios) {
    const scenario = await prisma.scenario.create({
      data: {
        ...scenarioData,
        userId: testUser.id,
        themes: {
          create: [
            {
              name: 'Probability Analysis',
              themeType: ThemeType.PROBABILITY,
              manualValue: scenarioData.probability * 100,
              useManualValue: true,
              cards: {
                create: [
                  {
                    title: 'Probability Factors',
                    content: `Key factors influencing the likelihood of ${scenarioData.name}`,
                    importance: 5,
                  },
                  {
                    title: 'Timeline Analysis',
                    content: `Expected timeline: ${scenarioData.timeline}`,
                    importance: 4,
                  },
                ],
              },
            },
            {
              name: 'Impact Analysis',
              description: 'Analysis of potential impacts across different sectors',
              cards: {
                create: [
                  {
                    title: 'Technology Impact',
                    content: 'How this scenario affects technology companies',
                    importance: 5,
                  },
                  {
                    title: 'Market Dynamics',
                    content: 'Expected changes in market structure and competition',
                    importance: 4,
                  },
                ],
              },
            },
          ],
        },
      },
    })
    createdScenarios.push(scenario)
    console.log(`✅ Created scenario: ${scenario.name} (${scenario.type})`)
  }

  // Create sample theme templates
  const templates = [
    {
      name: 'AI Company Analysis Template',
      description: 'Comprehensive analysis framework for AI companies',
      isPublic: true,
      tags: ['AI', 'Technology', 'Growth'],
      payload: {
        themes: [
          {
            name: 'AI Technology Moats',
            description: 'Analysis of competitive advantages in AI technology',
            cards: [
              {
                title: 'Model Architecture',
                content: 'Unique aspects of AI model architecture and training',
              },
              {
                title: 'Data Advantages',
                content: 'Proprietary data sources and quality',
              },
              {
                title: 'Compute Infrastructure',
                content: 'AI training and inference infrastructure capabilities',
              },
            ],
          },
          {
            name: 'Market Position',
            description: 'Competitive positioning in AI markets',
            cards: [
              {
                title: 'Customer Base',
                content: 'Analysis of customer acquisition and retention',
              },
              {
                title: 'Revenue Model',
                content: 'Business model and revenue sustainability',
              },
            ],
          },
        ],
      },
    },
    {
      name: 'Quantum Technology Assessment',
      description: 'Framework for evaluating quantum computing investments',
      isPublic: true,
      tags: ['Quantum', 'Deep Tech', 'Research'],
      payload: {
        themes: [
          {
            name: 'Technical Approach',
            description: 'Quantum computing hardware and software approach',
            cards: [
              {
                title: 'Qubit Technology',
                content: 'Type of qubits and technical specifications',
              },
              {
                title: 'Error Correction',
                content: 'Approach to quantum error correction',
              },
            ],
          },
          {
            name: 'Commercial Viability',
            description: 'Path to commercial quantum advantage',
            cards: [
              {
                title: 'Target Applications',
                content: 'Specific use cases and market opportunities',
              },
              {
                title: 'Timeline to Advantage',
                content: 'Expected timeline to quantum advantage',
              },
            ],
          },
        ],
      },
    },
  ]

  for (const templateData of templates) {
    const template = await prisma.themeTemplate.create({
      data: {
        ...templateData,
        ownerId: testUser.id,
      },
    })
    console.log(`✅ Created template: ${template.name}`)
  }

  // Create some matrix analysis results for demonstration
  console.log('🎯 Creating sample matrix analysis results...')
  
  const matrixPairs = [
    { assetIndex: 0, scenarioIndex: 0, impact: 4, confidence: 0.85 }, // NVIDIA vs AI Breakthrough
    { assetIndex: 1, scenarioIndex: 1, impact: 5, confidence: 0.78 }, // Tesla vs Physical AI
    { assetIndex: 4, scenarioIndex: 2, impact: 5, confidence: 0.92 }, // IonQ vs Quantum Breakthrough
    { assetIndex: 2, scenarioIndex: 3, impact: -2, confidence: 0.65 }, // Google vs AI Regulation
    { assetIndex: 0, scenarioIndex: 4, impact: -3, confidence: 0.71 }, // NVIDIA vs Supply Crisis
  ]

  for (const pair of matrixPairs) {
    const asset = createdAssets[pair.assetIndex]
    const scenario = createdScenarios[pair.scenarioIndex]
    
    await prisma.matrixAnalysisResult.create({
      data: {
        assetId: asset.id,
        scenarioId: scenario.id,
        impact: pair.impact,
        confidence: pair.confidence,
        summary: `AI-generated analysis of ${asset.name} under ${scenario.name} scenario`,
        reasoning: `Based on ${asset.name}'s position in ${asset.category} and the ${scenario.type} nature of ${scenario.name}`,
        evidenceIds: JSON.stringify([]), // Will be populated by AI analysis
        status: 'completed',
        completedAt: new Date(),
      },
    })
    console.log(`✅ Created matrix result: ${asset.name} × ${scenario.name} = ${pair.impact}`)
  }

  console.log('🎉 Database seeding completed successfully!')
  console.log(`
📊 Summary:
- ${createdAssets.length} technology assets created
- ${createdScenarios.length} scenarios created  
- ${templates.length} theme templates created
- ${matrixPairs.length} matrix analysis results created
- All data focused on technology disruption analysis
`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
