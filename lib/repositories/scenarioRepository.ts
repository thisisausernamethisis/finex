// @ts-nocheck
import { prisma } from '../db';
import { logger } from '../logger';

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'ScenarioRepository' });

/**
 * Repository for Scenario operations
 */
export class ScenarioRepository {
  /**
   * Retrieves a list of scenarios with pagination
   * 
   * @param userId The ID of the requesting user (for future access control)
   * @param page The page number (1-indexed)
   * @param limit The number of items per page
   * @param search Optional search term to filter scenarios by name
   * @returns A paginated list of scenarios
   */
  public async listScenarios(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    items: Array<any>;
    total: number;
  }> {
    // Clamp limit to prevent excessive queries
    const clampedLimit = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * clampedLimit;
    
    repoLogger.debug('Listing scenarios', { userId, page, limit: clampedLimit, search });
    
    // Build the where clause
    const where: any = {};
    
    // Add search filter if provided
    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }
    
    // Get the total count
    const total = await prisma.scenario.count({ where });
    
    // Get the scenarios for this page
    const scenarios = await prisma.scenario.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        probability: true,
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
      items: scenarios,
      total
    };
  }
  
  /**
   * Retrieves a single scenario by ID
   * 
   * @param scenarioId The ID of the scenario to retrieve
   * @returns The scenario if found, null otherwise
   */
  public async getScenarioById(scenarioId: string): Promise<any | null> {
    repoLogger.debug('Getting scenario by ID', { scenarioId });
    
    return prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        name: true,
        description: true,
        probability: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Creates a new scenario
   * 
   * @param data The scenario data
   * @returns The newly created scenario
   */
  public async createScenario(
    data: { name: string; description?: string; probability?: number }
  ): Promise<any> {
    repoLogger.debug('Creating scenario', { data });
    
    return prisma.scenario.create({
      data: {
        ...data,
        themes: {
          create: [
            { 
              name: 'Probability',
              themeType: 'PROBABILITY',
              manualValue: data.probability || 0.5,
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
        probability: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Updates an existing scenario
   * 
   * @param scenarioId The ID of the scenario to update
   * @param data The scenario data to update
   * @returns The updated scenario, or null if not found
   */
  public async updateScenario(
    scenarioId: string,
    data: { name?: string; description?: string; probability?: number }
  ): Promise<any | null> {
    repoLogger.debug('Updating scenario', { scenarioId, data });
    
    // Check if probability is being updated
    if (data.probability !== undefined) {
      // Also update the probability theme
      const probabilityTheme = await prisma.theme.findFirst({
        where: {
          scenarioId,
          themeType: 'PROBABILITY'
        }
      });
      
      if (probabilityTheme) {
        await prisma.theme.update({
          where: { id: probabilityTheme.id },
          data: { 
            manualValue: data.probability,
            useManualValue: true
          }
        });
      }
    }
    
    return prisma.scenario.update({
      where: { id: scenarioId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        probability: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Deletes a scenario
   * 
   * @param scenarioId The ID of the scenario to delete
   * @returns True if successful, false if not found
   */
  public async deleteScenario(scenarioId: string): Promise<boolean> {
    repoLogger.debug('Deleting scenario', { scenarioId });
    
    try {
      await prisma.scenario.delete({
        where: { id: scenarioId }
      });
      return true;
    } catch (error) {
      repoLogger.error('Error deleting scenario', { scenarioId, error });
      return false;
    }
  }
  
  /**
   * Checks if a scenario exists
   * 
   * @param scenarioId The ID of the scenario to check
   * @returns True if the scenario exists, false otherwise
   */
  public async scenarioExists(scenarioId: string): Promise<boolean> {
    const count = await prisma.scenario.count({
      where: { id: scenarioId }
    });
    return count > 0;
  }
}
