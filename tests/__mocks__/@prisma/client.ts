import { vi } from 'vitest';

// Re-export the AssetKind enum for compatibility
export enum AssetKind { 
  REGULAR = 'REGULAR',
  TEMPLATE = 'TEMPLATE'
}

export enum ThemeType {
  STANDARD = 'STANDARD',
  GROWTH = 'GROWTH',
  PROBABILITY = 'PROBABILITY'
}

export enum AccessRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN'
}

export const Prisma = { 
  AssetKind, 
  ThemeType,
  AccessRole
} as any;

// Helper for creating async mocks
const asyncMock = <T = unknown>(v?: T) => vi.fn().mockResolvedValue(v);

// Create a mock PrismaClient class
class MockPrismaClient {
  // Asset model
  asset = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };

  // Theme model
  theme = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };
  
  // Card model
  card = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };

  // Chunk model
  chunk = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };
  
  // ThemeTemplate model
  themeTemplate = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };
  
  // Scenario model
  scenario = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };
  
  // MatrixAnalysisResult model
  matrixAnalysisResult = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };

  // AssetAccess model
  assetAccess = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };
  
  // User model
  user = {
    findUnique: asyncMock(null),
    findMany: asyncMock([]),
    findFirst: asyncMock(null),
    create: asyncMock({}),
    update: asyncMock({}),
    delete: asyncMock({}),
    deleteMany: asyncMock({ count: 0 }),
    count: asyncMock(0),
    upsert: asyncMock({})
  };
  
  // Transaction methods
  $transaction = asyncMock([]);
  $connect = asyncMock(undefined);
  $disconnect = asyncMock(undefined);
}

// Export the PrismaClient constructor
export const PrismaClient = vi.fn().mockImplementation(() => new MockPrismaClient());

// Default export
module.exports = {
  PrismaClient,
  Prisma,
  AssetKind,
  ThemeType,
  AccessRole
};
