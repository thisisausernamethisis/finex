import { logger } from '../logger';
import { ProcessedChunk, optimizeChunkForEmbedding } from './chunkingService';
import { prisma } from '../db';

// Create a service-specific logger
const embeddingLogger = logger.child({ service: 'EmbeddingService' });

// Simplified embedding service that works without OpenAI for now
// In Phase 3, we'll add full OpenAI integration and pgvector support

/**
 * Embedding service for vector generation and storage
 * Currently using mock embeddings until OpenAI integration is complete
 */
export class EmbeddingService {
  private readonly batchSize: number;

  constructor(options?: {
    batchSize?: number;
  }) {
    this.batchSize = options?.batchSize || 20;
  }

  /**
   * Generate and store embeddings for processed chunks
   * Currently using mock embeddings for development
   */
  public async generateAndStoreEmbeddings(
    chunks: ProcessedChunk[],
    cardId: string
  ): Promise<StoredEmbedding[]> {
    embeddingLogger.info('Starting embedding generation (mock)', {
      cardId,
      chunkCount: chunks.length
    });

    try {
      // Delete existing chunks for this card
      await this.deleteExistingChunks(cardId);

      // Process chunks and create database entries
      const results: StoredEmbedding[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate mock embedding (1536 dimensions for text-embedding-ada-002 compatibility)
        const mockEmbedding = this.generateMockEmbedding(chunk.content);
        
        // Create chunk in database
        const storedChunk = await prisma.chunk.create({
          data: {
            content: chunk.content,
            order: chunk.order,
            cardId: cardId
          }
        });

        results.push({
          id: storedChunk.id,
          content: chunk.content,
          embedding: mockEmbedding,
          metadata: chunk.metadata
        });
      }

      embeddingLogger.info('Successfully generated and stored mock embeddings', {
        cardId,
        embeddingsCreated: results.length
      });

      return results;
    } catch (error) {
      embeddingLogger.error('Failed to generate embeddings', { cardId, error });
      throw new Error(`Embedding generation failed for card ${cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate mock embedding for a single text
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    embeddingLogger.debug('Generating mock embedding', { textLength: text.length });
    return this.generateMockEmbedding(text);
  }

  /**
   * Perform vector similarity search using mock similarity
   */
  public async vectorSearch(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    embeddingLogger.debug('Performing mock vector search', {
      query: options.query,
      limit: options.limit
    });

    try {
      // For now, do a simple text-based search using Prisma
      const results = await this.performTextSearch(options);

      embeddingLogger.info('Mock vector search completed', {
        query: options.query,
        resultsFound: results.length
      });

      return results;
    } catch (error) {
      embeddingLogger.error('Vector search failed', { options, error });
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update embeddings for a specific card
   */
  public async updateCardEmbeddings(
    cardId: string,
    chunks: ProcessedChunk[]
  ): Promise<void> {
    embeddingLogger.info('Updating card embeddings', { cardId, newChunkCount: chunks.length });
    await this.generateAndStoreEmbeddings(chunks, cardId);
  }

  /**
   * Delete all embeddings for a card
   */
  public async deleteCardEmbeddings(cardId: string): Promise<void> {
    embeddingLogger.info('Deleting card embeddings', { cardId });
    await this.deleteExistingChunks(cardId);
  }

  /**
   * Get embedding statistics for monitoring
   */
  public async getEmbeddingStats(): Promise<EmbeddingStats> {
    const stats = await prisma.$queryRaw<Array<{
      total_chunks: bigint;
      total_cards: bigint;
      avg_chunk_length: number;
    }>>`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT "cardId") as total_cards,
        AVG(LENGTH(content)) as avg_chunk_length
      FROM "Chunk"
    `;

    const result = stats[0];
    return {
      totalChunks: Number(result?.total_chunks || 0),
      totalCards: Number(result?.total_cards || 0),
      averageChunkLength: result?.avg_chunk_length || 0
    };
  }

  // Private helper methods

  /**
   * Generate a deterministic mock embedding based on content
   */
  private generateMockEmbedding(content: string): number[] {
    // Create a simple hash-based mock embedding
    const embedding: number[] = [];
    const words = content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    // Generate 1536 dimensions (same as text-embedding-ada-002)
    for (let i = 0; i < 1536; i++) {
      let value = 0;
      
      // Use words to influence embedding values
      words.forEach((word, wordIndex) => {
        const charSum = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        value += Math.sin((charSum * (i + 1) * (wordIndex + 1)) / 1000) * 0.1;
      });
      
      // Add some content-length based variation
      value += Math.sin((content.length * (i + 1)) / 100) * 0.05;
      
      // Normalize to reasonable range
      embedding.push(Math.tanh(value));
    }
    
    return embedding;
  }

  /**
   * Perform text-based search as fallback for vector search
   */
  private async performTextSearch(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const limit = options.limit || 10;
    
    // Build where conditions for filtering
    const whereConditions: any = {};
    
    if (options.cardIds && options.cardIds.length > 0) {
      whereConditions.cardId = { in: options.cardIds };
    }
    
    // Join with card and theme to access asset/scenario filters
    const include = {
      card: {
        include: {
          theme: {
            include: {
              asset: true,
              scenario: true
            }
          }
        }
      }
    };

    const chunks = await prisma.chunk.findMany({
      where: {
        ...whereConditions,
        content: {
          contains: options.query,
          mode: 'insensitive'
        }
      },
      include,
      take: limit,
      orderBy: {
        order: 'asc'
      }
    });

    // Filter by additional criteria and calculate mock similarity
    const results = chunks
      .filter(chunk => {
        if (options.themeId && chunk.card.themeId !== options.themeId) return false;
        if (options.assetId && chunk.card.theme.assetId !== options.assetId) return false;
        if (options.scenarioId && chunk.card.theme.scenarioId !== options.scenarioId) return false;
        return true;
      })
      .map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        cardId: chunk.cardId,
        cardTitle: chunk.card.title,
        similarity: this.calculateTextSimilarity(options.query, chunk.content),
        order: chunk.order
      }))
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  }

  /**
   * Calculate simple text similarity score
   */
  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    queryWords.forEach(word => {
      if (contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))) {
        matches++;
      }
    });
    
    return matches / queryWords.length;
  }

  /**
   * Delete existing chunks for a card
   */
  private async deleteExistingChunks(cardId: string): Promise<void> {
    await prisma.chunk.deleteMany({
      where: { cardId }
    });
  }
}

// Type definitions

export interface VectorSearchOptions {
  query: string;
  limit?: number;
  threshold?: number; // Similarity threshold (0-1)
  cardIds?: string[];
  themeId?: string;
  assetId?: string;
  scenarioId?: string;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  cardId: string;
  cardTitle: string;
  similarity: number;
  order: number;
}

export interface StoredEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata: any;
}

export interface EmbeddingStats {
  totalChunks: number;
  totalCards: number;
  averageChunkLength: number;
}

// Export a default instance
export const embeddingService = new EmbeddingService();

// Utility functions for embedding management
export async function ensureEmbeddingsExist(cardId: string): Promise<boolean> {
  const chunkCount = await prisma.chunk.count({
    where: { cardId }
  });
  
  return chunkCount > 0;
}

export async function getEmbeddingDimensions(): Promise<number> {
  // text-embedding-ada-002 produces 1536-dimensional vectors
  return 1536;
} 