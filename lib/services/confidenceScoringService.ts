import { logger } from '../logger';
import { RankedEvidence } from './evidenceRankingService';
import { MatrixAnalysisContext } from './contextAssemblyService';

// Create a service-specific logger
const confidenceLogger = logger.child({ service: 'ConfidenceScoringService' });

/**
 * Confidence Scoring Service - Advanced confidence assessment for analysis results
 * Provides multi-dimensional confidence scoring and uncertainty quantification
 */
export class ConfidenceScoringService {
  private readonly baselineConfidence: number;
  private readonly uncertaintyPenalty: number;

  constructor(options?: {
    baselineConfidence?: number;
    uncertaintyPenalty?: number;
  }) {
    this.baselineConfidence = options?.baselineConfidence || 0.5;
    this.uncertaintyPenalty = options?.uncertaintyPenalty || 0.1;
  }

  /**
   * Calculate comprehensive confidence scores for matrix analysis
   */
  public calculateComprehensiveConfidence(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    impactCalculation: ImpactCalculationInput
  ): ComprehensiveConfidenceScore {
    confidenceLogger.info('Calculating comprehensive confidence scores', {
      evidenceCount: evidence.length,
      contextTokens: context.tokenCount
    });

    // Calculate individual confidence dimensions
    const dataQuality = this.calculateDataQualityConfidence(context, evidence);
    const evidenceStrength = this.calculateEvidenceStrengthConfidence(evidence);
    const analysisConsistency = this.calculateAnalysisConsistencyConfidence(impactCalculation, evidence);
    const temporalReliability = this.calculateTemporalReliabilityConfidence(evidence);
    const sourceCredibility = this.calculateSourceCredibilityConfidence(evidence);
    const methodological = this.calculateMethodologicalConfidence(context, evidence);

    // Calculate uncertainty factors
    const uncertainty = this.calculateUncertaintyFactors(context, evidence, impactCalculation);

    // Weighted overall confidence
    const overall = this.calculateOverallConfidence({
      dataQuality,
      evidenceStrength,
      analysisConsistency,
      temporalReliability,
      sourceCredibility,
      methodological
    }, uncertainty);

    const result: ComprehensiveConfidenceScore = {
      overall,
      dimensions: {
        dataQuality,
        evidenceStrength,
        analysisConsistency,
        temporalReliability,
        sourceCredibility,
        methodological
      },
      uncertainty,
      confidenceInterval: this.calculateConfidenceInterval(overall, uncertainty),
      qualityGrade: this.assignQualityGrade(overall),
      recommendations: this.generateConfidenceRecommendations(overall, uncertainty, evidence.length)
    };

    confidenceLogger.info('Confidence scoring completed', {
      overallConfidence: overall,
      qualityGrade: result.qualityGrade,
      uncertaintyLevel: uncertainty.overallUncertainty
    });

    return result;
  }

  /**
   * Calculate confidence bounds for impact score
   */
  public calculateImpactConfidenceBounds(
    impactScore: number,
    confidence: ComprehensiveConfidenceScore
  ): ImpactConfidenceBounds {
    const overallConfidence = confidence.overall;
    const uncertaintyLevel = confidence.uncertainty.overallUncertainty;

    // Calculate margin of error based on confidence and uncertainty
    const marginOfError = (1 - overallConfidence) * 0.3 + uncertaintyLevel * 0.2;

    const lowerBound = Math.max(0, impactScore - marginOfError);
    const upperBound = Math.min(1, impactScore + marginOfError);

    return {
      pointEstimate: impactScore,
      lowerBound,
      upperBound,
      marginOfError,
      confidenceLevel: overallConfidence,
      interpretation: this.interpretConfidenceBounds(impactScore, lowerBound, upperBound, overallConfidence)
    };
  }

  /**
   * Assess confidence degradation over time
   */
  public assessConfidenceDegradation(
    originalConfidence: ComprehensiveConfidenceScore,
    daysSinceAnalysis: number
  ): ConfidenceDegradation {
    // Confidence degrades over time due to changing market conditions
    const temporalDecay = Math.max(0, 1 - (daysSinceAnalysis * 0.01)); // 1% per day
    const currentConfidence = originalConfidence.overall * temporalDecay;

    const degradationRate = (originalConfidence.overall - currentConfidence) / originalConfidence.overall;

    return {
      originalConfidence: originalConfidence.overall,
      currentConfidence,
      degradationRate,
      daysSinceAnalysis,
      recommendRefresh: degradationRate > 0.2 || daysSinceAnalysis > 30,
      freshnessFactor: temporalDecay
    };
  }

  /**
   * Compare confidence across multiple analyses
   */
  public compareConfidenceScores(
    scores: Array<{ analysisId: string; confidence: ComprehensiveConfidenceScore }>
  ): ConfidenceComparison {
    if (scores.length === 0) {
      return {
        highestConfidence: { analysisId: '', confidence: 0 },
        lowestConfidence: { analysisId: '', confidence: 0 },
        averageConfidence: 0,
        confidenceVariance: 0,
        consistencyRating: 'poor'
      };
    }

    const confidenceValues = scores.map(s => s.confidence.overall);
    const average = confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
    const variance = confidenceValues.reduce((sum, c) => sum + Math.pow(c - average, 2), 0) / confidenceValues.length;

    const highest = scores.reduce((max, curr) => 
      curr.confidence.overall > max.confidence ? { analysisId: curr.analysisId, confidence: curr.confidence.overall } : max,
      { analysisId: scores[0].analysisId, confidence: scores[0].confidence.overall }
    );

    const lowest = scores.reduce((min, curr) => 
      curr.confidence.overall < min.confidence ? { analysisId: curr.analysisId, confidence: curr.confidence.overall } : min,
      { analysisId: scores[0].analysisId, confidence: scores[0].confidence.overall }
    );

    const consistencyRating: 'excellent' | 'good' | 'moderate' | 'poor' = 
      variance < 0.01 ? 'excellent' :
      variance < 0.05 ? 'good' :
      variance < 0.15 ? 'moderate' : 'poor';

    return {
      highestConfidence: highest,
      lowestConfidence: lowest,
      averageConfidence: average,
      confidenceVariance: variance,
      consistencyRating
    };
  }

  // Private helper methods

  /**
   * Calculate data quality confidence
   */
  private calculateDataQualityConfidence(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[]
  ): number {
    let score = this.baselineConfidence;

    // Context completeness factor
    const contextCompleteness = Math.min(1.0, context.tokenCount / 3000);
    score += contextCompleteness * 0.3;

    // Evidence availability factor
    const evidenceAvailability = Math.min(1.0, evidence.length / 10);
    score += evidenceAvailability * 0.2;

    // Evidence diversity factor
    const evidenceTypes = new Set(evidence.map(e => e.evidenceType));
    const diversity = evidenceTypes.size / 6; // 6 possible evidence types
    score += diversity * 0.2;

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Calculate evidence strength confidence
   */
  private calculateEvidenceStrengthConfidence(evidence: RankedEvidence[]): number {
    if (evidence.length === 0) return 0.1;

    // Average quality and confidence of evidence
    const avgQuality = evidence.reduce((sum, e) => sum + e.qualityScore, 0) / evidence.length;
    const avgConfidence = evidence.reduce((sum, e) => sum + e.confidenceScore, 0) / evidence.length;
    const avgFinalScore = evidence.reduce((sum, e) => sum + e.finalScore, 0) / evidence.length;

    // Weight by evidence count (more evidence = higher confidence, up to a point)
    const evidenceCountFactor = Math.min(1.0, evidence.length / 15);

    // Top evidence quality boost
    const topEvidence = evidence.slice(0, 3);
    const topQuality = topEvidence.reduce((sum, e) => sum + e.finalScore, 0) / Math.max(1, topEvidence.length);

    return (avgQuality * 0.3 + avgConfidence * 0.3 + avgFinalScore * 0.2 + evidenceCountFactor * 0.1 + topQuality * 0.1);
  }

  /**
   * Calculate analysis consistency confidence
   */
  private calculateAnalysisConsistencyConfidence(
    impactCalculation: ImpactCalculationInput,
    evidence: RankedEvidence[]
  ): number {
    // Check consistency between impact calculation and evidence sentiment
    const positiveEvidence = evidence.filter(e => 
      e.content.toLowerCase().includes('opportunity') || 
      e.content.toLowerCase().includes('growth') ||
      e.content.toLowerCase().includes('benefit')
    ).length;

    const negativeEvidence = evidence.filter(e => 
      e.content.toLowerCase().includes('risk') || 
      e.content.toLowerCase().includes('threat') ||
      e.content.toLowerCase().includes('challenge')
    ).length;

    const evidenceBalance = Math.abs(positiveEvidence - negativeEvidence) / Math.max(1, evidence.length);
    
    // Score based on consistency between calculated direction and evidence sentiment
    let consistency = 0.5; // Base consistency

    if (impactCalculation.direction === 'positive' && positiveEvidence > negativeEvidence) {
      consistency += 0.3;
    } else if (impactCalculation.direction === 'negative' && negativeEvidence > positiveEvidence) {
      consistency += 0.3;
    } else if (impactCalculation.direction === 'neutral' && evidenceBalance < 0.3) {
      consistency += 0.3;
    }

    // Penalize high imbalance
    if (evidenceBalance > 0.8) {
      consistency -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, consistency));
  }

  /**
   * Calculate temporal reliability confidence
   */
  private calculateTemporalReliabilityConfidence(evidence: RankedEvidence[]): number {
    if (evidence.length === 0) return 0.5;

    // Average recency score of evidence
    const avgRecency = evidence.reduce((sum, e) => sum + (e.recencyScore || 0.5), 0) / evidence.length;
    
    // Penalize if most evidence is old
    const oldEvidenceRatio = evidence.filter(e => (e.recencyScore || 0.5) < 0.3).length / evidence.length;
    const penalty = oldEvidenceRatio * 0.3;

    return Math.max(0.1, Math.min(1.0, avgRecency - penalty));
  }

  /**
   * Calculate source credibility confidence
   */
  private calculateSourceCredibilityConfidence(evidence: RankedEvidence[]): number {
    if (evidence.length === 0) return 0.5;

    // Average credibility score of evidence
    const avgCredibility = evidence.reduce((sum, e) => sum + (e.credibilityScore || 0.5), 0) / evidence.length;
    
    // Boost for multiple high-credibility sources
    const highCredibilitySources = evidence.filter(e => (e.credibilityScore || 0.5) > 0.8).length;
    const credibilityBoost = Math.min(0.2, highCredibilitySources * 0.05);

    return Math.max(0.1, Math.min(1.0, avgCredibility + credibilityBoost));
  }

  /**
   * Calculate methodological confidence
   */
  private calculateMethodologicalConfidence(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[]
  ): number {
    let score = 0.7; // Base methodological confidence

    // Sufficient evidence for reliable analysis
    if (evidence.length >= 5) score += 0.1;
    if (evidence.length >= 10) score += 0.1;

    // Context depth
    if (context.tokenCount >= 2000) score += 0.05;
    if (context.tokenCount >= 4000) score += 0.05;

    // Evidence diversity
    const evidenceTypes = new Set(evidence.map(e => e.evidenceType));
    if (evidenceTypes.size >= 3) score += 0.1;

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Calculate uncertainty factors
   */
  private calculateUncertaintyFactors(
    context: MatrixAnalysisContext,
    evidence: RankedEvidence[],
    impactCalculation: ImpactCalculationInput
  ): UncertaintyFactors {
    // Data sparsity uncertainty
    const dataSparsity = Math.max(0, 1 - (evidence.length / 15));
    
    // Source diversity uncertainty
    const sourceTypes = new Set(evidence.map(e => e.evidenceType));
    const sourceDiversity = Math.max(0, 1 - (sourceTypes.size / 6));
    
    // Model uncertainty (simplified)
    const modelUncertainty = 0.2; // Constant for now, would be dynamic in production
    
    // Temporal uncertainty
    const avgRecency = evidence.reduce((sum, e) => sum + (e.recencyScore || 0.5), 0) / Math.max(1, evidence.length);
    const temporalUncertainty = Math.max(0, 1 - avgRecency);

    const overallUncertainty = (dataSparsity + sourceDiversity + modelUncertainty + temporalUncertainty) / 4;

    return {
      dataSparsity,
      sourceDiversity,
      modelUncertainty,
      temporalUncertainty,
      overallUncertainty
    };
  }

  /**
   * Calculate overall confidence with uncertainty penalty
   */
  private calculateOverallConfidence(
    dimensions: ConfidenceDimensions,
    uncertainty: UncertaintyFactors
  ): number {
    // Weighted average of confidence dimensions
    const weightedAverage = (
      dimensions.dataQuality * 0.25 +
      dimensions.evidenceStrength * 0.25 +
      dimensions.analysisConsistency * 0.2 +
      dimensions.temporalReliability * 0.1 +
      dimensions.sourceCredibility * 0.1 +
      dimensions.methodological * 0.1
    );

    // Apply uncertainty penalty
    const uncertaintyPenalty = uncertainty.overallUncertainty * this.uncertaintyPenalty;
    
    return Math.max(0.1, Math.min(1.0, weightedAverage - uncertaintyPenalty));
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    overallConfidence: number,
    uncertainty: UncertaintyFactors
  ): ConfidenceInterval {
    const margin = uncertainty.overallUncertainty * 0.3;
    
    return {
      lower: Math.max(0, overallConfidence - margin),
      upper: Math.min(1, overallConfidence + margin),
      width: margin * 2
    };
  }

  /**
   * Assign quality grade
   */
  private assignQualityGrade(confidence: number): QualityGrade {
    if (confidence >= 0.9) return 'A+';
    if (confidence >= 0.8) return 'A';
    if (confidence >= 0.7) return 'B+';
    if (confidence >= 0.6) return 'B';
    if (confidence >= 0.5) return 'C+';
    if (confidence >= 0.4) return 'C';
    if (confidence >= 0.3) return 'D';
    return 'F';
  }

  /**
   * Generate confidence recommendations
   */
  private generateConfidenceRecommendations(
    confidence: number,
    uncertainty: UncertaintyFactors,
    evidenceCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (confidence < 0.5) {
      recommendations.push('Low confidence - consider gathering additional evidence before making decisions');
    }

    if (uncertainty.dataSparsity > 0.6) {
      recommendations.push('Limited data available - seek additional sources to improve analysis reliability');
    }

    if (uncertainty.sourceDiversity > 0.5) {
      recommendations.push('Evidence from limited source types - diversify information sources for better coverage');
    }

    if (uncertainty.temporalUncertainty > 0.6) {
      recommendations.push('Evidence may be outdated - update with recent market information');
    }

    if (evidenceCount < 5) {
      recommendations.push('Insufficient evidence for robust analysis - minimum 5-10 sources recommended');
    }

    if (confidence >= 0.8) {
      recommendations.push('High confidence analysis - findings suitable for strategic decision-making');
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  /**
   * Interpret confidence bounds for impact score
   */
  private interpretConfidenceBounds(
    pointEstimate: number,
    lowerBound: number,
    upperBound: number,
    confidence: number
  ): string {
    const range = upperBound - lowerBound;
    
    if (range < 0.1) {
      return `High precision estimate with narrow range (±${(range * 50).toFixed(1)}%)`;
    } else if (range < 0.3) {
      return `Moderate precision estimate with reasonable uncertainty (±${(range * 50).toFixed(1)}%)`;
    } else {
      return `Wide confidence bounds indicate significant uncertainty (±${(range * 50).toFixed(1)}%)`;
    }
  }
}

// Type definitions

export interface ComprehensiveConfidenceScore {
  overall: number;
  dimensions: ConfidenceDimensions;
  uncertainty: UncertaintyFactors;
  confidenceInterval: ConfidenceInterval;
  qualityGrade: QualityGrade;
  recommendations: string[];
}

export interface ConfidenceDimensions {
  dataQuality: number;
  evidenceStrength: number;
  analysisConsistency: number;
  temporalReliability: number;
  sourceCredibility: number;
  methodological: number;
}

export interface UncertaintyFactors {
  dataSparsity: number;
  sourceDiversity: number;
  modelUncertainty: number;
  temporalUncertainty: number;
  overallUncertainty: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  width: number;
}

export interface ImpactConfidenceBounds {
  pointEstimate: number;
  lowerBound: number;
  upperBound: number;
  marginOfError: number;
  confidenceLevel: number;
  interpretation: string;
}

export interface ConfidenceDegradation {
  originalConfidence: number;
  currentConfidence: number;
  degradationRate: number;
  daysSinceAnalysis: number;
  recommendRefresh: boolean;
  freshnessFactor: number;
}

export interface ConfidenceComparison {
  highestConfidence: { analysisId: string; confidence: number };
  lowestConfidence: { analysisId: string; confidence: number };
  averageConfidence: number;
  confidenceVariance: number;
  consistencyRating: 'excellent' | 'good' | 'moderate' | 'poor';
}

interface ImpactCalculationInput {
  score: number;
  direction: 'positive' | 'negative' | 'neutral';
  breakdown?: any;
}

type QualityGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

// Export a default instance
export const confidenceScoringService = new ConfidenceScoringService();

// Utility functions
export function interpretConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return 'High confidence - suitable for major decisions';
  if (confidence >= 0.6) return 'Moderate confidence - proceed with caution';
  if (confidence >= 0.4) return 'Low confidence - seek additional validation';
  return 'Very low confidence - insufficient for decision-making';
}

export function calculateConfidenceTrend(
  historicalConfidence: number[],
  timePeriodsBack: number = 5
): 'improving' | 'stable' | 'declining' {
  if (historicalConfidence.length < 2) return 'stable';
  
  const recent = historicalConfidence.slice(-timePeriodsBack);
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, c) => sum + c, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, c) => sum + c, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 0.05) return 'improving';
  if (secondAvg < firstAvg - 0.05) return 'declining';
  return 'stable';
} 