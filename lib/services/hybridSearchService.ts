import { logger } from '../logger';
import { embeddingService, VectorSearchOptions, VectorSearchResult } from './embeddingService';
import { prisma } from '../db';
import { TechnologyCategory } from '@prisma/client';

// Create a service-specific logger
const searchLogger = logger.child({ service: 'HybridSearchService' });

/**
 * Hybrid search service combining keyword and vector similarity search
 * Uses Reciprocal Rank Fusion (RRF) to merge results
 */
export class HybridSearchService {
  private readonly k: number; // RRF parameter
  private readonly keywordWeight: number;
  private readonly vectorWeight: number;

  constructor(options?: {
    k?: number;
    keywordWeight?: number;
    vectorWeight?: number;
  }) {
    this.k = options?.k || 60; // Standard RRF k value
    this.keywordWeight = options?.keywordWeight || 0.4;
    this.vectorWeight = options?.vectorWeight || 0.6;
  }

  /**
   * Perform hybrid search combining keyword and vector similarity
   */
  public async hybridSearch(options: HybridSearchOptions): Promise<HybridSearchResult[]> {
    searchLogger.info('Starting hybrid search', {
      query: options.query,
      limit: options.limit,
      keywordWeight: this.keywordWeight,
      vectorWeight: this.vectorWeight
    });

    try {
      // Perform both searches in parallel
      const [keywordResults, vectorResults] = await Promise.all([
        this.performKeywordSearch(options),
        this.performVectorSearch(options)
      ]);

      // Combine results using Reciprocal Rank Fusion
      const combinedResults = this.combineWithRRF(keywordResults, vectorResults, options.limit);

      // Enhance results with additional metadata
      const enhancedResults = await this.enhanceResults(combinedResults, options);

      searchLogger.info('Hybrid search completed', {
        query: options.query,
        keywordResults: keywordResults.length,
        vectorResults: vectorResults.length,
        combinedResults: enhancedResults.length
      });

      return enhancedResults;
    } catch (error) {
      searchLogger.error('Hybrid search failed', { options, error });
      throw new Error(`Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for content within specific technology categories
   */
  public async searchByTechnologyCategory(options: {
    query: string;
    categories: TechnologyCategory[];
    limit?: number;
  }): Promise<HybridSearchResult[]> {
    searchLogger.debug('Technology category search', {
      query: options.query,
      categories: options.categories
    });

    // Get assets in the specified categories
    const assets = await prisma.asset.findMany({
      where: {
        category: { in: options.categories }
      },
      include: {
        themes: {
          include: {
            cards: {
              include: {
                chunks: true
              }
            }
          }
        }
      }
    });

    // Extract card IDs for filtering
    const cardIds = assets.flatMap((asset: any) => 
      asset.themes.flatMap((theme: any) => 
        theme.cards.map((card: any) => card.id)
      )
    );

    if (cardIds.length === 0) {
      return [];
    }

    // Perform hybrid search with card ID filtering
    return this.hybridSearch({
      query: options.query,
      cardIds,
      limit: options.limit || 20
    });
  }

  /**
   * Find content relevant to asset-scenario analysis
   */
  public async searchForMatrixAnalysis(options: {
    assetId: string;
    scenarioId: string;
    query?: string;
    limit?: number;
  }): Promise<HybridSearchResult[]> {
    searchLogger.debug('Matrix analysis search', {
      assetId: options.assetId,
      scenarioId: options.scenarioId,
      query: options.query
    });

    // If no specific query, search for relevant analysis content
    const searchQuery = options.query || 'impact analysis technology disruption market change';

    return this.hybridSearch({
      query: searchQuery,
      assetId: options.assetId,
      scenarioId: options.scenarioId,
      limit: options.limit || 15,
      includeAnalysisContext: true
    });
  }

  /**
   * Get content recommendations based on user's portfolio
   */
  public async getContentRecommendations(options: {
    userId: string;
    limit?: number;
  }): Promise<HybridSearchResult[]> {
    searchLogger.debug('Content recommendations', { userId: options.userId });

    try {
      // Get user's assets and their categories
      const userAssets = await prisma.asset.findMany({
        where: { userId: options.userId },
        select: { 
          id: true, 
          name: true, 
          category: true, 
          description: true 
        }
      });

      if (userAssets.length === 0) {
        return [];
      }

      // Create search queries based on user's assets
      const queries = this.generateRecommendationQueries(userAssets);
      
      // Perform searches for each query and combine results
      const allResults: HybridSearchResult[] = [];
      
      for (const query of queries) {
        const results = await this.hybridSearch({
          query,
          limit: Math.ceil((options.limit || 20) / queries.length),
          excludeUserContent: options.userId
        });
        allResults.push(...results);
      }

      // Deduplicate and sort by relevance
      const uniqueResults = this.deduplicateResults(allResults);
      
      return uniqueResults
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, options.limit || 20);
    } catch (error) {
      searchLogger.error('Content recommendations failed', { userId: options.userId, error });
      return [];
    }
  }

  // Private helper methods

  /**
   * Perform keyword-based search
   */
  private async performKeywordSearch(options: HybridSearchOptions): Promise<KeywordSearchResult[]> {
    const limit = Math.min((options.limit || 20) * 2, 100); // Get more for better RRF
    
    // Build search conditions
    const whereConditions: any = {
      content: {
        contains: options.query,
        mode: 'insensitive'
      }
    };

    if (options.cardIds && options.cardIds.length > 0) {
      whereConditions.cardId = { in: options.cardIds };
    }

    // Include related data for filtering
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
      where: whereConditions,
      include,
      take: limit,
      orderBy: {
        order: 'asc'
      }
    });

    // Filter and score results
    const results = chunks
      .filter((chunk: any) => {
        if (options.themeId && chunk.card.themeId !== options.themeId) return false;
        if (options.assetId && chunk.card.theme.assetId !== options.assetId) return false;
        if (options.scenarioId && chunk.card.theme.scenarioId !== options.scenarioId) return false;
        if (options.excludeUserContent && chunk.card.theme.asset?.userId === options.excludeUserContent) return false;
        return true;
      })
      .map((chunk: any, index: number) => ({
        id: chunk.id,
        content: chunk.content,
        cardId: chunk.cardId,
        cardTitle: chunk.card.title,
        score: this.calculateKeywordScore(options.query, chunk.content),
        rank: index + 1,
        order: chunk.order,
        metadata: {
          assetId: chunk.card.theme.assetId,
          assetName: chunk.card.theme.asset?.name,
          scenarioId: chunk.card.theme.scenarioId,
          scenarioName: chunk.card.theme.scenario?.name,
          themeId: chunk.card.themeId,
          themeName: chunk.card.theme.name
        }
      }))
      .sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Perform vector similarity search
   */
  private async performVectorSearch(options: HybridSearchOptions): Promise<VectorSearchResult[]> {
    const vectorOptions: VectorSearchOptions = {
      query: options.query,
      limit: Math.min((options.limit || 20) * 2, 100), // Get more for better RRF
      threshold: 0.5, // Lower threshold for more results
      cardIds: options.cardIds,
      themeId: options.themeId,
      assetId: options.assetId,
      scenarioId: options.scenarioId
    };

    return embeddingService.vectorSearch(vectorOptions);
  }

  /**
   * Combine results using Reciprocal Rank Fusion (RRF)
   */
  private combineWithRRF(
    keywordResults: KeywordSearchResult[],
    vectorResults: VectorSearchResult[],
    limit?: number
  ): RRFResult[] {
    const combinedScores: Map<string, RRFResult> = new Map();

    // Process keyword results
    keywordResults.forEach((result, index) => {
      const rrf = 1 / (this.k + index + 1);
      const existing = combinedScores.get(result.id);
      
      if (existing) {
        existing.keywordScore = result.score;
        existing.keywordRank = index + 1;
        existing.rrf += this.keywordWeight * rrf;
      } else {
        combinedScores.set(result.id, {
          id: result.id,
          content: result.content,
          cardId: result.cardId,
          cardTitle: result.cardTitle,
          keywordScore: result.score,
          vectorScore: 0,
          keywordRank: index + 1,
          vectorRank: null,
          rrf: this.keywordWeight * rrf,
          order: result.order,
          metadata: result.metadata
        });
      }
    });

    // Process vector results
    vectorResults.forEach((result, index) => {
      const rrf = 1 / (this.k + index + 1);
      const existing = combinedScores.get(result.id);
      
      if (existing) {
        existing.vectorScore = result.similarity;
        existing.vectorRank = index + 1;
        existing.rrf += this.vectorWeight * rrf;
      } else {
        combinedScores.set(result.id, {
          id: result.id,
          content: result.content,
          cardId: result.cardId,
          cardTitle: result.cardTitle,
          keywordScore: 0,
          vectorScore: result.similarity,
          keywordRank: null,
          vectorRank: index + 1,
          rrf: this.vectorWeight * rrf,
          order: result.order,
          metadata: {}
        });
      }
    });

    // Sort by RRF score and limit results
    return Array.from(combinedScores.values())
      .sort((a, b) => b.rrf - a.rrf)
      .slice(0, limit || 20);
  }

  /**
   * Enhance results with additional metadata and scoring
   */
  private async enhanceResults(
    rrfResults: RRFResult[],
    options: HybridSearchOptions
  ): Promise<HybridSearchResult[]> {
    return rrfResults.map(result => ({
      id: result.id,
      content: result.content,
      cardId: result.cardId,
      cardTitle: result.cardTitle,
      hybridScore: result.rrf,
      keywordScore: result.keywordScore,
      vectorScore: result.vectorScore,
      keywordRank: result.keywordRank,
      vectorRank: result.vectorRank,
      order: result.order,
      relevance: this.calculateRelevance(result, options),
      context: this.extractContext(result.content, options.query),
      metadata: result.metadata
    }));
  }

  /**
   * Calculate keyword search score
   */
  private calculateKeywordScore(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    
    // Exact phrase matching (highest weight)
    if (contentLower.includes(query.toLowerCase())) {
      score += 2.0;
    }
    
    // Individual word matching
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1.0 / queryWords.length;
      }
    });
    
    // Proximity scoring (words appearing close together)
    score += this.calculateProximityScore(queryWords, contentLower);
    
    // Length normalization
    score = score / Math.log(content.length + 1);
    
    return score;
  }

  /**
   * Calculate proximity score for words
   */
  private calculateProximityScore(queryWords: string[], content: string): number {
    if (queryWords.length < 2) return 0;
    
    let proximityScore = 0;
    const words = content.split(/\s+/);
    
    for (let i = 0; i < queryWords.length - 1; i++) {
      const word1 = queryWords[i];
      const word2 = queryWords[i + 1];
      
      const pos1 = words.findIndex(w => w.includes(word1));
      const pos2 = words.findIndex(w => w.includes(word2));
      
      if (pos1 !== -1 && pos2 !== -1) {
        const distance = Math.abs(pos2 - pos1);
        proximityScore += 1 / (distance + 1);
      }
    }
    
    return proximityScore / (queryWords.length - 1);
  }

  /**
   * Calculate overall relevance score
   */
  private calculateRelevance(result: RRFResult, options: HybridSearchOptions): 'high' | 'medium' | 'low' {
    if (result.rrf > 0.05 && (result.keywordScore > 0.5 || result.vectorScore > 0.8)) {
      return 'high';
    } else if (result.rrf > 0.02) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Extract relevant context around query terms
   */
  private extractContext(content: string, query: string): string {
    const words = content.split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Find the best matching position
    let bestPos = 0;
    let bestScore = 0;
    
    for (let i = 0; i < words.length; i++) {
      let score = 0;
      queryWords.forEach(qWord => {
        if (words[i]?.toLowerCase().includes(qWord)) {
          score += 1;
        }
      });
      if (score > bestScore) {
        bestScore = score;
        bestPos = i;
      }
    }
    
    // Extract context around best position
    const start = Math.max(0, bestPos - 20);
    const end = Math.min(words.length, bestPos + 20);
    const context = words.slice(start, end).join(' ');
    
    return context.length > 200 ? context.substring(0, 200) + '...' : context;
  }

  /**
   * Generate recommendation queries based on user assets
   */
  private generateRecommendationQueries(assets: any[]): string[] {
    const queries: string[] = [];
    
    // Group assets by category
    const categoryGroups: Record<string, any[]> = {};
    assets.forEach(asset => {
      if (asset.category) {
        if (!categoryGroups[asset.category]) {
          categoryGroups[asset.category] = [];
        }
        categoryGroups[asset.category].push(asset);
      }
    });
    
    // Generate category-based queries
    Object.entries(categoryGroups).forEach(([category, categoryAssets]) => {
      queries.push(`${category} technology trends analysis`);
      queries.push(`${category} market disruption impact`);
      
      // Add specific asset-based queries
      categoryAssets.slice(0, 2).forEach(asset => {
        queries.push(`${asset.name} competitive analysis`);
      });
    });
    
    return queries.slice(0, 5); // Limit to top 5 queries
  }

  /**
   * Remove duplicate results based on content similarity
   */
  private deduplicateResults(results: HybridSearchResult[]): HybridSearchResult[] {
    const seen = new Set<string>();
    const unique: HybridSearchResult[] = [];
    
    for (const result of results) {
      // Create a simple content hash for deduplication
      const contentHash = result.content.substring(0, 100).toLowerCase().replace(/\s+/g, '');
      
      if (!seen.has(contentHash)) {
        seen.add(contentHash);
        unique.push(result);
      }
    }
    
    return unique;
  }
}

// Type definitions

export interface HybridSearchOptions {
  query: string;
  limit?: number;
  cardIds?: string[];
  themeId?: string;
  assetId?: string;
  scenarioId?: string;
  excludeUserContent?: string; // User ID to exclude
  includeAnalysisContext?: boolean;
}

export interface HybridSearchResult {
  id: string;
  content: string;
  cardId: string;
  cardTitle: string;
  hybridScore: number;
  keywordScore: number;
  vectorScore: number;
  keywordRank: number | null;
  vectorRank: number | null;
  order: number;
  relevance: 'high' | 'medium' | 'low';
  context: string;
  metadata: {
    assetId?: string;
    assetName?: string;
    scenarioId?: string;
    scenarioName?: string;
    themeId?: string;
    themeName?: string;
    [key: string]: any;
  };
}

interface KeywordSearchResult {
  id: string;
  content: string;
  cardId: string;
  cardTitle: string;
  score: number;
  rank: number;
  order: number;
  metadata: any;
}

interface RRFResult {
  id: string;
  content: string;
  cardId: string;
  cardTitle: string;
  keywordScore: number;
  vectorScore: number;
  keywordRank: number | null;
  vectorRank: number | null;
  rrf: number;
  order: number;
  metadata: any;
}

// Export a default instance
export const hybridSearchService = new HybridSearchService();

// Utility functions
export function optimizeSearchQuery(query: string): string {
  // Remove common stop words and normalize
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .join(' ');
}

export function calculateSearchRelevanceThreshold(userPreferences?: any): number {
  // Dynamic threshold based on user preferences
  return userPreferences?.strict ? 0.7 : 0.5;
} 