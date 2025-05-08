// @ts-nocheck
import { prisma } from '../db';
import { logger } from '../logger';

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'CardRepository' });

/**
 * Repository for Card operations
 */
export class CardRepository {
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
  ): Promise<{
    items: Array<any>;
    total: number;
  }> {
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
    const where: any = {
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
    const total = await prisma.card.count({ where });
    
    // Get the cards for this page with chunks
    const cards = await prisma.card.findMany({
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
      items: cards,
      total
    };
  }
  
  /**
   * Retrieves a single card by ID
   * 
   * @param cardId The ID of the card to retrieve
   * @returns The card if found, null otherwise
   */
  public async getCardById(cardId: string): Promise<any | null> {
    repoLogger.debug('Getting card by ID', { cardId });
    
    return prisma.card.findUnique({
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
  }
  
  /**
   * Creates a new card with optional chunks
   * 
   * @param data The card data
   * @returns The newly created card
   */
  public async createCard(
    data: {
      title: string;
      content: string;
      importance?: number;
      source?: string;
      themeId: string;
      chunks?: Array<{
        content: string;
        order: number;
      }>;
    }
  ): Promise<any> {
    repoLogger.debug('Creating card', { data });
    
    // Extract chunks to create separately if provided
    const { chunks, ...cardData } = data;
    
    // Create the card
    const card = await prisma.card.create({
      data: {
        ...cardData,
        // If chunks are provided, create them
        ...(chunks && chunks.length > 0 ? {
          chunks: {
            create: chunks.map(chunk => ({
              content: chunk.content,
              order: chunk.order,
              // Embedding will be added separately by a background job
              embedding: null
            }))
          }
        } : {})
      },
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
    
    return card;
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
    data: {
      title?: string;
      content?: string;
      importance?: number;
      source?: string;
    }
  ): Promise<any | null> {
    repoLogger.debug('Updating card', { cardId, data });
    
    try {
      return prisma.card.update({
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
      await prisma.card.delete({
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
    const count = await prisma.card.count({
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
      embedding?: any; // Flexible type for embedding vector
    }>
  ): Promise<any[]> {
    repoLogger.debug('Creating chunks for card', { cardId, chunkCount: chunks.length });
    
    // First clear any existing chunks
    await prisma.chunk.deleteMany({
      where: { cardId }
    });
    
    // Create new chunks
    const createdChunks = await Promise.all(
      chunks.map(chunk => 
        prisma.chunk.create({
          data: {
            content: chunk.content,
            order: chunk.order,
            embedding: chunk.embedding,
            card: { connect: { id: cardId } }
          }
        })
      )
    );
    
    return createdChunks;
  }
}
