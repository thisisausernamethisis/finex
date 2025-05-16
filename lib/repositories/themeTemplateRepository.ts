import { Container, TOKEN_PRISMA } from '../container';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { ThemeRepository } from './themeRepository';
import { CardRepository } from './cardRepository';

// Default page size (can be overridden by client up to MAX_PAGE_SIZE)
export const DEFAULT_PAGE_SIZE = 20;

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'ThemeTemplateRepository' });

// Create simplified exports matching the structure expected in the mock
export const list = async (userIdOrOpts?: string | any, opts?: any) => {
  const repo = new ThemeTemplateRepository();
  if (typeof userIdOrOpts === 'string') {
    return repo.listTemplates(userIdOrOpts, opts);
  } else {
    // Handle the case where only options are provided
    return repo.listTemplates('', userIdOrOpts);
  }
};

export const find = async (id: string) => {
  const repo = new ThemeTemplateRepository();
  return repo.getTemplateById(id);
};

export const create = async (userId: string, data: any) => {
  const repo = new ThemeTemplateRepository();
  return repo.createTemplate(userId, data);
};

/**
 * Repository for ThemeTemplate operations
 */
export class ThemeTemplateRepository {
  private themeRepo = new ThemeRepository();
  private cardRepo = new CardRepository();
  private readonly prisma: PrismaClient;
  
  constructor(prisma: PrismaClient = Container.get<PrismaClient>(TOKEN_PRISMA)) {
    this.prisma = prisma;
  }

  /**
   * Retrieves a list of theme templates with pagination, search, and filtering
   * 
   * @param userId The ID of the requesting user
   * @param options Search and pagination options
   * @returns A paginated list of templates
   */
  public async listTemplates(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      q?: string;
      mine?: boolean;
      publicOnly?: boolean;
    } = {}
  ): Promise<{
    items: Array<any>;
    total: number;
    hasMore: boolean;
  }> {
    // Set defaults and validate options
    const page = Math.max(1, options.page || 1); // Ensure page is ≥ 1
    const limit = Math.min(options.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;
    
    repoLogger.debug('Listing templates', { 
      userId, 
      page, 
      limit, 
      q: options.q,
      mine: options.mine,
      publicOnly: options.publicOnly 
    });
    
    // Build where clause based on filtering options
    let where: any = {};
    
    // Filter by ownership (mine) or visibility (publicOnly)
    if (options.mine) {
      // Only show templates owned by the current user
      where.ownerId = userId;
    } else if (options.publicOnly) {
      // Show public templates plus user's own templates
      where.OR = [
        { isPublic: true },
        { ownerId: userId }
      ];
    } else {
      // Default behavior - show public templates plus user's own templates
      where.OR = [
        { isPublic: true },
        { ownerId: userId }
      ];
    }
    
    // Add search filter if provided
    if (options.q && options.q.trim()) {
      // We need to restructure the query to maintain both the ownership/visibility
      // filters and the search filter
      const searchTerm = options.q.trim();
      
      // Use case-insensitive search to find matches
      const searchCondition = {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive' as const 
            }
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive' as const 
            }
          }
        ]
      };
      
      // We can use a raw query to fully utilize our index if needed for performance
      // If the search is experiencing performance issues, we can switch to:
      // Raw query: LOWER(name) LIKE LOWER('%${searchTerm}%')
      
      // If we already have OR conditions, we need to wrap them
      if (where.OR) {
        const existingConditions = where.OR;
        where = {
          AND: [
            { OR: existingConditions },
            searchCondition
          ]
        };
      } else {
        // Simple case - just add the search condition to the existing where clause
        where = { ...where, ...searchCondition };
      }
      
      repoLogger.debug('Applying search filter', { 
        searchTerm,
        whereClause: JSON.stringify(where)
      });
    }
    
    // Get the total count
    const total = await this.prisma.themeTemplate.count({ where });
    
    // Get the templates for this page
    const templates = await this.prisma.themeTemplate.findMany({
      where,
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Calculate if there are more items beyond this page
    const hasMore = skip + templates.length < total;
    
    return {
      items: templates,
      total,
      hasMore
    };
  }
  
  /**
   * Retrieves a single theme template by ID
   * 
   * @param id The ID of the template to retrieve
   * @returns The template if found, null otherwise
   */
  public async getTemplateById(id: string): Promise<any | null> {
    repoLogger.debug('Getting template by ID', { id });
    
    return this.prisma.themeTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Creates a new theme template from an existing theme
   * 
   * @param userId The ID of the user creating the template
   * @param data The template data including the source theme ID
   * @returns The newly created template
   */
  public async createTemplate(
    userId: string,
    data: {
      name: string;
      description?: string;
      themeId: string;
      isPublic?: boolean;
    }
  ): Promise<any> {
    repoLogger.debug('Creating template', { userId, themeId: data.themeId });
    
    // Get the theme and all its cards
    const theme = await this.themeRepo.getThemeById(data.themeId);
    if (!theme) {
      throw new Error(`Theme with ID ${data.themeId} not found`);
    }
    
    const { items: cards } = await this.cardRepo.listCards(data.themeId);
    
    // Create serialized payload of theme + cards
    const payload = {
      theme: {
        name: theme.name,
        description: theme.description,
        category: theme.category,
        themeType: theme.themeType
      },
      cards: cards.map((card: any) => ({
        title: card.title,
        content: card.content,
        importance: card.importance,
        source: card.source
      }))
    };
    
    // Create the template
    return this.prisma.themeTemplate.create({
      data: {
        ownerId: userId,
        name: data.name,
        description: data.description,
        payload: payload as any,
        isPublic: data.isPublic ?? false
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  
  /**
   * Deletes a theme template
   * 
   * @param id The ID of the template to delete
   * @returns True if successful, false if not found
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    repoLogger.debug('Deleting template', { id });
    
    try {
      await this.prisma.themeTemplate.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      repoLogger.error('Error deleting template', { id, error });
      return false;
    }
  }
  
  /**
   * Checks if a template exists
   * 
   * @param id The ID of the template to check
   * @returns True if the template exists, false otherwise
   */
  public async templateExists(id: string): Promise<boolean> {
    const count = await this.prisma.themeTemplate.count({
      where: { id }
    });
    return count > 0;
  }
}
