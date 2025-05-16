import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { logger } from '../logger';

// Manual Domain enum definition (to match schema.prisma)
// Can be removed after regenerating Prisma client
enum Domain {
  ASSET = 'ASSET',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  GEOGRAPHY = 'GEOGRAPHY',
  OTHER = 'OTHER'
}

const vectorLogger = logger.child({ component: 'VectorClient' });

/**
 * Performs a vector similarity search against chunk embeddings in the database
 * 
 * @param q The query to search for
 * @param k The number of results to return
 * @param domain Optional domain filter to restrict results by category
 * @returns A promise resolving to an array of results with similarity scores
 */
export async function similaritySearch(
  q: string, 
  k: number = 20, 
  domain?: Domain
): Promise<Array<{ id: string; similarity: number }>> {
  try {
    // For a real implementation, this would call OpenAI or similar
    // to generate a proper embedding vector
    const queryEmbedding = await generateEmbedding(q);
    
    if (!queryEmbedding) {
      return [];
    }
    
    // Build the domain filter clause if a domain is specified
    const domainFilter = domain ? Prisma.sql`AND ch.domain = ${domain}` : Prisma.empty;
    
    // The vector search query with optional domain filter
    const results = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>(
      Prisma.sql`
        SELECT ch.card_id as id, 1 - (ch.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "Chunk" ch
        JOIN "Card" c ON ch.card_id = c.id
        JOIN "Theme" t ON c.theme_id = t.id
        WHERE ch.embedding IS NOT NULL
        ${domainFilter}
        ORDER BY similarity DESC
        LIMIT ${k}
      `
    );
    
    return results;
  } catch (error) {
    vectorLogger.error('Error during vector similarity search:', { error, query: q });
    throw error;
  }
}

/**
 * Generates an embedding for the given text
 * In a real implementation, this would call an external API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // Placeholder - in a real implementation, this would call OpenAI or similar
  // to generate a proper embedding vector
  return Array(1536).fill(0).map(() => Math.random() - 0.5);
}

// Export as getQueryEmbedding for use in searchService
export const getQueryEmbedding = generateEmbedding;
