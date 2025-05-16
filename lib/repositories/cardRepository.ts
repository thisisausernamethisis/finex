import type { PrismaClient, Prisma, Card, Chunk } from '@prisma/client';
import { Container, TOKEN_PRISMA } from '../container';
import { logger } from '../logger';

// Module-level cache for domain column existence
let hasDomainColumn: boolean | null = null;

/**
 * Check if the 'domain' column exists in the Chunk table
 * Result is cached after first query to avoid repetitive schema checks
 */
async function checkDomainColumnExists(prisma: PrismaClient): Promise<boolean> {
  // Return cached result if available
  if (hasDomainColumn !== null) return hasDomainColumn;
  
  try {
    // Query information_schema to check if the column exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'chunk'
        AND column_name = 'domain'
      ) as exists
    `;
    
    // Cache the result
    hasDomainColumn = !!(result as any)[0]?.exists;
    return hasDomainColumn;
  } catch (error) {
    logger.error('Failed to check domain column existence', { error });
    return false;
  }
}

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'CardRepository' });

// Define type for Card with Chunks expanded
export type CardWithChunks = Omit<Card, 'chunks'> & {
  chunks: Array<Pick<Chunk, 'id' | 'content' | 'order'>>;
};

// Define paginated response type
export interface PaginatedCards {
  items: CardWithChunks[];
  total: number;
}

/**
 * Repository for Card operations
 */
export class CardRepository {
  constructor(private readonly prisma: PrismaClient = Container.get<PrismaClient>(TOKEN_PRISMA)) {}

  /**
   * Retrieves a list of cards with pagination
   * Filtered by parent theme
   * 
   * @param themeId The ID of the parent theme
   * @param page The page number (1-indexed)
   * @param limit The number of items per page
   * @param search Optional search term to filter cards by title or content
   * @returns A paginated list of cards
   */
  public async listCards(
    themeId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedCards> {
    // Clamp limit to prevent excessive queries
    const clampedLimit = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * clampedLimit;
    
    repoLogger.debug('Listing cards', { 
      themeId, 
      page, 
      limit: clampedLimit, 
      search 
    });
    
    // Build the where clause
    const where: Prisma.CardWhereInput = {
      themeId
    };
    
    // Add search filter if provided
    if (search && search.trim()) {
      // Search in both title and content
      where.OR = [
        {
          title: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Get the total count
    const total = await this.prisma.card.count({ where });
    
    // Define card with chunks select
    const cards = await this.prisma.card.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        importance: true,
        source: true,
        themeId: true,
        chunks: {
          select: {
            id: true,
            content: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
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
      items: cards as CardWithChunks[],
      total
    };
  }
  
  /**
   * Retrieves a single card by ID
   * 
   * @param cardId The ID of the card to retrieve
   * @returns The card if found, null otherwise
   */
  public async getCardById(cardId: string): Promise<CardWithChunks | null> {
    repoLogger.debug('Getting card by ID', { cardId });
    
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        title: true,
        content: true,
        importance: true,
        source: true,
        themeId: true,
        chunks: {
          select: {
            id: true,
            content: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    
    return card as CardWithChunks | null;
  }
  
  /**
   * Creates a new card with optional chunks
   * 
   * @param data The card data
   * @param domain Optional domain to assign to chunks
   * @returns The newly created card
   */
  public async createCard(
    data: Prisma.CardUncheckedCreateInput & {
      chunks?: Array<{
        content: string;
        order: number;
      }>;
      domain?: string;
    }
  ): Promise<CardWithChunks> {
    repoLogger.debug('Creating card', { data });
    
    // Extract chunks and domain to handle separately
    const { chunks, domain, ...cardData } = data;
    
    // Create the card first without chunks
    const card = await this.prisma.card.create({
      data: cardData,
      select: {
        id: true,
        title: true,
        content: true,
        importance: true,
        source: true,
        themeId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // If chunks were provided, add them separately
    if (chunks && chunks.length > 0) {
      // Check if domain column exists
      const hasDomainColumn = await checkDomainColumnExists(this.prisma);
      
      // We'll handle this directly here to avoid an unnecessary round-trip
      for (const chunk of chunks) {
        if (hasDomainColumn) {
          // Include domain with fallback to 'generic' if domain column exists
          const chunkDomain = domain ?? 'generic';
          await this.prisma.$executeRaw`
            INSERT INTO "Chunk" ("content", "order", "cardId", "domain")
            VALUES (${chunk.content}, ${chunk.order}, ${card.id}, ${chunkDomain})
          `;
        } else {
          // Original schema without domain
          await this.prisma.$executeRaw`
            INSERT INTO "Chunk" ("content", "order", "cardId")
            VALUES (${chunk.content}, ${chunk.order}, ${card.id})
          `;
        }
      }
    }
    
    // Get the updated card with chunks
    const cardWithChunks = await this.getCardById(card.id);
    return cardWithChunks as CardWithChunks;
  }
  
  /**
   * Updates an existing card
   * 
   * @param cardId The ID of the card to update
   * @param data The card data to update
   * @returns The updated card, or null if not found
   */
  public async updateCard(
    cardId: string,
    data: Prisma.CardUncheckedUpdateInput
  ): Promise<CardWithChunks | null> {
    repoLogger.debug('Updating card', { cardId, data });
    
    try {
      const card = await this.prisma.card.update({
        where: { id: cardId },
        data,
        select: {
          id: true,
          title: true,
          content: true,
          importance: true,
          source: true,
          themeId: true,
          chunks: {
            select: {
              id: true,
              content: true,
              order: true
            },
            orderBy: {
              order: 'asc'
            }
          },
          createdAt: true,
          updatedAt: true
        }
      });
      
      return card as CardWithChunks;
    } catch (error) {
      repoLogger.error('Error updating card', { cardId, error });
      return null;
    }
  }
  
  /**
   * Deletes a card
   * 
   * @param cardId The ID of the card to delete
   * @returns True if successful, false if not found
   */
  public async deleteCard(cardId: string): Promise<boolean> {
    repoLogger.debug('Deleting card', { cardId });
    
    try {
      await this.prisma.card.delete({
        where: { id: cardId }
      });
      return true;
    } catch (error) {
      repoLogger.error('Error deleting card', { cardId, error });
      return false;
    }
  }
  
  /**
   * Checks if a card exists
   * 
   * @param cardId The ID of the card to check
   * @returns True if the card exists, false otherwise
   */
  public async cardExists(cardId: string): Promise<boolean> {
    const count = await this.prisma.card.count({
      where: { id: cardId }
    });
    return count > 0;
  }
  
  /**
   * Create chunks for a card
   * Typically used during text processing after initial card creation
   * 
   * @param cardId The ID of the card to add chunks to
   * @param chunks Array of chunks to create
   * @param domain Optional domain to assign to chunks (for post-301a compatibility)
   * @returns The created chunks
   */
  public async createChunks(
    cardId: string,
    chunks: Array<{
      content: string;
      order: number;
      embedding?: Buffer | null;
    }>,
    domain?: string
  ): Promise<Chunk[]> {
    repoLogger.debug('Creating chunks for card', { cardId, chunkCount: chunks.length });
    
    // First clear any existing chunks
    await this.prisma.chunk.deleteMany({
      where: { cardId }
    });
    
    // Check if the domain column exists in the schema (for T-309)
    const hasDomainColumn = await checkDomainColumnExists(this.prisma);
    
    // Create new chunks using a loop to avoid type issues
    for (const chunk of chunks) {
      if (hasDomainColumn) {
        // After T-301a migration: include domain with fallback to 'generic'
        const chunkDomain = domain || 'generic';
        await this.prisma.$executeRaw`
          INSERT INTO "Chunk" ("content", "order", "embedding", "cardId", "domain")
          VALUES (${chunk.content}, ${chunk.order}, ${chunk.embedding}, ${cardId}, ${chunkDomain})
        `;
      } else {
        // Before T-301a migration: original schema without domain
        await this.prisma.$executeRaw`
          INSERT INTO "Chunk" ("content", "order", "embedding", "cardId")
          VALUES (${chunk.content}, ${chunk.order}, ${chunk.embedding}, ${cardId})
        `;
      }
    }
    
    // Fetch all created chunks at once
    const createdChunks = await this.prisma.chunk.findMany({
      where: { cardId },
      orderBy: { order: 'asc' }
    });
    
    return createdChunks;
  }
  
  /**
   * Check if a column exists in a table using information_schema
   * Used to handle schema transitions during migrations
   * 
   * @param tableName The table to check
   * @param columnName The column to check for
   * @returns True if the column exists, false otherwise
   */
  private async checkIfColumnExists(tableName: string, columnName: string): Promise<boolean> {
    // Query information_schema to check if the column exists
    const result = await this.prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = ${tableName.toLowerCase()}
        AND column_name = ${columnName.toLowerCase()}
      ) as exists
    `;
    
    // The result is an array with a single object with an "exists" property
    return (result as any)[0]?.exists || false;
  }
}
