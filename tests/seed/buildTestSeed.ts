import { PrismaClient, AssetKind, ThemeType, AccessRole } from '@prisma/client';
import { createJWTForTest } from '../utils/auth';

/**
 * Options for customizing the seed data
 */
export interface SeedOptions {
  /**
   * Test user ID (defaults to 'user_test123')
   */
  userId?: string;

  /**
   * Optional extra assets to create (in addition to defaults)
   */
  extraAssets?: AssetSeedOptions[];

  /**
   * Optional extra scenarios to create (in addition to defaults)
   */
  extraScenarios?: ScenarioSeedOptions[];

  /**
   * Optional extra theme templates to create (in addition to defaults)
   */
  extraTemplates?: TemplateOptions[];

  /**
   * Override default asset configs
   */
  assetOverrides?: Partial<AssetSeedOptions>[];

  /**
   * Override default scenario configs
   */
  scenarioOverrides?: Partial<ScenarioSeedOptions>[];

  /**
   * If true, will clean tables before seeding. False will upsert.
   */
  cleanBeforeRun?: boolean;
}

/**
 * Configuration for creating an asset in the test database
 */
export interface AssetSeedOptions {
  id?: string;
  name: string;
  description?: string;
  growthValue?: number;
  kind?: AssetKind;
  isPublic?: boolean;
  userId?: string; // Owner override (defaults to userId in SeedOptions)
}

/**
 * Configuration for creating a scenario in the test database
 */
export interface ScenarioSeedOptions {
  id?: string;
  name: string;
  description?: string;
  probability?: number;
}

/**
 * Configuration for creating a theme template in the test database
 */
export interface TemplateOptions {
  id?: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  ownerId?: string; // Owner override (defaults to userId in SeedOptions)
  payload?: any;
}

/**
 * Result of running the seed builder
 */
export interface SeedResult {
  /**
   * The test user ID used for seeding
   */
  userId: string;

  /**
   * JWT token for authentication as the test user
   */
  jwt: string;

  /**
   * Created asset IDs
   */
  assetIds: string[];

  /**
   * Created scenario IDs
   */
  scenarioIds: string[];

  /**
   * Created template IDs
   */
  templateIds: string[];
}

// Default test user ID
const DEFAULT_USER_ID = 'user_test123';

// Default assets to create
const DEFAULT_ASSETS: AssetSeedOptions[] = [
  {
    id: 'test-asset-nvidia',
    name: 'NVIDIA Corporation',
    description: 'Semiconductor company specializing in GPUs and AI',
    growthValue: 15.7,
    isPublic: true
  },
  {
    id: 'test-asset-tesla',
    name: 'Tesla, Inc.',
    description: 'Electric vehicle and clean energy company',
    growthValue: 12.3,
    isPublic: true
  },
  {
    id: 'test-asset-btc',
    name: 'Bitcoin',
    description: 'Digital cryptocurrency asset',
    growthValue: 8.5,
    isPublic: false
  }
];

// Default scenarios to create
const DEFAULT_SCENARIOS: ScenarioSeedOptions[] = [
  {
    id: 'test-scenario-recession',
    name: 'Global Recession',
    description: 'Economic downturn affecting multiple countries',
    probability: 35.0
  },
  {
    id: 'test-scenario-china-taiwan',
    name: 'China-Taiwan Conflict',
    description: 'Geopolitical tensions in East Asia',
    probability: 25.0
  }
];

// Default template to create
const DEFAULT_TEMPLATES: TemplateOptions[] = [
  {
    id: 'test-template-public',
    name: 'Standard Analysis Template',
    description: 'General purpose analysis framework',
    isPublic: true,
    payload: {
      theme: {
        name: 'Core Analysis',
        category: 'Default',
        themeType: 'STANDARD'
      },
      cards: [
        {
          title: 'Business Overview',
          content: 'General introduction to the business model.',
          importance: 3,
        },
        {
          title: 'Financial Analysis',
          content: 'Key financial metrics and performance indicators.',
          importance: 5,
        }
      ]
    }
  }
];

/**
 * Creates a PrismaClient instance connected to the test database.
 * Reads from the environment variable DATABASE_URL_TEST if available.
 */
function getPrismaClientForTests(): PrismaClient {
  const testDbUrl = process.env.DATABASE_URL_TEST;
  if (testDbUrl) {
    return new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl
        }
      }
    });
  }

  // Fall back to the default DATABASE_URL which should be configured
  // for tests in the .env.test file or environment
  return new PrismaClient();
}

/**
 * Builds a deterministic seed dataset for testing.
 *
 * By default, creates:
 * - 1 user (user_test123)
 * - 3 Assets (NVIDIA, Tesla, BTC)
 * - 2 Scenarios (Recession, China-Taiwan)
 * - 1 ThemeTemplate (public + owned by test user)
 *
 * @param opts Optional overrides for the seed data
 * @returns Result object with created IDs and a valid JWT
 */
export async function runTestSeed(opts?: Partial<SeedOptions>): Promise<SeedResult> {
  const options: SeedOptions = {
    userId: opts?.userId || DEFAULT_USER_ID,
    extraAssets: opts?.extraAssets || [],
    extraScenarios: opts?.extraScenarios || [],
    extraTemplates: opts?.extraTemplates || [],
    assetOverrides: opts?.assetOverrides || [],
    scenarioOverrides: opts?.scenarioOverrides || [],
    cleanBeforeRun: opts?.cleanBeforeRun ?? false
  };

  // Get Prisma instance connected to test database
  const prisma = getPrismaClientForTests();
  
  // Ensure we have a valid user ID (defined outside transaction for use in JWT)
  const userId = options.userId || DEFAULT_USER_ID;
  
  // Generate JWT for authentication (defined outside to ensure it's always returned)
  const jwt = createJWTForTest({ sub: userId });
  
  // Initialize result object with guaranteed values
  const result: SeedResult = {
    userId,
    jwt,
    assetIds: [],
    scenarioIds: [],
    templateIds: []
  };

  try {
    // Execute all operations in a transaction for atomicity
    try {
      const seedData = await prisma.$transaction(async (tx) => {
        // Clean tables if requested
        if (options.cleanBeforeRun) {
          await tx.matrixAnalysisResult.deleteMany({});
          await tx.card.deleteMany({});
          await tx.chunk.deleteMany({});
          await tx.theme.deleteMany({});
          await tx.assetAccess.deleteMany({});
          await tx.asset.deleteMany({});
          await tx.scenario.deleteMany({});
          await tx.themeTemplate.deleteMany({});
        }

        // Ensure user exists
        await tx.user.upsert({
          where: { id: userId },
          create: { id: userId },
          update: {}
        });

        // Create assets
        const assetIds = await createAssets(tx, userId, options);

        // Create scenarios
        const scenarioIds = await createScenarios(tx, options);

        // Create templates
        const templateIds = await createTemplates(tx, userId, options);

        return {
          assetIds,
          scenarioIds,
          templateIds
        };
      });
      
      // Update result with transaction data if available
      if (seedData) {
        result.assetIds = seedData.assetIds || [];
        result.scenarioIds = seedData.scenarioIds || [];
        result.templateIds = seedData.templateIds || [];
      }
    } catch (txError) {
      console.error('Transaction error in seed builder:', txError);
      // Even if transaction fails, return the result with default empty arrays
    }
    
    return result;
  } finally {
    // We no longer disconnect here - this is now handled by the global teardown
    // Disconnection is centralized in tests/_setup/prismaTestEnv.js
  }
}

/**
 * Creates assets based on defaults and options
 */
async function createAssets(
  tx: any, // Use any type for transaction to avoid complex Prisma typing issues
  userId: string,
  options: SeedOptions
): Promise<string[]> {
  const assetIds: string[] = [];

  // Process default assets with any overrides
  const defaultsWithOverrides = DEFAULT_ASSETS.map((defaultAsset, index) => {
    const override = options.assetOverrides?.[index] || {};
    return { ...defaultAsset, ...override };
  });

  // Combine default assets and extra assets
  const allAssets = [...defaultsWithOverrides, ...(options.extraAssets || [])];

  // Create all assets
  for (const asset of allAssets) {
    const id = asset.id || `fallback-${Math.random().toString(36).substring(2, 9)}`;
    const ownerUserId = asset.userId || userId;
    const result = await tx.asset.upsert({
      where: { id },
      create: {
        id,
        name: asset.name,
        description: asset.description,
        growthValue: asset.growthValue,
        kind: asset.kind || AssetKind.REGULAR,
        isPublic: asset.isPublic ?? false,
        userId: ownerUserId
      },
      update: {
        name: asset.name,
        description: asset.description,
        growthValue: asset.growthValue,
        kind: asset.kind || AssetKind.REGULAR,
        isPublic: asset.isPublic ?? false,
        userId: ownerUserId
      }
    });

    assetIds.push(result.id);
  }

  return assetIds;
}

/**
 * Creates scenarios based on defaults and options
 */
async function createScenarios(
  tx: any, // Use any type for transaction to avoid complex Prisma typing issues
  options: SeedOptions
): Promise<string[]> {
  const scenarioIds: string[] = [];

  // Process default scenarios with any overrides
  const defaultsWithOverrides = DEFAULT_SCENARIOS.map((defaultScenario, index) => {
    const override = options.scenarioOverrides?.[index] || {};
    return { ...defaultScenario, ...override };
  });

  // Combine default scenarios and extra scenarios
  const allScenarios = [...defaultsWithOverrides, ...(options.extraScenarios || [])];

  // Create all scenarios
  for (const scenario of allScenarios) {
    const id = scenario.id || `fallback-${Math.random().toString(36).substring(2, 9)}`;
    const result = await tx.scenario.upsert({
      where: { id },
      create: {
        id,
        name: scenario.name,
        description: scenario.description,
        probability: scenario.probability
      },
      update: {
        name: scenario.name,
        description: scenario.description,
        probability: scenario.probability
      }
    });

    scenarioIds.push(result.id);
  }

  return scenarioIds;
}

/**
 * Creates templates based on defaults and options
 */
async function createTemplates(
  tx: any, // Use any type for transaction to avoid complex Prisma typing issues
  userId: string,
  options: SeedOptions
): Promise<string[]> {
  const templateIds: string[] = [];

  // Combine default templates and extra templates
  const allTemplates = [...DEFAULT_TEMPLATES, ...(options.extraTemplates || [])];

  // Create all templates
  for (const template of allTemplates) {
    const id = template.id || `fallback-${Math.random().toString(36).substring(2, 9)}`;
    const result = await tx.themeTemplate.upsert({
      where: { id },
      create: {
        id,
        name: template.name,
        description: template.description,
        isPublic: template.isPublic ?? false,
        ownerId: template.ownerId || userId,
        payload: template.payload || {}
      },
      update: {
        name: template.name,
        description: template.description,
        isPublic: template.isPublic ?? false,
        ownerId: template.ownerId || userId,
        payload: template.payload || {}
      }
    });

    templateIds.push(result.id);
  }

  return templateIds;
}
