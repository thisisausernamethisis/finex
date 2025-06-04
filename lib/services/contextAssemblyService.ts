import { prisma } from '../db';
import { logger } from '../logger';
import { hybridSearch } from './searchService';
import { chunkingService, ProcessedChunk } from './chunkingService';
import { embeddingService } from './embeddingService';
import { hybridSearchService, HybridSearchResult } from './hybridSearchService';

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'ContextAssemblyService' });

/**
 * Assembles a context string for matrix analysis from asset and scenario data
 * This includes asset details, scenario details, and relevant evidence from cards and chunks
 * 
 * @param assetId The ID of the asset
 * @param scenarioId The ID of the scenario
 * @param tokenLimit The approximate maximum number of tokens to include (based on character count)
 * @returns A formatted context string ready for AI processing
 */
export async function assembleMatrixContext(
  assetId: string,
  scenarioId: string,
  tokenLimit: number = 8000
): Promise<string> {
  serviceLogger.debug('Assembling matrix context', { assetId, scenarioId, tokenLimit });
  
  try {
    // Fetch asset and scenario data
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
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
    
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
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
    
    if (!asset || !scenario) {
      throw new Error(`Asset or scenario not found: assetId=${assetId}, scenarioId=${scenarioId}`);
    }
    
    // Start building the context string
    let context = `# ASSET: ${asset.name}\n\n`;
    context += `${asset.description || 'No description available.'}\n\n`;
    
    context += `# SCENARIO: ${scenario.name}\n\n`;
    context += `${scenario.description || 'No description available.'}\n\n`;
    
    // Perform a hybrid search to find the most relevant content for this pair
    const relevantItems = await hybridSearch({
      query: `${asset.name} ${scenario.name}`,
      assetId,
      scenarioId,
      limit: 50  // Get a good number of results to work with
    });
    
    // Keep track of characters/tokens added
    let currentSize = context.length;
    const charPerToken = 4;  // Rough estimate: 1 token ≈ 4 chars in English
    const charLimit = tokenLimit * charPerToken;
    
    context += `# RELEVANT EVIDENCE\n\n`;
    
    // Track included cards to avoid duplication
    const includedCardIds = new Set<string>();
    
    // First add asset-related themes and cards
    if (asset.themes?.length) {
      for (const theme of asset.themes) {
        // Check if we're approaching the token limit
        if (currentSize >= charLimit * 0.9) break;
        
        context += `## ASSET THEME: ${theme.name}\n`;
        if (theme.description) {
          context += `${theme.description}\n\n`;
        }
        
        // Add cards for this theme
        for (const card of theme.cards || []) {
          // Skip if we've already included this card or if we're approaching the token limit
          if (includedCardIds.has(card.id) || currentSize >= charLimit * 0.9) continue;
          
          context += `### CARD ${card.id}: ${card.title}\n`;
          context += `${card.content}\n\n`;
          
          includedCardIds.add(card.id);
          currentSize += card.title.length + card.content.length;
        }
      }
    }
    
    // Then add scenario-related themes and cards
    if (scenario.themes?.length) {
      for (const theme of scenario.themes) {
        // Check if we're approaching the token limit
        if (currentSize >= charLimit * 0.9) break;
        
        context += `## SCENARIO THEME: ${theme.name}\n`;
        if (theme.description) {
          context += `${theme.description}\n\n`;
        }
        
        // Add cards for this theme
        for (const card of theme.cards || []) {
          // Skip if we've already included this card or if we're approaching the token limit
          if (includedCardIds.has(card.id) || currentSize >= charLimit * 0.9) continue;
          
          context += `### CARD ${card.id}: ${card.title}\n`;
          context += `${card.content}\n\n`;
          
          includedCardIds.add(card.id);
          currentSize += card.title.length + card.content.length;
        }
      }
    }
    
    // Finally, add any relevant cards found by search that weren't already included
    if (relevantItems.length) {
      context += `## SEARCH RESULTS\n\n`;
      
      for (const item of relevantItems) {
        // If we've already included this card or we're over the token limit, skip
        if (includedCardIds.has(item.id) || currentSize >= charLimit) continue;
        
        // Fetch the card details
        const card = await prisma.card.findUnique({
          where: { id: item.id },
          include: { chunks: true }
        });
        
        if (!card) continue;
        
        context += `### CARD ${card.id}: ${card.title} (Score: ${item.score.toFixed(2)})\n`;
        context += `${card.content}\n\n`;
        
        includedCardIds.add(card.id);
        currentSize += card.title.length + card.content.length;
      }
    }
    
    serviceLogger.info('Context assembly complete', {
      assetId,
      scenarioId,
      contextLength: context.length,
      includedCards: includedCardIds.size
    });
    
    return context;
  } catch (error) {
    serviceLogger.error('Error assembling matrix context', {
      error: error instanceof Error ? error.message : 'Unknown error',
      assetId,
      scenarioId
    });
    throw new Error(`Failed to assemble matrix context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Context assembly service for preparing AI analysis contexts
 * Combines evidence from multiple sources into coherent analysis contexts
 */
export class ContextAssemblyService {
  private readonly maxTokens: number;
  private readonly minRelevanceScore: number;

  constructor(options?: {
    maxTokens?: number;
    minRelevanceScore?: number;
  }) {
    this.maxTokens = options?.maxTokens || 4000; // Token limit for AI context
    this.minRelevanceScore = options?.minRelevanceScore || 0.3;
  }

  /**
   * Assemble matrix analysis context for asset-scenario pairs
   */
  public async assembleMatrixContext(
    assetId: string,
    scenarioId: string,
    options?: {
      focusQuery?: string;
      includeGlobalContext?: boolean;
      tokenLimit?: number;
    }
  ): Promise<MatrixAnalysisContext> {
    serviceLogger.info('Assembling matrix analysis context', {
      assetId,
      scenarioId,
      tokenLimit: options?.tokenLimit || this.maxTokens
    });

    try {
      // Get asset and scenario details
      const [asset, scenario] = await Promise.all([
        this.getAssetDetails(assetId),
        this.getScenarioDetails(scenarioId)
      ]);

      if (!asset || !scenario) {
        throw new Error(`Asset or scenario not found: ${assetId}, ${scenarioId}`);
      }

      // Gather relevant evidence from multiple sources
      const evidence = await this.gatherEvidence(assetId, scenarioId, {
        focusQuery: options?.focusQuery,
        includeGlobalContext: options?.includeGlobalContext
      });

      // Assemble the context with prioritization
      const context = this.assembleContext(asset, scenario, evidence, {
        tokenLimit: options?.tokenLimit || this.maxTokens
      });

      serviceLogger.info('Matrix analysis context assembled', {
        assetId,
        scenarioId,
        evidenceItems: evidence.length,
        contextTokens: this.estimateTokens(context.assembledContext)
      });

      return context;
    } catch (error) {
      serviceLogger.error('Failed to assemble matrix context', { assetId, scenarioId, error });
      throw new Error(`Context assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assemble portfolio analysis context
   */
  public async assemblePortfolioContext(
    userId: string,
    focusAreas?: string[],
    options?: {
      tokenLimit?: number;
      includeExternalInsights?: boolean;
    }
  ): Promise<PortfolioAnalysisContext> {
    serviceLogger.info('Assembling portfolio analysis context', {
      userId,
      focusAreas: focusAreas?.length || 0
    });

    try {
      // Get user's assets and their themes/cards
      const userAssets = await this.getUserAssetsWithContent(userId);
      
      if (userAssets.length === 0) {
        throw new Error('No assets found for user');
      }

      // Generate portfolio overview
      const portfolioOverview = this.generatePortfolioOverview(userAssets);

      // Gather relevant insights across all assets
      const insights = await this.gatherPortfolioInsights(userAssets, focusAreas);

      // Assemble comprehensive context
      const context = this.assemblePortfolioContextData(portfolioOverview, insights, {
        tokenLimit: options?.tokenLimit || this.maxTokens * 2 // Larger limit for portfolio
      });

      serviceLogger.info('Portfolio analysis context assembled', {
        userId,
        assetCount: userAssets.length,
        insightCount: insights.length,
        contextTokens: this.estimateTokens(context.assembledContext)
      });

      return context;
    } catch (error) {
      serviceLogger.error('Failed to assemble portfolio context', { userId, error });
      throw new Error(`Portfolio context assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assemble technology trend analysis context
   */
  public async assembleTechnologyTrendContext(
    technologyCategory: string,
    timeframe?: string,
    options?: {
      tokenLimit?: number;
      includeMarketData?: boolean;
    }
  ): Promise<TechnologyTrendContext> {
    serviceLogger.info('Assembling technology trend context', {
      technologyCategory,
      timeframe
    });

    try {
      // Search for relevant content across all assets in the category
      const trendEvidence = await hybridSearchService.searchByTechnologyCategory({
        query: `${technologyCategory} trends innovation disruption market impact`,
        categories: [technologyCategory as any], // Type assertion for now
        limit: 20
      });

      // Gather market and competitive insights
      const marketInsights = await this.gatherMarketInsights(technologyCategory, timeframe);

      // Assemble trend analysis context
      const context = this.assembleTrendContext(
        technologyCategory,
        trendEvidence,
        marketInsights,
        {
          tokenLimit: options?.tokenLimit || this.maxTokens,
          timeframe
        }
      );

      serviceLogger.info('Technology trend context assembled', {
        technologyCategory,
        evidenceItems: trendEvidence.length,
        marketInsights: marketInsights.length,
        contextTokens: this.estimateTokens(context.assembledContext)
      });

      return context;
    } catch (error) {
      serviceLogger.error('Failed to assemble technology trend context', { technologyCategory, error });
      throw new Error(`Technology trend context assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  /**
   * Get detailed asset information
   */
  private async getAssetDetails(assetId: string): Promise<AssetDetails | null> {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
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

    if (!asset) return null;

    return {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      category: asset.category as any,
      categoryConfidence: asset.categoryConfidence,
      categoryInsights: asset.categoryInsights,
      themes: asset.themes.map((theme: any) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        themeType: theme.themeType,
        cards: theme.cards.map((card: any) => ({
          id: card.id,
          title: card.title,
          content: card.content,
          importance: card.importance,
          chunkCount: card.chunks.length
        }))
      }))
    };
  }

  /**
   * Get detailed scenario information
   */
  private async getScenarioDetails(scenarioId: string): Promise<ScenarioDetails | null> {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
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

    if (!scenario) return null;

    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      type: scenario.type,
      timeline: scenario.timeline,
      probability: scenario.probability,
      themes: scenario.themes.map((theme: any) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        themeType: theme.themeType,
        cards: theme.cards.map((card: any) => ({
          id: card.id,
          title: card.title,
          content: card.content,
          importance: card.importance,
          chunkCount: card.chunks.length
        }))
      }))
    };
  }

  /**
   * Gather evidence from multiple sources
   */
  private async gatherEvidence(
    assetId: string,
    scenarioId: string,
    options?: {
      focusQuery?: string;
      includeGlobalContext?: boolean;
    }
  ): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = [];

    // Search for relevant content using focus query or default analysis terms
    const searchQuery = options?.focusQuery || 
      'impact analysis market disruption competitive advantage risk opportunity';

    const searchResults = await hybridSearchService.searchForMatrixAnalysis({
      assetId,
      scenarioId,
      query: searchQuery,
      limit: 15
    });

    // Convert search results to evidence items
    searchResults.forEach(result => {
      evidence.push({
        id: result.id,
        type: 'search_result',
        source: result.cardTitle,
        content: result.content,
        relevanceScore: result.hybridScore,
        metadata: {
          cardId: result.cardId,
          hybridScore: result.hybridScore,
          context: result.context
        }
      });
    });

    // Add global context if requested
    if (options?.includeGlobalContext) {
      const globalContext = await this.gatherGlobalContext(assetId, scenarioId);
      evidence.push(...globalContext);
    }

    // Sort by relevance and filter by minimum score
    return evidence
      .filter(item => item.relevanceScore >= this.minRelevanceScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Assemble context from asset, scenario, and evidence
   */
  private assembleContext(
    asset: AssetDetails,
    scenario: ScenarioDetails,
    evidence: EvidenceItem[],
    options: { tokenLimit: number }
  ): MatrixAnalysisContext {
    // Build context sections
    const sections: ContextSection[] = [];

    // Asset overview section
    sections.push({
      type: 'asset_overview',
      title: `Asset: ${asset.name}`,
      content: this.formatAssetOverview(asset),
      priority: 1
    });

    // Scenario overview section
    sections.push({
      type: 'scenario_overview',
      title: `Scenario: ${scenario.name}`,
      content: this.formatScenarioOverview(scenario),
      priority: 1
    });

    // Evidence sections (prioritized by relevance)
    evidence.slice(0, 10).forEach((item, index) => {
      sections.push({
        type: 'evidence',
        title: `Evidence ${index + 1}: ${item.source}`,
        content: item.content,
        priority: 2 + (index * 0.1), // Lower priority for later evidence
        metadata: item.metadata
      });
    });

    // Assemble final context within token limits
    const assembledContext = this.assembleWithinTokenLimit(sections, options.tokenLimit);

    return {
      assetId: asset.id,
      scenarioId: scenario.id,
      assembledContext,
      sections,
      evidenceCount: evidence.length,
      tokenCount: this.estimateTokens(assembledContext),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Format asset overview for context
   */
  private formatAssetOverview(asset: AssetDetails): string {
    let overview = `**${asset.name}**\n`;
    
    if (asset.description) {
      overview += `Description: ${asset.description}\n`;
    }
    
    if (asset.category) {
      overview += `Technology Category: ${asset.category}`;
      if (asset.categoryConfidence) {
        overview += ` (${Math.round(asset.categoryConfidence * 100)}% confidence)`;
      }
      overview += '\n';
    }

    if (asset.themes.length > 0) {
      overview += `\nKey Themes (${asset.themes.length}):\n`;
      asset.themes.slice(0, 5).forEach(theme => {
        overview += `- ${theme.name}: ${theme.cards.length} cards\n`;
      });
    }

    return overview;
  }

  /**
   * Format scenario overview for context
   */
  private formatScenarioOverview(scenario: ScenarioDetails): string {
    let overview = `**${scenario.name}**\n`;
    
    if (scenario.description) {
      overview += `Description: ${scenario.description}\n`;
    }
    
    overview += `Type: ${scenario.type}\n`;
    
    if (scenario.timeline) {
      overview += `Timeline: ${scenario.timeline}\n`;
    }
    
    if (scenario.probability) {
      overview += `Probability: ${Math.round(scenario.probability * 100)}%\n`;
    }

    if (scenario.themes.length > 0) {
      overview += `\nKey Themes (${scenario.themes.length}):\n`;
      scenario.themes.slice(0, 5).forEach(theme => {
        overview += `- ${theme.name}: ${theme.cards.length} cards\n`;
      });
    }

    return overview;
  }

  /**
   * Assemble context within token limits
   */
  private assembleWithinTokenLimit(sections: ContextSection[], tokenLimit: number): string {
    // Sort sections by priority
    const sortedSections = sections.sort((a, b) => a.priority - b.priority);
    
    let assembledContext = '';
    let currentTokens = 0;

    for (const section of sortedSections) {
      const sectionText = `\n## ${section.title}\n${section.content}\n`;
      const sectionTokens = this.estimateTokens(sectionText);
      
      if (currentTokens + sectionTokens <= tokenLimit) {
        assembledContext += sectionText;
        currentTokens += sectionTokens;
      } else {
        // Try to fit a truncated version
        const remainingTokens = tokenLimit - currentTokens;
        if (remainingTokens > 100) { // Minimum viable section size
          const truncatedContent = this.truncateToTokens(section.content, remainingTokens - 50);
          assembledContext += `\n## ${section.title}\n${truncatedContent}...\n`;
        }
        break;
      }
    }

    return assembledContext;
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to approximate token count
   */
  private truncateToTokens(text: string, tokenLimit: number): string {
    const maxChars = tokenLimit * 4; // Rough character limit
    if (text.length <= maxChars) return text;
    
    // Try to truncate at sentence boundary
    const truncated = text.substring(0, maxChars);
    const lastSentence = truncated.lastIndexOf('.');
    
    return lastSentence > maxChars * 0.8 ? truncated.substring(0, lastSentence + 1) : truncated;
  }

  /**
   * Gather global context (placeholder for now)
   */
  private async gatherGlobalContext(assetId: string, scenarioId: string): Promise<EvidenceItem[]> {
    // Placeholder for global market trends, industry analysis, etc.
    return [];
  }

  /**
   * Get user assets with content (placeholder)
   */
  private async getUserAssetsWithContent(userId: string): Promise<any[]> {
    // Simplified version for now
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: {
        themes: {
          include: {
            cards: true
          }
        }
      }
    });

    return assets;
  }

  /**
   * Generate portfolio overview (placeholder)
   */
  private generatePortfolioOverview(assets: any[]): PortfolioOverview {
    return {
      totalAssets: assets.length,
      categories: [],
      themes: [],
      riskFactors: []
    };
  }

  /**
   * Gather portfolio insights (placeholder)
   */
  private async gatherPortfolioInsights(assets: any[], focusAreas?: string[]): Promise<EvidenceItem[]> {
    return [];
  }

  /**
   * Assemble portfolio context (placeholder)
   */
  private assemblePortfolioContextData(
    overview: PortfolioOverview,
    insights: EvidenceItem[],
    options: { tokenLimit: number }
  ): PortfolioAnalysisContext {
    return {
      assembledContext: '',
      sections: [],
      assetCount: overview.totalAssets,
      tokenCount: 0,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Gather market insights (placeholder)
   */
  private async gatherMarketInsights(category: string, timeframe?: string): Promise<EvidenceItem[]> {
    return [];
  }

  /**
   * Assemble trend context (placeholder)
   */
  private assembleTrendContext(
    category: string,
    evidence: HybridSearchResult[],
    insights: EvidenceItem[],
    options: { tokenLimit: number; timeframe?: string }
  ): TechnologyTrendContext {
    return {
      technologyCategory: category,
      assembledContext: '',
      sections: [],
      evidenceCount: evidence.length,
      tokenCount: 0,
      generatedAt: new Date().toISOString()
    };
  }
}

// Type definitions

export interface MatrixAnalysisContext {
  assetId: string;
  scenarioId: string;
  assembledContext: string;
  sections: ContextSection[];
  evidenceCount: number;
  tokenCount: number;
  generatedAt: string;
}

export interface PortfolioAnalysisContext {
  assembledContext: string;
  sections: ContextSection[];
  assetCount: number;
  tokenCount: number;
  generatedAt: string;
}

export interface TechnologyTrendContext {
  technologyCategory: string;
  assembledContext: string;
  sections: ContextSection[];
  evidenceCount: number;
  tokenCount: number;
  generatedAt: string;
}

interface ContextSection {
  type: 'asset_overview' | 'scenario_overview' | 'evidence' | 'analysis' | 'summary';
  title: string;
  content: string;
  priority: number;
  metadata?: any;
}

interface EvidenceItem {
  id: string;
  type: 'search_result' | 'theme_analysis' | 'market_data' | 'expert_insight';
  source: string;
  content: string;
  relevanceScore: number;
  metadata?: any;
}

interface AssetDetails {
  id: string;
  name: string;
  description?: string | null;
  category?: any;
  categoryConfidence?: number | null;
  categoryInsights?: any;
  themes: ThemeDetails[];
}

interface ScenarioDetails {
  id: string;
  name: string;
  description?: string | null;
  type: any;
  timeline?: string | null;
  probability?: number | null;
  themes: ThemeDetails[];
}

interface ThemeDetails {
  id: string;
  name: string;
  description?: string | null;
  themeType: any;
  cards: CardDetails[];
}

interface CardDetails {
  id: string;
  title: string;
  content: string;
  importance?: number | null;
  chunkCount: number;
}

interface PortfolioOverview {
  totalAssets: number;
  categories: string[];
  themes: string[];
  riskFactors: string[];
}

// Export a default instance
export const contextAssemblyService = new ContextAssemblyService();

// Utility functions for context optimization
export function optimizeContextForAnalysis(context: string, analysisType: 'matrix' | 'portfolio' | 'trend'): string {
  // Remove excessive whitespace and normalize
  let optimized = context.replace(/\s+/g, ' ').trim();
  
  // Add analysis-specific formatting
  switch (analysisType) {
    case 'matrix':
      optimized = `## Matrix Analysis Context\n\n${optimized}`;
      break;
    case 'portfolio':
      optimized = `## Portfolio Analysis Context\n\n${optimized}`;
      break;
    case 'trend':
      optimized = `## Technology Trend Analysis Context\n\n${optimized}`;
      break;
  }
  
  return optimized;
}

export function calculateContextRelevance(context: string, query: string): number {
  const contextWords = context.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  let matches = 0;
  queryWords.forEach(word => {
    if (contextWords.some(cWord => cWord.includes(word) || word.includes(cWord))) {
      matches++;
    }
  });
  
  return matches / queryWords.length;
}
