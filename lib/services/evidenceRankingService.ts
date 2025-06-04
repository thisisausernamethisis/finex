import { logger } from '../logger';
import { HybridSearchResult } from './hybridSearchService';
import { prisma } from '../db';

// Create a service-specific logger
const evidenceLogger = logger.child({ service: 'EvidenceRankingService' });

/**
 * Evidence Ranking Service - Enhanced evidence scoring and prioritization
 * Provides sophisticated ranking algorithms for evidence quality assessment
 */
export class EvidenceRankingService {
  private readonly temporalDecayFactor: number;
  private readonly sourceCredibilityWeights: SourceCredibilityWeights;

  constructor(options?: {
    temporalDecayFactor?: number;
    sourceCredibilityWeights?: Partial<SourceCredibilityWeights>;
  }) {
    this.temporalDecayFactor = options?.temporalDecayFactor || 0.95; // 5% decay per month
    this.sourceCredibilityWeights = {
      userGenerated: 0.7,
      aiCategorized: 0.6,
      themeAnalysis: 0.8,
      marketData: 0.9,
      expertAnalysis: 0.95,
      ...options?.sourceCredibilityWeights
    };
  }

  /**
   * Rank evidence with comprehensive scoring algorithm
   */
  public async rankEvidence(
    evidenceItems: HybridSearchResult[],
    context: RankingContext
  ): Promise<RankedEvidence[]> {
    evidenceLogger.info('Ranking evidence with comprehensive scoring', {
      itemCount: evidenceItems.length,
      context: context.analysisType
    });

    const rankedEvidence: RankedEvidence[] = [];

    for (const item of evidenceItems) {
      const scores = await this.calculateComprehensiveScores(item, context);
      const finalScore = this.calculateFinalScore(scores, context);

      rankedEvidence.push({
        id: item.id,
        source: item.cardTitle,
        content: item.content,
        relevanceScore: item.hybridScore,
        confidenceScore: finalScore.confidence,
        qualityScore: finalScore.quality,
        recencyScore: scores.recency,
        credibilityScore: scores.credibility,
        finalScore: finalScore.overall,
        evidenceType: this.classifyEvidenceType(item.content, context),
        rank: 0, // Will be set after sorting
        metadata: {
          ...item.metadata,
          scoringBreakdown: scores,
          temporalFactor: scores.temporal,
          contentQuality: scores.contentQuality
        }
      });
    }

    // Sort by final score and assign ranks
    rankedEvidence.sort((a, b) => b.finalScore - a.finalScore);
    rankedEvidence.forEach((item, index) => {
      item.rank = index + 1;
    });

    evidenceLogger.info('Evidence ranking completed', {
      totalItems: rankedEvidence.length,
      topScore: rankedEvidence[0]?.finalScore || 0,
      scoreRange: {
        min: rankedEvidence[rankedEvidence.length - 1]?.finalScore || 0,
        max: rankedEvidence[0]?.finalScore || 0
      }
    });

    return rankedEvidence;
  }

  /**
   * Group and prioritize evidence by type and relevance
   */
  public groupEvidenceByPriority(
    rankedEvidence: RankedEvidence[]
  ): GroupedEvidence {
    const groups: GroupedEvidence = {
      critical: [],
      important: [],
      supporting: [],
      contextual: []
    };

    rankedEvidence.forEach(evidence => {
      if (evidence.finalScore >= 0.8 && evidence.rank <= 3) {
        groups.critical.push(evidence);
      } else if (evidence.finalScore >= 0.6 && evidence.rank <= 8) {
        groups.important.push(evidence);
      } else if (evidence.finalScore >= 0.4) {
        groups.supporting.push(evidence);
      } else {
        groups.contextual.push(evidence);
      }
    });

    evidenceLogger.debug('Evidence grouped by priority', {
      critical: groups.critical.length,
      important: groups.important.length,
      supporting: groups.supporting.length,
      contextual: groups.contextual.length
    });

    return groups;
  }

  /**
   * Generate evidence quality report
   */
  public generateQualityReport(
    rankedEvidence: RankedEvidence[]
  ): EvidenceQualityReport {
    const totalItems = rankedEvidence.length;
    if (totalItems === 0) {
      return {
        overallQuality: 0,
        averageConfidence: 0,
        averageRecency: 0,
        averageCredibility: 0,
        qualityDistribution: { high: 0, medium: 0, low: 0 },
        recommendations: ['No evidence available for analysis']
      };
    }

    const averageConfidence = rankedEvidence.reduce((sum, e) => sum + e.confidenceScore, 0) / totalItems;
    const averageRecency = rankedEvidence.reduce((sum, e) => sum + e.recencyScore, 0) / totalItems;
    const averageCredibility = rankedEvidence.reduce((sum, e) => sum + e.credibilityScore, 0) / totalItems;
    const overallQuality = rankedEvidence.reduce((sum, e) => sum + e.qualityScore, 0) / totalItems;

    const qualityDistribution = rankedEvidence.reduce((dist, e) => {
      if (e.qualityScore >= 0.7) dist.high++;
      else if (e.qualityScore >= 0.4) dist.medium++;
      else dist.low++;
      return dist;
    }, { high: 0, medium: 0, low: 0 });

    const recommendations = this.generateQualityRecommendations(
      { overallQuality, averageConfidence, averageRecency, averageCredibility },
      qualityDistribution,
      totalItems
    );

    return {
      overallQuality,
      averageConfidence,
      averageRecency,
      averageCredibility,
      qualityDistribution,
      recommendations
    };
  }

  /**
   * Filter evidence by quality threshold
   */
  public filterByQuality(
    rankedEvidence: RankedEvidence[],
    minQualityScore: number = 0.3,
    maxItems?: number
  ): RankedEvidence[] {
    const filtered = rankedEvidence.filter(evidence => 
      evidence.qualityScore >= minQualityScore
    );

    evidenceLogger.debug('Evidence filtered by quality', {
      originalCount: rankedEvidence.length,
      filteredCount: filtered.length,
      qualityThreshold: minQualityScore
    });

    return maxItems ? filtered.slice(0, maxItems) : filtered;
  }

  // Private helper methods

  /**
   * Calculate comprehensive scores for an evidence item
   */
  private async calculateComprehensiveScores(
    item: HybridSearchResult,
    context: RankingContext
  ): Promise<ScoringBreakdown> {
    // Content quality scoring
    const contentQuality = this.assessContentQuality(item.content);
    
    // Recency scoring (if available in metadata)
    const recency = await this.calculateRecencyScore(item);
    
    // Source credibility scoring
    const credibility = this.calculateCredibilityScore(item, context);
    
    // Temporal relevance
    const temporal = this.calculateTemporalRelevance(item, context);
    
    // Context relevance boost
    const contextRelevance = this.calculateContextRelevance(item, context);

    return {
      contentQuality,
      recency,
      credibility,
      temporal,
      contextRelevance
    };
  }

  /**
   * Calculate final composite score
   */
  private calculateFinalScore(
    scores: ScoringBreakdown,
    context: RankingContext
  ): FinalScore {
    // Weight factors based on analysis type
    const weights = this.getWeightsForContext(context);

    // Calculate weighted confidence score
    const confidence = (
      scores.credibility * weights.credibility +
      scores.recency * weights.recency +
      scores.contextRelevance * weights.contextRelevance
    ) / (weights.credibility + weights.recency + weights.contextRelevance);

    // Calculate quality score
    const quality = (
      scores.contentQuality * 0.6 +
      scores.temporal * 0.4
    );

    // Overall score combining all factors
    const overall = (
      confidence * 0.4 +
      quality * 0.3 +
      scores.contextRelevance * 0.3
    );

    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      quality: Math.max(0, Math.min(1, quality)),
      overall: Math.max(0, Math.min(1, overall))
    };
  }

  /**
   * Assess content quality based on multiple factors
   */
  private assessContentQuality(content: string): number {
    let score = 0.5; // Base score

    // Length scoring - prefer substantial content
    const length = content.length;
    if (length > 1000) score += 0.2;
    else if (length > 500) score += 0.15;
    else if (length > 200) score += 0.1;
    else if (length < 50) score -= 0.2;

    // Sentence structure scoring
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) score += 0.1;
    if (sentences.length >= 6) score += 0.1;

    // Information density (keywords and entities)
    const keywordDensity = this.calculateKeywordDensity(content);
    score += Math.min(0.2, keywordDensity * 0.4);

    // Technical depth indicators
    const technicalTerms = this.countTechnicalTerms(content);
    score += Math.min(0.15, technicalTerms * 0.03);

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Calculate recency score based on content timestamp
   */
  private async calculateRecencyScore(item: HybridSearchResult): Promise<number> {
    try {
      // Try to get timestamp from card metadata
      const card = await prisma.card.findUnique({
        where: { id: item.cardId },
        select: { createdAt: true, updatedAt: true }
      });

      if (!card) return 0.5; // Default score

      const lastUpdate = card.updatedAt || card.createdAt;
      const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      // Apply temporal decay
      return Math.max(0.1, Math.pow(this.temporalDecayFactor, monthsOld));
    } catch (error) {
      evidenceLogger.warn('Failed to calculate recency score', { itemId: item.id, error });
      return 0.5;
    }
  }

  /**
   * Calculate source credibility score
   */
  private calculateCredibilityScore(
    item: HybridSearchResult,
    context: RankingContext
  ): number {
    let score = 0.5; // Base credibility

    // Source type scoring
    const sourceType = this.identifySourceType(item);
    score = this.sourceCredibilityWeights[sourceType] || score;

    // Content authoritativeness indicators
    if (this.hasAuthoritativeIndicators(item.content)) {
      score += 0.1;
    }

    // Consistency with other evidence
    if (item.hybridScore > 0.7) {
      score += 0.05; // Boost for highly relevant content
    }

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Calculate temporal relevance
   */
  private calculateTemporalRelevance(
    item: HybridSearchResult,
    context: RankingContext
  ): number {
    // For now, assume all content is temporally relevant
    // In production, would analyze content for temporal context
    return 0.8;
  }

  /**
   * Calculate context relevance boost
   */
  private calculateContextRelevance(
    item: HybridSearchResult,
    context: RankingContext
  ): number {
    let relevance = item.hybridScore; // Start with hybrid search score

    // Boost for specific analysis types
    if (context.analysisType === 'risk_assessment' && 
        this.containsRiskIndicators(item.content)) {
      relevance += 0.1;
    }

    if (context.analysisType === 'opportunity_analysis' && 
        this.containsOpportunityIndicators(item.content)) {
      relevance += 0.1;
    }

    return Math.max(0, Math.min(1, relevance));
  }

  /**
   * Get scoring weights based on context
   */
  private getWeightsForContext(context: RankingContext): ScoringWeights {
    const baseWeights = {
      credibility: 0.3,
      recency: 0.3,
      contextRelevance: 0.4
    };

    // Adjust weights based on analysis type
    switch (context.analysisType) {
      case 'risk_assessment':
        return { ...baseWeights, credibility: 0.4, recency: 0.4, contextRelevance: 0.2 };
      case 'opportunity_analysis':
        return { ...baseWeights, credibility: 0.2, recency: 0.2, contextRelevance: 0.6 };
      case 'market_analysis':
        return { ...baseWeights, credibility: 0.4, recency: 0.5, contextRelevance: 0.1 };
      default:
        return baseWeights;
    }
  }

  /**
   * Classify evidence type based on content and context
   */
  private classifyEvidenceType(content: string, context: RankingContext): EvidenceType {
    const lowerContent = content.toLowerCase();

    // Financial indicators
    if (this.containsFinancialIndicators(lowerContent)) {
      return 'financial_impact';
    }

    // Market analysis indicators
    if (this.containsMarketIndicators(lowerContent)) {
      return 'market_analysis';
    }

    // Technical analysis indicators
    if (this.containsTechnicalIndicators(lowerContent)) {
      return 'technical_analysis';
    }

    // Risk assessment indicators
    if (this.containsRiskIndicators(lowerContent)) {
      return 'risk_assessment';
    }

    // Strategic insights
    if (this.containsStrategicIndicators(lowerContent)) {
      return 'strategic_insight';
    }

    return 'general_analysis';
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const relevantKeywords = [
      'technology', 'innovation', 'market', 'growth', 'disruption',
      'competitive', 'advantage', 'risk', 'opportunity', 'analysis',
      'impact', 'revenue', 'profit', 'investment', 'strategy'
    ];

    const keywordCount = words.filter(word => 
      relevantKeywords.some(keyword => word.includes(keyword))
    ).length;

    return keywordCount / words.length;
  }

  /**
   * Count technical terms in content
   */
  private countTechnicalTerms(content: string): number {
    const technicalTerms = [
      'ai', 'machine learning', 'neural network', 'algorithm',
      'blockchain', 'quantum', 'robotics', 'automation',
      'cloud computing', 'cybersecurity', 'iot', 'api',
      'scalability', 'optimization', 'integration'
    ];

    const lowerContent = content.toLowerCase();
    return technicalTerms.reduce((count, term) => {
      return count + (lowerContent.includes(term) ? 1 : 0);
    }, 0);
  }

  /**
   * Identify source type from item metadata
   */
  private identifySourceType(item: HybridSearchResult): SourceType {
    // Simple heuristic - in production would use more sophisticated detection
    if (item.metadata?.analysisGenerated) return 'expertAnalysis';
    if (item.metadata?.aiCategorized) return 'aiCategorized';
    if (item.metadata?.themeAnalysis) return 'themeAnalysis';
    if (item.metadata?.marketData) return 'marketData';
    return 'userGenerated';
  }

  /**
   * Check for authoritative indicators
   */
  private hasAuthoritativeIndicators(content: string): boolean {
    const indicators = [
      'according to', 'research shows', 'study found',
      'data indicates', 'analysis reveals', 'report states'
    ];
    const lowerContent = content.toLowerCase();
    return indicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Check for financial indicators
   */
  private containsFinancialIndicators(content: string): boolean {
    const indicators = ['revenue', 'profit', 'cost', 'investment', 'valuation', 'margin', 'earnings'];
    return indicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for market indicators
   */
  private containsMarketIndicators(content: string): boolean {
    const indicators = ['market share', 'competition', 'industry', 'sector', 'customer', 'demand'];
    return indicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for technical indicators
   */
  private containsTechnicalIndicators(content: string): boolean {
    const indicators = ['technology', 'technical', 'innovation', 'development', 'platform', 'system'];
    return indicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for risk indicators
   */
  private containsRiskIndicators(content: string): boolean {
    const indicators = ['risk', 'threat', 'vulnerability', 'challenge', 'problem', 'concern'];
    return indicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for opportunity indicators
   */
  private containsOpportunityIndicators(content: string): boolean {
    const indicators = ['opportunity', 'growth', 'potential', 'benefit', 'advantage', 'expansion'];
    return indicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check for strategic indicators
   */
  private containsStrategicIndicators(content: string): boolean {
    const indicators = ['strategy', 'strategic', 'plan', 'approach', 'roadmap', 'vision'];
    return indicators.some(indicator => content.includes(indicator));
  }

  /**
   * Generate quality recommendations
   */
  private generateQualityRecommendations(
    averages: { overallQuality: number; averageConfidence: number; averageRecency: number; averageCredibility: number },
    distribution: { high: number; medium: number; low: number },
    totalItems: number
  ): string[] {
    const recommendations: string[] = [];

    if (averages.overallQuality < 0.4) {
      recommendations.push('Consider gathering higher-quality evidence sources for more reliable analysis');
    }

    if (averages.averageRecency < 0.5) {
      recommendations.push('Evidence appears dated - seek more recent information for current market conditions');
    }

    if (averages.averageCredibility < 0.6) {
      recommendations.push('Source credibility is moderate - verify findings with authoritative sources');
    }

    if (distribution.low > distribution.high + distribution.medium) {
      recommendations.push('Majority of evidence is low quality - analysis confidence may be limited');
    }

    if (totalItems < 5) {
      recommendations.push('Limited evidence available - consider expanding data sources for comprehensive analysis');
    }

    if (recommendations.length === 0) {
      recommendations.push('Evidence quality is good - analysis should provide reliable insights');
    }

    return recommendations;
  }
}

// Type definitions

export interface RankedEvidence {
  id: string;
  source: string;
  content: string;
  relevanceScore: number;
  confidenceScore: number;
  qualityScore: number;
  recencyScore: number;
  credibilityScore: number;
  finalScore: number;
  evidenceType: EvidenceType;
  rank: number;
  metadata: any;
}

export interface RankingContext {
  analysisType: 'matrix_analysis' | 'risk_assessment' | 'opportunity_analysis' | 'market_analysis';
  assetCategory?: string;
  scenarioType?: string;
  timeHorizon?: 'short' | 'medium' | 'long';
  priorityFactors?: string[];
}

export interface GroupedEvidence {
  critical: RankedEvidence[];
  important: RankedEvidence[];
  supporting: RankedEvidence[];
  contextual: RankedEvidence[];
}

export interface EvidenceQualityReport {
  overallQuality: number;
  averageConfidence: number;
  averageRecency: number;
  averageCredibility: number;
  qualityDistribution: { high: number; medium: number; low: number };
  recommendations: string[];
}

interface ScoringBreakdown {
  contentQuality: number;
  recency: number;
  credibility: number;
  temporal: number;
  contextRelevance: number;
}

interface FinalScore {
  confidence: number;
  quality: number;
  overall: number;
}

interface ScoringWeights {
  credibility: number;
  recency: number;
  contextRelevance: number;
}

interface SourceCredibilityWeights {
  userGenerated: number;
  aiCategorized: number;
  themeAnalysis: number;
  marketData: number;
  expertAnalysis: number;
}

type SourceType = keyof SourceCredibilityWeights;

type EvidenceType = 
  | 'market_analysis'
  | 'financial_impact' 
  | 'technical_analysis'
  | 'risk_assessment'
  | 'strategic_insight'
  | 'general_analysis';

// Export a default instance
export const evidenceRankingService = new EvidenceRankingService();

// Utility functions
export function calculateEvidenceConfidence(evidence: RankedEvidence[]): number {
  if (evidence.length === 0) return 0;
  return evidence.reduce((sum, e) => sum + e.confidenceScore, 0) / evidence.length;
}

export function getTopEvidenceByType(
  evidence: RankedEvidence[],
  type: EvidenceType,
  limit: number = 3
): RankedEvidence[] {
  return evidence
    .filter(e => e.evidenceType === type)
    .slice(0, limit);
} 