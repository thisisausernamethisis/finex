import { prisma } from '../db';
import { logger } from '../logger';

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'ThemeRepository' });

/**
 * Repository for Theme operations
 */
export class ThemeRepository {
  /**
   * Retrieves a list of themes with pagination
   * Optionally filtered by parent asset or scenario
   * 
   * @param page The page number (1-indexed)
   * @param limit The number of items per page
   * @param assetId Optional asset ID to filter by
   * @param scenarioId Optional scenario ID to filter by
   * @param search Optional search term to filter themes by name
   * @returns A paginated list of themes
   */
  public async listThemes(
    page: number = 1,
    limit: number = 10,
    assetId?: string,
    scenarioId?: string,
    search?: string
  ): Promise<{
    items: Array<any>;
    total: number;
  }> {
    // Validate that only one of assetId or scenarioId is provided
    if (assetId && scenarioId) {
      repoLogger.warn('Both assetId and scenarioId provided to listThemes, using assetId', {
        assetId,
        scenarioId
      });
      scenarioId = undefined;
    }
    
    // Clamp limit to prevent excessive queries
    const clampedLimit = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * clampedLimit;
    
    repoLogger.debug('Listing themes', { 
      page, 
      limit: clampedLimit, 
      assetId, 
      scenarioId,
      search 
    });
    
    // Build the where clause
    const where: any = {};
    
    // Add parent filter
    if (assetId) {
      where.assetId = assetId;
    } else if (scenarioId) {
      where.scenarioId = scenarioId;
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }
    
    // Get the total count
    const total = await prisma.theme.count({ where });
    
    // Get the themes for this page
    const themes = await prisma.theme.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        themeType: true,
        assetId: true,
        scenarioId: true,
        calculatedValue: true,
        manualValue: true,
        useManualValue: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: clampedLimit
    });
    
    return {
      items: themes,
      total
    };
  }
  
  /**
   * Retrieves a single theme by ID
   * 
   * @param themeId The ID of the theme to retrieve
   * @returns The theme if found, null otherwise
   */
  public async getThemeById(themeId: string): Promise<any | null> {
    repoLogger.debug('Getting theme by ID', { themeId });
    
    return prisma.theme.findUnique({
      where: { id: themeId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        themeType: true,
        assetId: true,
        scenarioId: true,
        calculatedValue: true,
        manualValue: true,
        useManualValue: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Creates a new theme
   * 
   * @param data The theme data
   * @returns The newly created theme
   */
  public async createTheme(
    data: {
      name: string;
      description?: string;
      category?: string;
      themeType?: 'STANDARD' | 'GROWTH' | 'PROBABILITY';
      assetId?: string;
      scenarioId?: string;
      manualValue?: number;
      useManualValue?: boolean;
    }
  ): Promise<any> {
    // Validate that only one of assetId or scenarioId is provided
    if (data.assetId && data.scenarioId) {
      repoLogger.warn('Both assetId and scenarioId provided to createTheme, using assetId', {
        assetId: data.assetId,
        scenarioId: data.scenarioId
      });
      data.scenarioId = undefined;
    }
    
    // Ensure either assetId or scenarioId is provided
    if (!data.assetId && !data.scenarioId) {
      throw new Error('Either assetId or scenarioId must be provided when creating a theme');
    }
    
    repoLogger.debug('Creating theme', { data });
    
    return prisma.theme.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category || 'Default',
        themeType: data.themeType || 'STANDARD',
        assetId: data.assetId,
        scenarioId: data.scenarioId,
        manualValue: data.manualValue,
        useManualValue: data.useManualValue || false
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        themeType: true,
        assetId: true,
        scenarioId: true,
        calculatedValue: true,
        manualValue: true,
        useManualValue: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Updates an existing theme
   * 
   * @param themeId The ID of the theme to update
   * @param data The theme data to update
   * @returns The updated theme, or null if not found
   */
  public async updateTheme(
    themeId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      manualValue?: number;
      useManualValue?: boolean;
    }
  ): Promise<any | null> {
    repoLogger.debug('Updating theme', { themeId, data });
    
    // Note: we don't allow updating themeType, assetId, or scenarioId
    // as these are fundamental to the theme's identity
    
    try {
      return prisma.theme.update({
        where: { id: themeId },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          themeType: true,
          assetId: true,
          scenarioId: true,
          calculatedValue: true,
          manualValue: true,
          useManualValue: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      repoLogger.error('Error updating theme', { themeId, error });
      return null;
    }
  }
  
  /**
   * Updates the calculated value of a theme
   * This is separate from normal updates as it's used by the analysis pipeline
   * 
   * @param themeId The ID of the theme to update
   * @param calculatedValue The new calculated value
   * @returns The updated theme, or null if not found
   */
  public async updateThemeCalculatedValue(
    themeId: string,
    calculatedValue: number
  ): Promise<any | null> {
    repoLogger.debug('Updating theme calculated value', { themeId, calculatedValue });
    
    try {
      return prisma.theme.update({
        where: { id: themeId },
        data: { calculatedValue },
        select: {
          id: true,
          name: true,
          themeType: true,
          assetId: true,
          scenarioId: true,
          calculatedValue: true,
          manualValue: true,
          useManualValue: true
        }
      });
    } catch (error) {
      repoLogger.error('Error updating theme calculated value', { themeId, error });
      return null;
    }
  }
  
  /**
   * Deletes a theme
   * 
   * @param themeId The ID of the theme to delete
   * @returns True if successful, false if not found
   */
  public async deleteTheme(themeId: string): Promise<boolean> {
    repoLogger.debug('Deleting theme', { themeId });
    
    try {
      await prisma.theme.delete({
        where: { id: themeId }
      });
      return true;
    } catch (error) {
      repoLogger.error('Error deleting theme', { themeId, error });
      return false;
    }
  }
  
  /**
   * Checks if a theme exists
   * 
   * @param themeId The ID of the theme to check
   * @returns True if the theme exists, false otherwise
   */
  public async themeExists(themeId: string): Promise<boolean> {
    const count = await prisma.theme.count({
      where: { id: themeId }
    });
    return count > 0;
  }
  
  /**
   * Gets all themes for an asset
   * 
   * @param assetId The ID of the asset
   * @returns Array of themes
   */
  public async getThemesForAsset(assetId: string): Promise<any[]> {
    repoLogger.debug('Getting themes for asset', { assetId });
    
    return prisma.theme.findMany({
      where: { assetId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        themeType: true,
        calculatedValue: true,
        manualValue: true,
        useManualValue: true
      },
      orderBy: { name: 'asc' }
    });
  }
  
  /**
   * Gets all themes for a scenario
   * 
   * @param scenarioId The ID of the scenario
   * @returns Array of themes
   */
  public async getThemesForScenario(scenarioId: string): Promise<any[]> {
    repoLogger.debug('Getting themes for scenario', { scenarioId });
    
    return prisma.theme.findMany({
      where: { scenarioId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        themeType: true,
        calculatedValue: true,
        manualValue: true,
        useManualValue: true
      },
      orderBy: { name: 'asc' }
    });
  }
}
