import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testClient } from '../utils/testClient';
import { setupTestDatabase, cleanupTestDatabase } from '../utils/testDatabase';

describe('Technology Categorization API', () => {
  let testAssetId: string;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user and get auth headers
    const authResponse = await testClient.post('/api/auth/test-login', {
      email: 'test@example.com'
    });
    authHeaders = {
      'Authorization': `Bearer ${authResponse.data.token}`
    };

    // Create a test asset
    const assetResponse = await testClient.post('/api/assets', {
      name: 'NVIDIA Corporation',
      description: 'Leading AI compute and GPU manufacturer'
    }, { headers: authHeaders });
    
    testAssetId = assetResponse.data.asset.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/assets/categorize', () => {
    it('should categorize an asset using background processing', async () => {
      const response = await testClient.post('/api/assets/categorize', {
        assetId: testAssetId,
        useBackground: true
      }, { headers: authHeaders });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        message: expect.stringContaining('queued'),
        jobId: expect.any(String),
        assetId: testAssetId,
        queued: true
      });
    });

    it('should categorize an asset synchronously with fallback', async () => {
      const response = await testClient.post('/api/assets/categorize', {
        assetId: testAssetId,
        useBackground: false,
        forceRecategorize: true
      }, { headers: authHeaders });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        message: expect.stringContaining('categorized'),
        asset: expect.objectContaining({
          id: testAssetId,
          category: expect.any(String),
          categoryConfidence: expect.any(Number)
        }),
        categorization: expect.objectContaining({
          category: expect.any(String),
          confidence: expect.any(Number),
          reasoning: expect.any(String)
        }),
        method: expect.stringMatching(/synchronous|fallback/)
      });

      // Verify the category is one of our expected values
      const validCategories = [
        'AI_COMPUTE',
        'ROBOTICS_PHYSICAL_AI', 
        'QUANTUM_COMPUTING',
        'BIOTECH_HEALTH',
        'FINTECH_CRYPTO',
        'ENERGY_CLEANTECH',
        'SPACE_DEFENSE',
        'TRADITIONAL_TECH',
        'OTHER'
      ];
      expect(validCategories).toContain(response.data.categorization.category);
    });

    it('should skip categorization if asset already categorized', async () => {
      // First categorization
      await testClient.post('/api/assets/categorize', {
        assetId: testAssetId,
        useBackground: false
      }, { headers: authHeaders });

      // Second categorization without force
      const response = await testClient.post('/api/assets/categorize', {
        assetId: testAssetId,
        useBackground: false
      }, { headers: authHeaders });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        message: expect.stringContaining('already categorized'),
        skipped: true
      });
    });

    it('should require authentication', async () => {
      const response = await testClient.post('/api/assets/categorize', {
        assetId: testAssetId
      });

      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const response = await testClient.post('/api/assets/categorize', {
        // Missing assetId
        useBackground: true
      }, { headers: authHeaders });

      expect(response.status).toBe(400);
    });

    it('should handle non-existent asset', async () => {
      const response = await testClient.post('/api/assets/categorize', {
        assetId: 'non-existent-id',
        useBackground: false
      }, { headers: authHeaders });

      expect(response.status).toBe(404);
    });
  });

  describe('Technology Categories', () => {
    const testCases = [
      {
        name: 'Tesla',
        description: 'Electric vehicle and autonomous driving company',
        expectedCategory: 'ROBOTICS_PHYSICAL_AI'
      },
      {
        name: 'IonQ',
        description: 'Quantum computing hardware and software',
        expectedCategory: 'QUANTUM_COMPUTING'
      },
      {
        name: 'Moderna',
        description: 'Biotechnology and mRNA vaccine development',
        expectedCategory: 'BIOTECH_HEALTH'
      },
      {
        name: 'Coinbase',
        description: 'Cryptocurrency exchange and blockchain platform',
        expectedCategory: 'FINTECH_CRYPTO'
      },
      {
        name: 'First Solar',
        description: 'Solar panel manufacturing and clean energy',
        expectedCategory: 'ENERGY_CLEANTECH'
      },
      {
        name: 'SpaceX',
        description: 'Space exploration and satellite technology',
        expectedCategory: 'SPACE_DEFENSE'
      }
    ];

    testCases.forEach(({ name, description, expectedCategory }) => {
      it(`should categorize ${name} as ${expectedCategory}`, async () => {
        // Create test asset
        const assetResponse = await testClient.post('/api/assets', {
          name,
          description
        }, { headers: authHeaders });

        // Categorize it
        const categorizeResponse = await testClient.post('/api/assets/categorize', {
          assetId: assetResponse.data.asset.id,
          useBackground: false
        }, { headers: authHeaders });

        expect(categorizeResponse.status).toBe(200);
        expect(categorizeResponse.data.categorization.category).toBe(expectedCategory);
        expect(categorizeResponse.data.categorization.confidence).toBeGreaterThan(0.5);
      });
    });
  });
}); 