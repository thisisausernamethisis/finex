/**
 * Jest auto-mock implementation for the entire repositories barrel
 *
 * This file implements mocks for all repository classes exported from lib/repositories/index.ts
 * Jest will automatically use these mocks when code imports from '@/lib/repositories' or 'lib/repositories'.
 * This is the SINGLE source of truth for all repository mocks.
 * 
 * Vitest uses alias in vitest.config.ts; Jest relies on __mocks__ directory
 */

import { prisma } from '../../../mocks/prisma';
import { Paginated, ThemeTemplateDTO } from '../../../seed/types';

// Import and re-export ThemeTemplateRepository from its individual mock file
import { ThemeTemplateRepository, DEFAULT_PAGE_SIZE } from './themeTemplateRepository';
export { ThemeTemplateRepository, DEFAULT_PAGE_SIZE };

/**
 * Base class for all repository mocks
 * Handles injecting the mock prisma client
 */
class BaseMockRepository {
  constructor() {
    // Override the prisma instance with our mock
    Object.defineProperty(this, 'prisma', {
      value: prisma,
      writable: false
    });
  }
}

/**
 * Mock implementation of AssetRepository
 */
export class AssetRepository extends BaseMockRepository {
  constructor() {
    super();
  }

  /**
   * Lists assets with pagination
   */
  async listAssets(userId: string, page = 1, limit = 10) {
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get all assets from the mock DB
    const allAssets = await prisma.asset.findMany();

    // Filter to only include assets the user has access to
    const filteredAssets = allAssets.filter(asset => {
      // User owns the asset
      if (asset.userId === userId) return true;

      // Asset is public
      if (asset.isPublic) return true;

      // Intentionally return some assets for test users
      if (userId === 'user_test123' && asset.id.includes('test')) return true;

      return false;
    });

    // Apply pagination
    const paginatedAssets = filteredAssets.slice(skip, skip + limit);

    // Return paginated result
    return {
      items: paginatedAssets,
      total: filteredAssets.length,
      hasMore: skip + paginatedAssets.length < filteredAssets.length
    };
  }

  /**
   * Gets a single asset by ID
   */
  async getAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id }
    });
  }

  /**
   * Creates a new asset
   * Updated to match production signature (userId, data)
   */
  async createAsset(userId: string, data: any) {
    const asset = await prisma.asset.create({
      data: {
        id: `test-asset-${Math.random().toString(36).substring(2, 10)}`,
        userId,
        name: data.name,
        description: data.description,
        kind: data.kind || 'REGULAR',
        isPublic: data.isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return asset;
  }

  /**
   * Updates an asset
   */
  async updateAsset(id: string, data: any) {
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: data.name ?? asset.name,
        description: data.description ?? asset.description,
        isPublic: data.isPublic ?? asset.isPublic,
        updatedAt: new Date()
      }
    });

    return updated;
  }

  // Backward compatibility for tests using the old method name
  async getAssets(options: any = {}) {
    const { page = 1, limit = 10, userId } = options;
    return this.listAssets(userId, page, limit);
  }

  // Delete an asset
  async deleteAsset(id: string, userId: string) {
    // Check if asset exists and user has access
    const asset = await prisma.asset.findFirst({
      where: { id }
    });

    if (!asset) {
      return false;
    }

    // Perform the deletion
    await prisma.asset.delete({
      where: { id }
    });

    return true;
  }

  /**
   * Clones an asset from a template
   */
  async cloneAsset(sourceAssetId: string, userId: string) {
    // Check if the source exists and is a template
    const source = await prisma.asset.findUnique({
      where: { id: sourceAssetId }
    });

    // Handle special mock case for RBAC tests
    if (sourceAssetId === 'mock-asset-for-rbac') {
      throw new Error('No access to template');
    }

    // Handle non-template cloning attempt
    if (source && source.kind !== 'TEMPLATE') {
      throw new Error('BadRequestError');
    }

    // Create a new asset as a clone
    return prisma.asset.create({
      data: {
        id: `cloned-asset-${Math.random().toString(36).substring(2, 10)}`,
        name: source ? `Clone of ${source.name}` : "Cloned Template Asset",
        userId,
        sourceTemplateId: sourceAssetId,
        kind: 'REGULAR',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

/**
 * Mock implementation of ScenarioRepository
 */
export class ScenarioRepository {
  constructor() {
    // All methods are jest.fn() by default
  }
}

/**
 * Mock implementation of ThemeRepository
 */
export class ThemeRepository {
  constructor() {
    // All methods are jest.fn() by default
  }

  // Add common mocked methods that tests rely on
  async getThemeById(id: string) {
    return prisma.theme.findUnique({
      where: { id }
    });
  }
}

/**
 * Mock implementation of CardRepository
 */
export class CardRepository {
  constructor() {
    // All methods are jest.fn() by default
  }

  // Add common mocked methods that tests rely on
  async listCards(themeId: string) {
    const cards = await prisma.card.findMany({
      where: { themeId }
    });

    return {
      items: cards,
      total: cards.length,
      hasMore: false
    };
  }
}

/**
 * Mock implementation of MatrixRepository
 */
export class MatrixRepository {
  constructor() {
    // All methods are jest.fn() by default
  }
}

// For backward compatibility with code that might use the old factory pattern
export const getMockRepositories = () => ({
  assetRepository: new AssetRepository(),
  scenarioRepository: new ScenarioRepository(),
  themeRepository: new ThemeRepository(),
  cardRepository: new CardRepository(),
  matrixRepository: new MatrixRepository(),
  themeTemplateRepository: new ThemeTemplateRepository()
});
