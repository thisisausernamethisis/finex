import { Prisma } from '@prisma/client';
import { prisma } from '../db';

/**
 * Performs a hybrid search using both text-based and vector-based retrieval,
 * fusing the results with Reciprocal Rank Fusion (RRF)
 *
 * @param opts Options including the query, optional filters, and limit
 * @returns Promise resolving to an array of results with scores
 */
export async function hybridSearch(opts: {
  query: string;
  assetId?: string;
  scenarioId?: string;
  limit?: number;
}): Promise<Array<{ id: string; score: number }>> {
  const { query, assetId, scenarioId, limit = 20 } = opts;
  
  // Define the RRF constant k
  const k = 60;
  
  // 1. Text-based search using tsvector
  const textResults = await textSearch(query, assetId, scenarioId, limit);
  
  // 2. Vector-based search using pgvector
  const vectorResults = await vectorSearch(query, assetId, scenarioId, limit);
  
  // 3. Fuse results with RRF
  const combined = fuseResults(textResults, vectorResults, k, limit);
  
  return combined;
}

/**
 * Performs text-based search using PostgreSQL's tsvector capabilities
 */
async function textSearch(
  query: string,
  assetId?: string,
  scenarioId?: string,
  limit = 20
): Promise<Array<{ id: string; rank: number }>> {
  // Convert the query to a tsquery compatible format
  const tsQuery = query
    .replace(/[&|!():*]/g, ' ')
    .trim()
    .split(/\s+/)
    .join(' | ');
  
  if (!tsQuery) {
    return [];
  }
  
  // Build the where clause for filtering by asset or scenario
  let whereClause = '';
  const params: any[] = [tsQuery];
  
  if (assetId) {
    whereClause = 'AND t.asset_id = ?';
    params.push(assetId);
  } else if (scenarioId) {
    whereClause = 'AND t.scenario_id = ?';
    params.push(scenarioId);
  }
  
  // Execute the full-text search with ranking
  const results = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT c.id, ts_rank(to_tsvector('english', c.content), to_tsquery('english', ${tsQuery})) as rank
    FROM "Card" c
    JOIN "Theme" t ON c.theme_id = t.id
    WHERE to_tsvector('english', c.content) @@ to_tsquery('english', ${tsQuery})
    ${Prisma.raw(whereClause)}
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
  
  return results;
}

/**
 * Performs vector-based search using pgvector
 */
async function vectorSearch(
  query: string,
  assetId?: string,
  scenarioId?: string,
  limit = 20
): Promise<Array<{ id: string; similarity: number }>> {
  // For this implementation, assume we first need to generate an embedding for the query
  // This would typically involve calling an external API (OpenAI, etc.)
  // For the sake of this example, we'll simulate having the embedding
  
  // Mock embedding generation - in real implementation, call OpenAI or similar
  const queryEmbedding = await generateEmbedding(query);
  
  if (!queryEmbedding) {
    return [];
  }
  
  // Build the where clause for filtering by asset or scenario
  let whereClause = '';
  const params: any[] = [queryEmbedding];
  
  if (assetId) {
    whereClause = 'AND t.asset_id = ?';
    params.push(assetId);
  } else if (scenarioId) {
    whereClause = 'AND t.scenario_id = ?';
    params.push(scenarioId);
  }
  
  // Execute the vector search
  const results = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
    SELECT ch.card_id as id, 1 - (ch.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "Chunk" ch
    JOIN "Card" c ON ch.card_id = c.id
    JOIN "Theme" t ON c.theme_id = t.id
    WHERE ch.embedding IS NOT NULL
    ${Prisma.raw(whereClause)}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;
  
  return results;
}

/**
 * Fuses search results using Reciprocal Rank Fusion (RRF)
 */
function fuseResults(
  textResults: Array<{ id: string; rank: number }>,
  vectorResults: Array<{ id: string; similarity: number }>,
  k: number,
  limit: number
): Array<{ id: string; score: number }> {
  const fusedScores = new Map<string, number>();
  
  // Process text search results
  textResults.forEach((item, i) => {
    const rrfScore = 1 / (k + i + 1);
    fusedScores.set(item.id, (fusedScores.get(item.id) || 0) + rrfScore);
  });
  
  // Process vector search results
  vectorResults.forEach((item, i) => {
    const rrfScore = 1 / (k + i + 1);
    fusedScores.set(item.id, (fusedScores.get(item.id) || 0) + rrfScore);
  });
  
  // Convert map to array and sort by score
  const results = Array.from(fusedScores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
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
