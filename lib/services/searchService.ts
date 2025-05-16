import { Prisma } from '@prisma/client';
// Manual Domain enum definition to match schema.prisma
// Can be removed after Prisma client regeneration
enum Domain {
  ASSET = 'ASSET',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  GEOGRAPHY = 'GEOGRAPHY',
  OTHER = 'OTHER'
}
import { getQueryEmbedding } from '../clients/vectorClient';
import { prisma } from '../db';
import { performance } from 'node:perf_hooks';
import { cacheGet, cacheSet, makeCacheKey } from './cacheService';
import { logger } from '../logger';
import { searchLatency, searchQueriesTotal } from '../metrics';
import { scoreMerge } from '../utils/alphaScorer';

// Logger for search operations
const searchLogger = logger.child({ component: 'SearchService' });

/**
 * Performs a hybrid search using both text-based and vector-based retrieval,
 * fusing the results with Reciprocal Rank Fusion (RRF)
 *
 * Uses Redis caching to improve performance for repeated queries
 *
 * @param opts Options including the query, optional filters, domain, and limit
 * @returns Promise resolving to an array of results with scores
 */
export async function hybridSearch(opts: {
  query: string;
  assetId?: string;
  scenarioId?: string;
  domain?: Domain;
  limit?: number;
}): Promise<Array<{ id: string; score: number }>> {
  const { query, assetId, scenarioId, domain, limit = 20 } = opts;
  const startTime = performance.now();
  
  try {
    // Increment search query counter
    searchQueriesTotal.inc({ type: 'hybrid' });
    
    // Create metadata object for cache key generation
    const metadata = { assetId, scenarioId, domain, limit };
    const cacheKey = makeCacheKey(query, metadata);
    
    // Check cache first
    const cachedResults = await cacheGet<Array<{ id: string; score: number }>>(cacheKey);
    if (cachedResults) {
      searchLogger.debug('Cache hit for search query', { query, metadata });
      
      // Record search latency including cache retrieval
      const latency = (performance.now() - startTime) / 1000;
      searchLatency.set({ type: 'hybrid_cached' }, latency);
      
      return cachedResults;
    }
    
    searchLogger.debug('Cache miss for search query', { query, metadata });
    
    // T-305: Run text-based and vector searches in parallel
    const [textResults, vectorResults] = await Promise.all([
      textSearch(query, assetId, scenarioId, domain, limit),
      vectorSearch(query, limit, domain)
    ]);
    
    // T-303: Use dynamic alpha scorer for merging results
    const combined = await scoreMerge(
      vectorResults.map(item => ({ id: item.id, score: item.similarity })),
      textResults.map(item => ({ id: item.id, score: item.rank })),
      { domain: domain as string | undefined }
    );
    
    // Limit results to requested size
    const finalResults = combined.slice(0, limit);
    
    // Store in cache (use 5 minutes TTL)
    await cacheSet(cacheKey, combined, 300);
    
    // Record search latency for uncached search
    const latency = (performance.now() - startTime) / 1000;
    searchLatency.set({ type: 'hybrid_uncached' }, latency);
    
    return combined;
  } catch (error) {
    searchLogger.error('Search error', { 
      query, 
      assetId, 
      scenarioId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Record failure latency
    const latency = (performance.now() - startTime) / 1000;
    searchLatency.set({ type: 'hybrid_error' }, latency);
    
    throw error;
  }
}

/**
 * Performs text-based search using PostgreSQL's tsvector capabilities
 */
async function textSearch(
  query: string,
  assetId?: string,
  scenarioId?: string,
  domain?: Domain,
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
  
  // Build the where clauses for filtering
  let assetScenarioClause = Prisma.empty;
  if (assetId) {
    assetScenarioClause = Prisma.sql`AND t.asset_id = ${assetId}`;
  } else if (scenarioId) {
    assetScenarioClause = Prisma.sql`AND t.scenario_id = ${scenarioId}`;
  }
  
  // Add domain filter if specified
  const domainFilter = domain ? Prisma.sql`AND ch.domain = ${domain}` : Prisma.empty;
  
  // Execute the full-text search with ranking
  const results = await prisma.$queryRaw<Array<{ id: string; rank: number }>>(
    Prisma.sql`
      SELECT c.id, ts_rank(to_tsvector('english', c.content), to_tsquery('english', ${tsQuery})) as rank
      FROM "Card" c
      JOIN "Theme" t ON c.theme_id = t.id
      LEFT JOIN "Chunk" ch ON ch.card_id = c.id
      WHERE to_tsvector('english', c.content) @@ to_tsquery('english', ${tsQuery})
      ${assetScenarioClause}
      ${domainFilter}
      ORDER BY rank DESC
      LIMIT ${limit}
    `
  );
  
  return results;
}

import { similaritySearch as vectorSimilaritySearch } from '../clients/vectorClient';

/**
 * Performs vector-based search using pgvector
 */
export async function vectorSearch(query: string, k = 5, domain?: Domain): Promise<Array<{ id: string; similarity: number }>> {
  const embedding = await getQueryEmbedding(query);
  const filter = domain ? Prisma.sql`AND "domain" = ${domain}` : Prisma.empty;
  const results = await prisma.$queryRaw<Array<{ id: string; score: number }>>`
    SELECT id,
           1 - (embedding <=> ${Prisma.join(embedding)}) AS score
    FROM   "Chunk"
    WHERE  embedding IS NOT NULL
      ${filter}
    ORDER  BY score DESC
    LIMIT  ${k};
  `;
  
  // Convert score to similarity for consistent naming
  return results.map(item => ({
    id: item.id,
    similarity: item.score
  }));
}

/**
 * Helper function to filter card IDs by assetId or scenarioId
 */
async function getFilteredCardIds(
  cardIds: string[], 
  assetId?: string, 
  scenarioId?: string
): Promise<string[]> {
  if (!cardIds.length) return [];
  
  const where: any = {
    id: { in: cardIds }
  };
  
  if (assetId) {
    where.theme = { asset: { id: assetId } };
  } else if (scenarioId) {
    where.theme = { scenario: { id: scenarioId } };
  }
  
  const cards = await prisma.card.findMany({
    where,
    select: { id: true }
  });
  
  return cards.map(card => card.id);
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
