// @ts-nocheck
import { PrismaClient } from '@prisma/client';

// Create a mock version of PrismaClient that works with both Jest and Vitest
const createMockFn = () => {
  // Check if we're in a Jest environment
  if (typeof jest !== 'undefined') {
    return jest.fn();
  }
  // Otherwise use a simple mock function
  return () => Promise.resolve();
};

// Create a mock version of PrismaClient
export const prisma = {
  asset: {
    findMany: createMockFn(),
    findUnique: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    deleteMany: createMockFn(),
    count: createMockFn(),
  },
  theme: {
    create: createMockFn(),
    findUnique: createMockFn(),
    findMany: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  card: {
    create: createMockFn(),
    findMany: createMockFn(),
    findUnique: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  themeTemplate: {
    create: createMockFn(),
    findMany: createMockFn(),
    findUnique: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
    upsert: createMockFn(),
  },
  scenario: {
    create: createMockFn(),
    findMany: createMockFn(),
    findUnique: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  matrixAnalysisResult: {
    create: createMockFn(),
    findMany: createMockFn(),
    findUnique: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  // Add Prisma client methods
  $disconnect: createMockFn(),
  $connect: createMockFn(),
} as unknown as PrismaClient;

// Reset all mocks between tests - works for both Jest and Vitest
export const resetMocks = () => {
  if (typeof jest !== 'undefined') {
    // Jest environment
    Object.values(prisma).forEach(table => {
      if (table && typeof table === 'object') {
        Object.values(table).forEach(method => {
          if (typeof method === 'function' && method.mockReset) {
            method.mockReset();
          }
        });
      }
    });
    setupMocks();
  }
};

// Setup all mock implementations
function setupMocks() {
  // Asset mocks
  if (prisma.asset.findMany.mockResolvedValue) {
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

    // Add card count mock
    prisma.card.count.mockResolvedValue(1);

    // Theme template mocks
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
        description: 'Search for solar keywords',
        isPublic: true,
        ownerId: 'user_test123',   // User owns this template
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mock-theme-template-4',
        name: 'User Owned Template',
        description: 'Template owned by test user',
        isPublic: false,
        ownerId: 'user_test123',   // User owns this template
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    prisma.themeTemplate.findMany.mockImplementation(async (params: any) => {
      let filteredTemplates = [...templates];
      
      // Apply filters based on params
      if (params?.where) {
        if (params.where.isPublic === true) {
          filteredTemplates = filteredTemplates.filter(t => t.isPublic);
        }
        if (params.where.ownerId) {
          filteredTemplates = filteredTemplates.filter(t => t.ownerId === params.where.ownerId);
        }
        if (params.where.name?.contains) {
          const searchTerm = params.where.name.contains.toLowerCase();
          filteredTemplates = filteredTemplates.filter(t => 
            t.name.toLowerCase().includes(searchTerm) || 
            t.description.toLowerCase().includes(searchTerm)
          );
        }
      }
      
      return filteredTemplates;
    });

    prisma.themeTemplate.findUnique.mockImplementation(async (params: any) => {
      if (params.where.id === 'nonexistent-id') {
        return null;
      }
      
      const template = templates.find(t => t.id === params.where.id);
      return template || templates[0]; // Return first template as fallback
    });

    // Add count and upsert mocks
    prisma.themeTemplate.count.mockResolvedValue(templates.length);
    
    prisma.themeTemplate.upsert.mockImplementation(async (params: any) => {
      // For upsert, return the existing template or create a new one
      const existing = templates.find(t => t.id === params.where.id);
      if (existing) {
        return { ...existing, ...params.update };
      } else {
        return {
          id: params.where.id || `mock-theme-template-${Math.random().toString(36).substring(7)}`,
          ...params.create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    // Matrix analysis result mocks
    prisma.matrixAnalysisResult.findUnique.mockImplementation(async (params: any) => {
      return {
        id: 'result1',
        assetId: params.where.assetId_scenarioId?.assetId || 'asset1',
        scenarioId: params.where.assetId_scenarioId?.scenarioId || 'scenario1',
        status: 'pending',
        impact: 0,
        evidenceIds: '',
        error: null,
        summary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };
    });

    prisma.matrixAnalysisResult.update.mockImplementation(async (params: any) => {
      return {
        id: 'result1',
        assetId: params.where.assetId_scenarioId?.assetId || 'asset1',
        scenarioId: params.where.assetId_scenarioId?.scenarioId || 'scenario1',
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Mock $disconnect for Jest
    if (prisma.$disconnect.mockResolvedValue) {
      prisma.$disconnect.mockResolvedValue(undefined);
    }
  }
}

// Initialize mocks if in Jest environment
if (typeof jest !== 'undefined') {
  setupMocks();
}

export type MockPrismaClient = typeof prisma;
