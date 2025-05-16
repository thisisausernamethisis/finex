import { Prisma, PrismaClient } from '@prisma/client';
import { Container, TOKEN_PRISMA } from '../container';
import { hasAssetAccess } from '../services/accessControlService';
import { logger } from '../logger';

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'AssetRepository' });

/**
 * Repository for Asset operations
 */
export class AssetRepository {
  constructor(private readonly db: PrismaClient = Container.get<PrismaClient>(TOKEN_PRISMA)) {}
  /**
   * Retrieves a list of assets with pagination
   * 
   * @param userId The ID of the requesting user
   * @param page The page number (1-indexed)
   * @param limit The number of items per page
   * @param search Optional search term to filter assets by name
   * @returns A paginated list of assets
   */
  public async listAssets(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    items: Array<any>;
    total: number;
    hasMore: boolean;
  }> {
    // Clamp limit to prevent excessive queries
    const clampedLimit = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * clampedLimit;
    
    repoLogger.debug('Listing assets', { userId, page, limit: clampedLimit, search });
    
    // Build the where clause to handle RBAC
    // Includes: (1) user's own assets, (2) assets shared with the user, (3) public assets
    const where: Prisma.AssetWhereInput = {
      OR: [
        // User's own assets
        { userId },
        // Assets shared with the user
        {
          accesses: {
            some: {
              userId
            }
          }
        },
        // Public assets
        { isPublic: true }
      ]
    };
    
    // Add search filter if provided
    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }
    
    // Get the total count
    const total = await this.db.asset.count({ where });
    
    // Get the assets for this page
    const assets = await this.db.asset.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        growthValue: true,
        userId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: clampedLimit
    });
    
    // Calculate if there are more items beyond this page
    const hasMore = skip + assets.length < total;
    
    return {
      items: assets,
      total,
      hasMore
    };
  }
  
  /**
   * Retrieves a single asset by ID
   * 
   * @param assetId The ID of the asset to retrieve
   * @param userId The ID of the requesting user
   * @returns The asset if found and accessible, null otherwise
   */
  public async getAssetById(assetId: string, userId: string): Promise<any | null> {
    repoLogger.debug('Getting asset by ID', { assetId, userId });
    
    // Retrieve the asset - not checking access here as that should be done in the API layer
    // This allows for more granular error handling (e.g., 403 vs 404)
    return this.db.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        name: true,
        description: true,
        growthValue: true,
        userId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Creates a new asset
   * 
   * @param userId The ID of the user creating the asset
   * @param data The asset data
   * @returns The newly created asset
   */
  public async createAsset(
    userId: string,
    data: { name: string; description?: string; isPublic?: boolean }
  ): Promise<any> {
    repoLogger.debug('Creating asset', { userId, data });
    
    return this.db.asset.create({
      data: {
        ...data,
        userId,
        themes: {
          create: [
            { 
              name: 'Growth',
              themeType: 'GROWTH', 
              manualValue: 0.0,
              useManualValue: true
            },
            { 
              name: 'Default Theme'
            }
          ]
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        growthValue: true,
        userId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Updates an existing asset
   * 
   * @param assetId The ID of the asset to update
   * @param data The asset data to update
   * @param userId The ID of the user updating the asset
   * @returns The updated asset, or null if not found or no access
   */
  public async updateAsset(
    assetId: string,
    data: { name?: string; description?: string; isPublic?: boolean },
    userId: string
  ): Promise<any | null> {
    repoLogger.debug('Updating asset', { assetId, userId, data });
    
    // We don't check access here as that should be done in the API layer
    return this.db.asset.update({
      where: { id: assetId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        growthValue: true,
        userId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Deletes an asset
   * 
   * @param assetId The ID of the asset to delete
   * @param userId The ID of the user deleting the asset
   * @returns True if successful, false if not found
   */
  public async deleteAsset(assetId: string, userId: string): Promise<boolean> {
    repoLogger.debug('Deleting asset', { assetId, userId });
    
    // We don't check permissions here as that should be done in the API layer
    try {
      await this.db.asset.delete({
        where: { id: assetId }
      });
      return true;
    } catch (error) {
      repoLogger.error('Error deleting asset', { assetId, error });
      return false;
    }
  }
  
  /**
   * Checks if an asset exists
   * 
   * @param assetId The ID of the asset to check
   * @returns True if the asset exists, false otherwise
   */
  public async assetExists(assetId: string): Promise<boolean> {
    const count = await this.db.asset.count({
      where: { id: assetId }
    });
    return count > 0;
  }
}
