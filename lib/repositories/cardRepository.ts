import { prisma } from '../db';
import type { PrismaClient, Prisma, Card, Chunk } from '@prisma/client';
import { logger } from '../logger';

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
  constructor(private readonly db: PrismaClient = prisma) {}

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
    const total = await this.db.card.count({ where });
    
    // Define card with chunks select
    const cards = await this.db.card.findMany({
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
    
    const card = await this.db.card.findUnique({
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
   * @returns The newly created card
   */
  public async createCard(
    data: Prisma.CardUncheckedCreateInput & {
      chunks?: Array<{
        content: string;
        order: number;
      }>;
    }
  ): Promise<CardWithChunks> {
    repoLogger.debug('Creating card', { data });
    
    // Extract chunks to create separately if provided
    const { chunks, ...cardData } = data;
    
    // Create the card
    const card = await this.db.card.create({
      data: cardData,
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
    
    // If chunks were provided, create them separately
    if (chunks && chunks.length > 0) {
      for (const chunk of chunks) {
        await this.db.chunk.create({
          data: {
            content: chunk.content,
            order: chunk.order,
            cardId: card.id
          }
        });
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
      const card = await this.db.card.update({
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
      await this.db.card.delete({
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
    const count = await this.db.card.count({
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
   * @returns The created chunks
   */
  public async createChunks(
    cardId: string,
    chunks: Array<{
      content: string;
      order: number;
      embedding?: Buffer | null;
    }>
  ): Promise<Chunk[]> {
    repoLogger.debug('Creating chunks for card', { cardId, chunkCount: chunks.length });
    
    // First clear any existing chunks
    await this.db.chunk.deleteMany({
      where: { cardId }
    });
    
    // Create new chunks individually
    const createdChunks = await Promise.all(
      chunks.map(chunk => 
        this.db.chunk.create({
          data: {
            content: chunk.content,
            order: chunk.order,
            embedding: chunk.embedding,
            cardId
          }
        })
      )
    );
    
    return createdChunks;
  }
}
