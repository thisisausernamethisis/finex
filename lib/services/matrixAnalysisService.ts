import { logger } from '../logger';
import { prisma } from '../db';
import { contextAssemblyService, MatrixAnalysisContext } from './contextAssemblyService';
import { hybridSearchService, HybridSearchResult } from './hybridSearchService';
import { evidenceRankingService, RankedEvidence, RankingContext } from './evidenceRankingService';
import { confidenceScoringService, ComprehensiveConfidenceScore } from './confidenceScoringService';
import { promptTemplateService, ImpactExplainData } from './promptTemplateService';
import { llmCompletionService, ImpactExplainResponse } from './llmCompletionService';
import { chunkingService } from './chunkingService';
import { embeddingService } from './embeddingService';

// Create a service-specific logger
const analysisLogger = logger.child({ service: 'MatrixAnalysisService' });

/**
 * Matrix Analysis Service - AI-powered asset-scenario impact analysis
 * Orchestrates all AI processing services to generate comprehensive impact assessments
 */
export class MatrixAnalysisService {
  private readonly confidenceThreshold: number;
  private readonly maxAnalysisTime: number;
  private readonly useRealAI: boolean;

  constructor(options?: {
    confidenceThreshold?: number;
    maxAnalysisTime?: number;
    useRealAI?: boolean;
  }) {
    this.confidenceThreshold = options?.confidenceThreshold || 0.6;
    this.maxAnalysisTime = options?.maxAnalysisTime || 30000; // 30 seconds max
    this.useRealAI = options?.useRealAI ?? !!process.env.OPENAI_API_KEY;
  }

  /**
   * Perform comprehensive matrix analysis for asset-scenario pair
   */
  public async performMatrixAnalysis(
    assetId: string,
    scenarioId: string,
    options?: MatrixAnalysisOptions
  ): Promise<MatrixAnalysisResult> {
    const startTime = Date.now();
    const analysisId = `analysis_${assetId}_${scenarioId}_${startTime}`;

    analysisLogger.info('Starting matrix analysis', {
      analysisId,
      assetId,
      scenarioId,
      useRealAI: this.useRealAI,
      options
    });

    try {
      // Step 1: Validate inputs and get basic info
      const [asset, scenario] = await this.validateAndGetEntities(assetId, scenarioId);

      // Step 2: Assemble comprehensive context
      const context = await this.assembleAnalysisContext(assetId, scenarioId, options);

      // Step 3: Gather and rank evidence
      const evidence = await this.gatherRankedEvidence(assetId, scenarioId, options);

      // Step 4: Perform AI impact calculation (real or mock)
      const impactCalculation = await this.calculateImpactScore(context, evidence, options);

      // Step 5: Generate comprehensive confidence scores
      const confidenceScores = this.calculateEnhancedConfidenceScores(context, evidence, impactCalculation);

      // Step 6: Generate explanatory insights
      const insights = await this.generateInsights(context, evidence, impactCalculation);

      // Step 7: Assemble final result
      const result: MatrixAnalysisResult = {
        analysisId,
        assetId,
        scenarioId,
        assetName: asset.name,
        scenarioName: scenario.name,
        impactScore: impactCalculation.score,
        impactDirection: impactCalculation.direction,
        confidenceLevel: confidenceScores.overall,
        confidenceBreakdown: {
          overall: confidenceScores.overall,
          dataQuality: confidenceScores.dimensions.dataQuality,
          evidenceConfidence: confidenceScores.dimensions.evidenceStrength,
          analysisConsistency: confidenceScores.dimensions.analysisConsistency,
          breakdown: {
            contextCompleteness: context.tokenCount / 4000, // Normalize by target
            evidenceRelevance: evidence.length > 0 ? evidence[0].relevanceScore : 0.5,
            sourceCredibility: confidenceScores.dimensions.sourceCredibility,
            timelyness: confidenceScores.dimensions.temporalReliability
          }
        },
        keyInsights: insights,
        evidenceSummary: this.summarizeEvidence(evidence),
        processingTime: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
        metadata: {
          contextTokens: context.tokenCount,
          evidenceItems: evidence.length,
          analysisVersion: '2.0',
          confidenceThreshold: this.confidenceThreshold,
          aiProvider: this.useRealAI ? 'openai' : 'mock',
          ...(impactCalculation.llmResponse && {
            llmUsage: impactCalculation.llmResponse.usage,
            llmProcessingTime: impactCalculation.llmResponse.processingTime
          })
        }
      };

      // Step 8: Store result for caching
      await this.storeAnalysisResult(result);

      analysisLogger.info('Matrix analysis completed', {
        analysisId,
        impactScore: result.impactScore,
        confidenceLevel: result.confidenceLevel,
        processingTime: result.processingTime,
        aiProvider: this.useRealAI ? 'openai' : 'mock'
      });

      return result;
    } catch (error) {
      analysisLogger.error('Matrix analysis failed', {
        analysisId,
        assetId,
        scenarioId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      });

      throw new Error(`Matrix analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform batch analysis for multiple asset-scenario pairs
   */
  public async performBatchAnalysis(
    pairs: Array<{ assetId: string; scenarioId: string }>,
    options?: MatrixAnalysisOptions & { parallelLimit?: number }
  ): Promise<BatchAnalysisResult> {
    const batchId = `batch_${Date.now()}`;
    const startTime = Date.now();

    analysisLogger.info('Starting batch matrix analysis', {
      batchId,
      pairCount: pairs.length,
      parallelLimit: options?.parallelLimit || 3
    });

    const results: MatrixAnalysisResult[] = [];
    const errors: Array<{ assetId: string; scenarioId: string; error: string }> = [];

    // Process in batches to avoid overwhelming the system
    const parallelLimit = options?.parallelLimit || 3;
    for (let i = 0; i < pairs.length; i += parallelLimit) {
      const batch = pairs.slice(i, i + parallelLimit);
      
      const batchPromises = batch.map(async pair => {
        try {
          const result = await this.performMatrixAnalysis(pair.assetId, pair.scenarioId, options);
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: {
              assetId: pair.assetId,
              scenarioId: pair.scenarioId,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(batchResult => {
        if (batchResult.success && batchResult.result) {
          results.push(batchResult.result);
        } else if (!batchResult.success && batchResult.error) {
          errors.push(batchResult.error);
        }
      });
    }

    const summary = this.generateBatchSummary(results);

    const batchResult: BatchAnalysisResult = {
      batchId,
      totalPairs: pairs.length,
      successfulAnalyses: results.length,
      failedAnalyses: errors.length,
      results,
      errors,
      summary,
      processingTime: Date.now() - startTime,
      generatedAt: new Date().toISOString()
    };

    analysisLogger.info('Batch matrix analysis completed', {
      batchId,
      successRate: `${results.length}/${pairs.length}`,
      processingTime: batchResult.processingTime
    });

    return batchResult;
  }

  /**
   * Get cached analysis result if available
   */
  public async getCachedAnalysis(
    assetId: string,
    scenarioId: string,
    maxAge?: number
  ): Promise<MatrixAnalysisResult | null> {
    // For now, return null until we add the matrixAnalysis table to schema
    // TODO: Add matrixAnalysis model to Prisma schema
    analysisLogger.debug('Cached analysis not available - schema update needed', {
      assetId,
      scenarioId
    });
    return null;
  }

  // Private helper methods

  /**
   * Validate inputs and get asset/scenario entities
   */
  private async validateAndGetEntities(assetId: string, scenarioId: string) {
    const [asset, scenario] = await Promise.all([
      prisma.asset.findUnique({ where: { id: assetId } }),
      prisma.scenario.findUnique({ where: { id: scenarioId } })
    ]);

    if (!asset) throw new Error(`Asset not found: ${assetId}`);
    if (!scenario) throw new Error(`Scenario not found: ${scenarioId}`);

    return [asset, scenario];
  }

  /**
   * Assemble comprehensive analysis context
   */
  private async assembleAnalysisContext(
    assetId: string,
    scenarioId: string,
    options?: MatrixAnalysisOptions
  ): Promise<MatrixAnalysisContext> {
    analysisLogger.debug('Assembling analysis context', { assetId, scenarioId });

    return contextAssemblyService.assembleMatrixContext(assetId, scenarioId, {
      focusQuery: options?.focusQuery,
      includeGlobalContext: options?.includeGlobalContext !== false,
      tokenLimit: options?.contextTokenLimit || 4000
    });
  }

  /**
   * Gather and rank evidence from multiple sources with enhanced scoring
   */
  private async gatherRankedEvidence(
    assetId: string,
    scenarioId: string,
    options?: MatrixAnalysisOptions
  ): Promise<RankedEvidence[]> {
    analysisLogger.debug('Gathering ranked evidence with enhanced scoring', { assetId, scenarioId });

    // Search for relevant evidence using hybrid search
    const searchResults = await hybridSearchService.searchForMatrixAnalysis({
      assetId,
      scenarioId,
      query: options?.focusQuery || 'impact analysis market disruption competitive risk opportunity',
      limit: 20
    });

    // Prepare ranking context
    const rankingContext: RankingContext = {
      analysisType: 'matrix_analysis',
      timeHorizon: 'medium',
      priorityFactors: options?.focusQuery ? [options.focusQuery] : undefined
    };

    // Use enhanced evidence ranking service
    const rankedEvidence = await evidenceRankingService.rankEvidence(
      searchResults,
      rankingContext
    );

    // Filter by quality threshold and limit to top evidence
    const qualityFiltered = evidenceRankingService.filterByQuality(
      rankedEvidence,
      0.3, // Minimum quality threshold
      15   // Maximum items
    );

    analysisLogger.debug('Evidence ranking completed', {
      originalCount: searchResults.length,
      rankedCount: rankedEvidence.length,
      qualityFilteredCount: qualityFiltered.length,
      averageScore: qualityFiltered.reduce((sum, e) => sum + e.finalScore, 0) / qualityFiltered.length
    });

    return qualityFiltered;
  }

  /**
   * Calculate AI-powered impact score using real LLM or fallback to heuristics
   */
  private async calculateImpactScore(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    options?: MatrixAnalysisOptions
  ): Promise<ImpactCalculation> {
    analysisLogger.debug('Calculating impact score', {
      contextTokens: context.tokenCount,
      evidenceCount: evidence.length,
      useRealAI: this.useRealAI
    });

    if (this.useRealAI) {
      return this.calculateImpactScoreWithLLM(context, evidence, options);
    } else {
      return this.calculateImpactScoreWithHeuristics(context, evidence, options);
    }
  }

  /**
   * Calculate impact score using real LLM and ImpactExplain template
   */
  private async calculateImpactScoreWithLLM(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    options?: MatrixAnalysisOptions
  ): Promise<ImpactCalculation> {
    analysisLogger.debug('Using real LLM for impact calculation');

    try {
      // Get asset and scenario details for LLM prompt
      const [asset, scenario] = await this.validateAndGetEntities(context.assetId, context.scenarioId);
      
      // Prepare themes data from context and evidence
      const themes = this.prepareThemesForLLM(asset, scenario, evidence);

      // Format the ImpactExplain prompt
      const promptData: ImpactExplainData = {
        scenarioDescription: `${scenario.name}: ${scenario.description || 'No description provided'}`,
        assetDescription: `${asset.name}: ${asset.description || 'No description provided'}`,
        themes,
        variant: 'A' // Use variant A for structured analysis
      };

      const prompt = promptTemplateService.formatImpactExplain(promptData);

      // Call LLM with retry logic
      const llmResponse = await llmCompletionService.completeWithRetry(prompt, 'openai', {
        model: options?.model || 'gpt-4o',
        temperature: 0.3,
        responseFormat: 'json_object',
        timeout: 25000
      });

      // Parse and validate the response
      const parsedResponse = llmCompletionService.parseJSONResponse<ImpactExplainResponse>(llmResponse);
      const validatedResponse = llmCompletionService.validateImpactExplainResponse(parsedResponse);

      // Convert LLM response to our internal format
      const direction: 'positive' | 'negative' | 'neutral' = 
        validatedResponse.impactScore > 0.5 ? 'positive' :
        validatedResponse.impactScore < -0.5 ? 'negative' : 'neutral';

      // Normalize impact score from -5..5 to 0..1 scale
      const normalizedScore = (validatedResponse.impactScore + 5) / 10;

      // Create breakdown based on evidence analysis
      const breakdown = this.analyzeImpactIndicators(evidence);

      const result: ImpactCalculation = {
        score: normalizedScore,
        direction,
        breakdown,
        reasoning: validatedResponse.rationale,
        llmResponse,
        evidenceIds: validatedResponse.evidence.map(e => e.cardId),
        llmConfidence: validatedResponse.confidence
      };

      analysisLogger.info('LLM impact calculation completed', {
        originalScore: validatedResponse.impactScore,
        normalizedScore,
        direction,
        confidence: validatedResponse.confidence,
        tokensUsed: llmResponse.usage.totalTokens
      });

      return result;
    } catch (error) {
      analysisLogger.warn('LLM impact calculation failed, falling back to heuristics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to heuristics if LLM fails
      return this.calculateImpactScoreWithHeuristics(context, evidence, options);
    }
  }

  /**
   * Fallback impact calculation using heuristics (original implementation)
   */
  private async calculateImpactScoreWithHeuristics(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    options?: MatrixAnalysisOptions
  ): Promise<ImpactCalculation> {
    analysisLogger.debug('Using heuristic impact calculation as fallback');

    let impactScore = 0.5; // Base neutral score
    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';

    // Analyze evidence sentiment and impact indicators
    const impactIndicators = this.analyzeImpactIndicators(evidence);
    
    // Positive indicators
    const positiveWeight = impactIndicators.opportunities + impactIndicators.growth + impactIndicators.innovation;
    
    // Negative indicators  
    const negativeWeight = impactIndicators.threats + impactIndicators.risks + impactIndicators.disruption;

    // Calculate net impact
    const netImpact = positiveWeight - negativeWeight;
    
    if (netImpact > 0.2) {
      direction = 'positive';
      impactScore = 0.5 + (netImpact * 0.5); // Scale to 0.5-1.0
    } else if (netImpact < -0.2) {
      direction = 'negative';
      impactScore = 0.5 + (netImpact * 0.5); // Scale to 0.0-0.5
    }

    // Ensure score is within bounds
    impactScore = Math.max(0, Math.min(1, impactScore));

    return {
      score: impactScore,
      direction,
      breakdown: impactIndicators,
      reasoning: this.generateImpactReasoning(impactIndicators, netImpact)
    };
  }

  /**
   * Generate enhanced confidence scores using the confidence scoring service
   */
  private calculateEnhancedConfidenceScores(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    impactCalculation: ImpactCalculation
  ): ComprehensiveConfidenceScore {
    return confidenceScoringService.calculateComprehensiveConfidence(
      context,
      evidence,
      {
        score: impactCalculation.score,
        direction: impactCalculation.direction,
        breakdown: impactCalculation.breakdown
      }
    );
  }

  /**
   * Prepare themes data for LLM prompt formatting
   */
  private prepareThemesForLLM(
    asset: any,
    scenario: any,
    evidence: RankedEvidence[]
  ): Array<{
    themeName: string;
    summaryBullets?: string[];
    cards?: Array<{ id: string; title: string; content?: string }>;
  }> {
    const themes: Array<{
      themeName: string;
      summaryBullets?: string[];
      cards?: Array<{ id: string; title: string; content?: string }>;
    }> = [];

    // Add asset themes
    if (asset.themes && asset.themes.length > 0) {
      asset.themes.forEach((theme: any) => {
        themes.push({
          themeName: `Asset: ${theme.name}`,
          summaryBullets: theme.description ? [theme.description] : undefined,
          cards: theme.cards?.map((card: any) => ({
            id: card.id,
            title: card.title,
            content: card.content?.substring(0, 500) // Truncate for token efficiency
          }))
        });
      });
    }

    // Add scenario themes
    if (scenario.themes && scenario.themes.length > 0) {
      scenario.themes.forEach((theme: any) => {
        themes.push({
          themeName: `Scenario: ${theme.name}`,
          summaryBullets: theme.description ? [theme.description] : undefined,
          cards: theme.cards?.map((card: any) => ({
            id: card.id,
            title: card.title,
            content: card.content?.substring(0, 500)
          }))
        });
      });
    }

    // Add evidence as a theme
    if (evidence.length > 0) {
      const topEvidence = evidence.slice(0, 10); // Top 10 evidence items
      themes.push({
        themeName: 'Supporting Evidence',
        cards: topEvidence.map(e => ({
          id: e.id,
          title: e.source,
          content: e.content.substring(0, 300) // Truncate evidence content
        }))
      });
    }

    return themes;
  }

  /**
   * Generate insights with enhanced evidence analysis
   */
  private async generateInsights(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    impactCalculation: ImpactCalculation
  ): Promise<string[]> {
    const insights: string[] = [];

    // Impact direction insight
    const direction = impactCalculation.direction;
    const score = impactCalculation.score;
    
    if (direction === 'positive') {
      insights.push(`This scenario presents significant opportunities with an impact score of ${(score * 100).toFixed(0)}%.`);
    } else if (direction === 'negative') {
      insights.push(`This scenario poses notable risks with an impact score of ${(score * 100).toFixed(0)}%.`);
    } else {
      insights.push(`This scenario shows neutral impact with balanced risks and opportunities.`);
    }

    // Add LLM-specific insights if available
    if (impactCalculation.reasoning) {
      insights.push(`AI Analysis: ${impactCalculation.reasoning}`);
    }

    // Enhanced evidence-based insights
    if (evidence.length > 0) {
      const topEvidence = evidence.slice(0, 3);
      const avgQuality = evidence.reduce((sum, e) => sum + e.qualityScore, 0) / evidence.length;
      
      insights.push(`Analysis is supported by ${evidence.length} pieces of evidence with ${(avgQuality * 100).toFixed(0)}% average quality score.`);
      
      if (topEvidence[0]) {
        insights.push(`Strongest evidence from "${topEvidence[0].source}" with confidence score of ${(topEvidence[0].confidenceScore * 100).toFixed(0)}%.`);
      }
    }

    // Evidence quality insights
    const qualityReport = evidenceRankingService.generateQualityReport(evidence);
    if (qualityReport.overallQuality > 0.7) {
      insights.push('High-quality evidence provides strong analytical foundation for decision-making.');
    } else if (qualityReport.overallQuality < 0.4) {
      insights.push('Evidence quality is limited - consider gathering additional data sources before making critical decisions.');
    }

    // Evidence type distribution insights
    const evidenceGroups = evidenceRankingService.groupEvidenceByPriority(evidence);
    if (evidenceGroups.critical.length > 0) {
      insights.push(`${evidenceGroups.critical.length} critical evidence items identified with high confidence and relevance.`);
    }

    // Specific impact areas based on evidence types
    const breakdown = impactCalculation.breakdown;
    if (breakdown.innovation > 0.6) {
      insights.push('Strong innovation potential identified through technical analysis evidence.');
    }
    if (breakdown.disruption > 0.6) {
      insights.push('Significant market disruption risk detected in competitive analysis.');
    }
    if (breakdown.growth > 0.6) {
      insights.push('Notable growth opportunities supported by market evidence.');
    }

    return insights;
  }

  /**
   * Analyze impact indicators from evidence
   */
  private analyzeImpactIndicators(evidence: RankedEvidence[]): ImpactIndicators {
    const indicators: ImpactIndicators = {
      opportunities: 0,
      threats: 0,
      growth: 0,
      risks: 0,
      innovation: 0,
      disruption: 0
    };

    evidence.forEach(item => {
      const content = item.content.toLowerCase();
      const weight = item.relevanceScore;

      // Positive indicators
      if (this.containsKeywords(content, ['opportunity', 'growth', 'expansion', 'benefit', 'advantage'])) {
        indicators.opportunities += weight * 0.2;
      }
      if (this.containsKeywords(content, ['growth', 'increase', 'expand', 'scale', 'market share'])) {
        indicators.growth += weight * 0.2;
      }
      if (this.containsKeywords(content, ['innovation', 'breakthrough', 'advancement', 'technology', 'solution'])) {
        indicators.innovation += weight * 0.2;
      }

      // Negative indicators
      if (this.containsKeywords(content, ['threat', 'risk', 'challenge', 'problem', 'concern'])) {
        indicators.threats += weight * 0.2;
      }
      if (this.containsKeywords(content, ['risk', 'danger', 'vulnerability', 'exposure', 'downside'])) {
        indicators.risks += weight * 0.2;
      }
      if (this.containsKeywords(content, ['disruption', 'displacement', 'obsolete', 'decline', 'threat'])) {
        indicators.disruption += weight * 0.2;
      }
    });

    // Normalize scores
    Object.keys(indicators).forEach(key => {
      indicators[key as keyof ImpactIndicators] = Math.min(1.0, indicators[key as keyof ImpactIndicators]);
    });

    return indicators;
  }

  /**
   * Check if content contains any of the specified keywords
   */
  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword));
  }

  /**
   * Generate impact reasoning explanation
   */
  private generateImpactReasoning(indicators: ImpactIndicators, netImpact: number): string {
    if (netImpact > 0.2) {
      return `Positive impact driven by strong ${indicators.opportunities > indicators.growth ? 'opportunities' : 'growth potential'} signals in the evidence.`;
    } else if (netImpact < -0.2) {
      return `Negative impact indicated by significant ${indicators.threats > indicators.risks ? 'competitive threats' : 'operational risks'} in the analysis.`;
    } else {
      return 'Balanced impact with mixed positive and negative indicators requiring careful monitoring.';
    }
  }

  /**
   * Summarize evidence with enhanced details
   */
  private summarizeEvidence(evidence: RankedEvidence[]): EvidenceSummary {
    const totalEvidence = evidence.length;
    const topEvidence = evidence.slice(0, 5);
    const averageConfidence = evidence.reduce((sum, e) => sum + e.confidenceScore, 0) / totalEvidence;

    // Count evidence types using enhanced classification
    const typeCount: Record<EvidenceType, number> = {
      market_analysis: 0,
      financial_impact: 0,
      technical_analysis: 0,
      risk_assessment: 0,
      strategic_insight: 0,
      general_analysis: 0
    };

    evidence.forEach(e => {
      typeCount[e.evidenceType]++;
    });

    // Get quality distribution
    const qualityReport = evidenceRankingService.generateQualityReport(evidence);

    return {
      totalItems: totalEvidence,
      topSources: topEvidence.map(e => e.source),
      averageConfidence,
      averageQuality: qualityReport.overallQuality,
      typeDistribution: typeCount,
      strongestEvidence: topEvidence[0]?.source || 'None',
      qualityDistribution: { high: qualityReport.qualityDistribution.high, medium: qualityReport.qualityDistribution.medium, low: qualityReport.qualityDistribution.low },
      recommendations: qualityReport.recommendations.slice(0, 3) // Top 3 recommendations
    };
  }

  /**
   * Generate batch analysis summary
   */
  private generateBatchSummary(results: MatrixAnalysisResult[]): BatchSummary {
    if (results.length === 0) {
      return {
        averageImpactScore: 0,
        averageConfidence: 0,
        impactDistribution: { positive: 0, negative: 0, neutral: 0 },
        highConfidenceResults: 0,
        processingTimeStats: { min: 0, max: 0, average: 0 }
      };
    }

    const avgImpact = results.reduce((sum, r) => sum + r.impactScore, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidenceLevel, 0) / results.length;

    const distribution = results.reduce((dist, r) => {
      dist[r.impactDirection]++;
      return dist;
    }, { positive: 0, negative: 0, neutral: 0 });

    const highConfidence = results.filter(r => r.confidenceLevel > this.confidenceThreshold).length;

    const processingTimes = results.map(r => r.processingTime);
    const timeStats = {
      min: Math.min(...processingTimes),
      max: Math.max(...processingTimes),
      average: processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
    };

    return {
      averageImpactScore: avgImpact,
      averageConfidence: avgConfidence,
      impactDistribution: distribution,
      highConfidenceResults: highConfidence,
      processingTimeStats: timeStats
    };
  }

  /**
   * Store analysis result for caching
   */
  private async storeAnalysisResult(result: MatrixAnalysisResult): Promise<void> {
    try {
      // For now, skip storing until we add the matrixAnalysis table to schema
      // TODO: Add matrixAnalysis model to Prisma schema
      analysisLogger.debug('Analysis result storage skipped - schema update needed', {
        analysisId: result.analysisId,
        impactScore: result.impactScore
      });
    } catch (error) {
      analysisLogger.warn('Failed to store analysis result', {
        analysisId: result.analysisId,
        error
      });
      // Non-critical error, don't throw
    }
  }
}

// Enhanced type definitions

export interface MatrixAnalysisOptions {
  focusQuery?: string;
  includeGlobalContext?: boolean;
  contextTokenLimit?: number;
  confidenceThreshold?: number;
  prioritizeRecency?: boolean;
  model?: string; // LLM model to use
}

interface ImpactCalculation {
  score: number;
  direction: 'positive' | 'negative' | 'neutral';
  breakdown: ImpactIndicators;
  reasoning: string;
  llmResponse?: any; // Full LLM response for debugging
  evidenceIds?: string[]; // Evidence IDs cited by LLM
  llmConfidence?: number; // LLM's confidence score
}

interface ImpactIndicators {
  opportunities: number;
  threats: number;
  growth: number;
  risks: number;
  innovation: number;
  disruption: number;
}

interface ConfidenceScores {
  overall: number;
  dataQuality: number;
  evidenceConfidence: number;
  analysisConsistency: number;
  breakdown: {
    contextCompleteness: number;
    evidenceRelevance: number;
    sourceCredibility: number;
    timelyness: number;
  };
}

export interface MatrixAnalysisResult {
  analysisId: string;
  assetId: string;
  scenarioId: string;
  assetName: string;
  scenarioName: string;
  impactScore: number; // 0-1 scale
  impactDirection: 'positive' | 'negative' | 'neutral';
  confidenceLevel: number; // 0-1 scale
  confidenceBreakdown: ConfidenceScores;
  keyInsights: string[];
  evidenceSummary: EvidenceSummary;
  processingTime: number; // milliseconds
  generatedAt: string;
  metadata: {
    contextTokens: number;
    evidenceItems: number;
    analysisVersion: string;
    confidenceThreshold: number;
    aiProvider: string;
    llmUsage?: any;
    llmProcessingTime?: number;
  };
}

export interface BatchAnalysisResult {
  batchId: string;
  totalPairs: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  results: MatrixAnalysisResult[];
  errors: Array<{ assetId: string; scenarioId: string; error: string }>;
  summary: BatchSummary;
  processingTime: number;
  generatedAt: string;
}

interface EvidenceSummary {
  totalItems: number;
  topSources: string[];
  averageConfidence: number;
  averageQuality: number;
  typeDistribution: Record<EvidenceType, number>;
  strongestEvidence: string;
  qualityDistribution: { high: number; medium: number; low: number };
  recommendations: string[];
}

interface BatchSummary {
  averageImpactScore: number;
  averageConfidence: number;
  impactDistribution: { positive: number; negative: number; neutral: number };
  highConfidenceResults: number;
  processingTimeStats: { min: number; max: number; average: number };
}

type EvidenceType = 
  | 'market_analysis'
  | 'financial_impact' 
  | 'technical_analysis'
  | 'risk_assessment'
  | 'strategic_insight'
  | 'general_analysis';

// Export a default instance with real AI enabled if API key is available
export const matrixAnalysisService = new MatrixAnalysisService({
  useRealAI: !!process.env.OPENAI_API_KEY
});

// Utility functions
export function formatImpactScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function formatConfidenceLevel(confidence: number): 'High' | 'Medium' | 'Low' {
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.4) return 'Medium';
  return 'Low';
}

export function categorizeImpact(score: number): 'Strong Positive' | 'Moderate Positive' | 'Neutral' | 'Moderate Negative' | 'Strong Negative' {
  if (score >= 0.8) return 'Strong Positive';
  if (score >= 0.6) return 'Moderate Positive';
  if (score >= 0.4) return 'Neutral';
  if (score >= 0.2) return 'Moderate Negative';
  return 'Strong Negative';
} 