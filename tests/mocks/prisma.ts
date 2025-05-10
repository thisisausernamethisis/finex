// @ts-nocheck
// TODO(T-173b): Deep Prisma mock typings
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// Create a mock version of PrismaClient
export const prisma = mockDeep<PrismaClient>();

// Reset all mocks between tests
beforeEach(() => {
  mockReset(prisma);
  setupMocks(); // Re-setup mocks after reset
});

// Setup all mock implementations
function setupMocks() {
  // Asset mocks
  prisma.asset.findMany.mockResolvedValue([
    {
      id: 'mock-asset-1jx68',
      name: 'Mock Asset 1',
      description: 'A mock asset for testing',
      growthValue: 10.5,
      userId: 'test-user-id',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-asset-2xk91',
      name: 'Mock Asset 2',
      description: 'Another mock asset',
      growthValue: 5.2,
      userId: 'test-user-id',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  prisma.asset.findUnique.mockImplementation(async (params: any) => {
    if (params.where.id === 'nonexistent-id') {
      return null;
    }
    return {
      id: params.where.id || 'mock-asset-3po92',
      name: 'Single Mock Asset',
      description: 'A single mock asset for testing',
      growthValue: 15.7,
      userId: 'test-user-id',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  prisma.asset.create.mockImplementation(async (params: any) => {
    const id = `mock-asset-${Math.random().toString(36).substring(7)}`;
    return {
      id,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  prisma.asset.update.mockImplementation(async (params: any) => {
    return {
      id: params.where.id,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  prisma.asset.delete.mockImplementation(async (params: any) => {
    return {
      id: params.where.id,
      name: 'Deleted Asset',
      description: 'This asset was deleted',
      growthValue: null,
      userId: 'test-user-id',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  prisma.asset.deleteMany.mockResolvedValue({ count: 1 });
  prisma.asset.count.mockResolvedValue(10);

  // Theme mocks
  prisma.theme.create.mockImplementation(async (params: any) => {
    const id = `mock-theme-${Math.random().toString(36).substring(7)}`;
    return {
      id,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  prisma.theme.findUnique.mockImplementation(async (params: any) => {
    return {
      id: params.where.id || 'mock-theme-12345',
      name: 'Mock Theme',
      description: 'This is a mock theme',
      category: 'Default',
      themeType: 'STANDARD',
      assetId: 'mock-asset-12345',
      scenarioId: null,
      calculatedValue: null,
      manualValue: null,
      useManualValue: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  prisma.theme.findMany.mockResolvedValue([
    {
      id: 'mock-theme-12345',
      name: 'Mock Theme 1',
      description: 'Mock theme description 1',
      category: 'Default',
      themeType: 'STANDARD',
      assetId: 'mock-asset-12345',
      scenarioId: null,
      calculatedValue: null,
      manualValue: null,
      useManualValue: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-theme-67890',
      name: 'Mock Theme 2',
      description: 'Mock theme description 2',
      category: 'Growth',
      themeType: 'GROWTH',
      assetId: 'mock-asset-12345',
      scenarioId: null,
      calculatedValue: 15.5,
      manualValue: 20.0,
      useManualValue: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Card mocks
  prisma.card.create.mockImplementation(async (params: any) => {
    const id = `mock-card-${Math.random().toString(36).substring(7)}`;
    return {
      id,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  prisma.card.findMany.mockResolvedValue([
    {
      id: 'mock-card-1',
      title: 'Mock Card 1',
      content: 'Card content 1',
      importance: 3,
      source: 'https://example.com',
      themeId: 'mock-theme-12345',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Theme template mocks
  prisma.themeTemplate = prisma.themeTemplate || mockDeep();
  prisma.themeTemplate.create.mockImplementation(async (params: any) => {
    const id = `mock-theme-template-${Math.random().toString(36).substring(7)}`;
    return {
      id,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  // Define templates as a constant for reuse
  const templates = [
    {
      id: 'mock-theme-template-0',
      name: 'Starter Public Template',
      description: 'Always returned in list',
      isPublic: true,
      ownerId: 'user_test123',   // Ensure test user owns a public template
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-theme-template-1',
      name: 'Public Template',
      description: 'A public theme template',
      isPublic: true,
      ownerId: 'admin-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-theme-template-2',
      name: 'Private Template',
      description: 'A private theme template',
      isPublic: false,
      ownerId: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-theme-template-3',
      name: 'Test Search Solar Panel Analysis',
      description: 'Template for analyzing solar technology companies',
      isPublic: true,
      ownerId: 'user_test123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-theme-template-4',
      name: 'User Owned Template',
      description: 'Template owned by the test user',
      isPublic: false,
      ownerId: 'user_test123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  prisma.themeTemplate.findMany.mockImplementation(async (params: any) => {
    const where = params?.where || {};
    
    return templates.filter(t => {
      // Filter by owner ID
      if (where.ownerId === 'user_test123' && t.ownerId !== 'user_test123') {
        return false;
      }
      
      // Filter by name or description if search term is provided
      if (where.OR && Array.isArray(where.OR)) {
        // Handle search filters (typically OR conditions for name/description)
        const hasSearchMatch = where.OR.some((condition: any) => {
          if (condition.name?.contains) {
            const searchTerm = condition.name.contains.toLowerCase();
            if (t.name.toLowerCase().includes(searchTerm)) {
              return true;
            }
          }
          if (condition.description?.contains) {
            const searchTerm = condition.description.contains.toLowerCase();
            if (t.description && t.description.toLowerCase().includes(searchTerm)) {
              return true;
            }
          }
          return false;
        });
        
        if (where.OR.length > 0 && !hasSearchMatch) {
          return false;
        }
      }
      
      return true;
    });
  });

  // Matrix mocks
  prisma.matrixAnalysisResult = prisma.matrixAnalysisResult || mockDeep();
  prisma.matrixAnalysisResult.findUnique.mockResolvedValue({
    id: 'mock-matrix-1',
    assetId: 'mock-asset-1',
    scenarioId: 'mock-scenario-1',
    impact: 3,
    summary: 'Mock impact analysis',
    evidenceIds: '["mock-card-1"]',
    status: 'completed',
    error: null,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  prisma.matrixAnalysisResult.create.mockImplementation(async (params: any) => {
    const id = `mock-matrix-${Math.random().toString(36).substring(7)}`;
    return {
      id,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  // Scenario mocks
  prisma.scenario = prisma.scenario || mockDeep();
  prisma.scenario.findMany.mockResolvedValue([
    {
      id: 'mock-scenario-1',
      name: 'Mock Scenario 1',
      description: 'A mock scenario',
      probability: 75.5,
      userId: 'test-user-id',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // User mocks for access control
  prisma.user = prisma.user || mockDeep();
  prisma.user.findUnique.mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Asset access mocks
  prisma.assetAccess = prisma.assetAccess || mockDeep();
  prisma.assetAccess.findFirst.mockResolvedValue({
    id: 'mock-access-1',
    assetId: 'mock-asset-1',
    userId: 'test-user-id',
    role: 'EDITOR',
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Initialize mocks
setupMocks();

export type MockPrismaClient = typeof prisma;
