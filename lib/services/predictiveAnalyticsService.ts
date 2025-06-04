import { logger } from '../logger';

// Predictive analytics types
interface TrendDataPoint {
  timestamp: Date;
  value: number;
  confidence: number;
  category: string;
}

interface TrendAnalysis {
  trend: 'ACCELERATING' | 'STABLE' | 'DECLINING';
  momentum: number; // -1 to 1
  confidence: number; // 0 to 1
  trendStrength: 'WEAK' | 'MODERATE' | 'STRONG';
  prediction: {
    nextPeriod: number;
    confidenceInterval: [number, number];
    timeframe: string;
  };
}

interface RiskMetrics {
  valueAtRisk: number; // 95% VaR for technology disruption
  correlationMatrix: Record<string, Record<string, number>>;
  concentrationRisk: number; // 0 to 1
  diversificationScore: number; // 0 to 100
  categoryRisks: Record<string, number>;
}

interface RecommendationEngine {
  rebalancingSuggestions: Array<{
    action: 'INCREASE' | 'DECREASE' | 'MAINTAIN';
    category: string;
    currentExposure: number;
    recommendedExposure: number;
    reasoning: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  opportunityAlerts: Array<{
    category: string;
    title: string;
    description: string;
    potential: 'HIGH' | 'MEDIUM' | 'LOW';
    timeframe: string;
    confidence: number;
  }>;
  riskMitigation: Array<{
    riskType: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: string;
    implementation: string;
  }>;
}

const analyticsLogger = logger.child({ service: 'predictive-analytics' });

export class PredictiveAnalyticsService {
  
  /**
   * Analyze technology adoption trends
   */
  static async analyzeTechnologyTrends(category: string, historicalData: TrendDataPoint[]): Promise<TrendAnalysis> {
    analyticsLogger.info('Analyzing technology trends', { category, dataPoints: historicalData.length });
    
    if (historicalData.length < 3) {
      return {
        trend: 'STABLE',
        momentum: 0,
        confidence: 0.1,
        trendStrength: 'WEAK',
        prediction: {
          nextPeriod: historicalData[historicalData.length - 1]?.value || 0,
          confidenceInterval: [0, 0],
          timeframe: 'Insufficient data'
        }
      };
    }

    // Sort data by timestamp
    const sortedData = historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate trend using linear regression
    const n = sortedData.length;
    const x = sortedData.map((_, i) => i);
    const y = sortedData.map(d => d.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate momentum and trend strength
    const momentum = Math.tanh(slope * 10); // Normalize slope to -1 to 1
    const absoluteMomentum = Math.abs(momentum);
    
    let trend: TrendAnalysis['trend'];
    if (momentum > 0.1) trend = 'ACCELERATING';
    else if (momentum < -0.1) trend = 'DECLINING';
    else trend = 'STABLE';
    
    let trendStrength: TrendAnalysis['trendStrength'];
    if (absoluteMomentum > 0.7) trendStrength = 'STRONG';
    else if (absoluteMomentum > 0.3) trendStrength = 'MODERATE';
    else trendStrength = 'WEAK';
    
    // Calculate prediction confidence based on data quality
    const avgConfidence = sortedData.reduce((sum, d) => sum + d.confidence, 0) / n;
    const dataConsistency = this.calculateDataConsistency(sortedData);
    const overallConfidence = (avgConfidence + dataConsistency) / 2;
    
    // Predict next period
    const nextX = n;
    const nextPrediction = slope * nextX + intercept;
    const standardError = this.calculateStandardError(sortedData, slope, intercept);
    const confidenceInterval: [number, number] = [
      nextPrediction - 1.96 * standardError,
      nextPrediction + 1.96 * standardError
    ];
    
    return {
      trend,
      momentum,
      confidence: overallConfidence,
      trendStrength,
      prediction: {
        nextPeriod: nextPrediction,
        confidenceInterval,
        timeframe: '3-6 months'
      }
    };
  }

  /**
   * Calculate portfolio risk metrics including VaR and correlations
   */
  static async calculateRiskMetrics(portfolioData: any[]): Promise<RiskMetrics> {
    analyticsLogger.info('Calculating risk metrics', { portfolioSize: portfolioData.length });
    
    const categories = [...new Set(portfolioData.map(asset => asset.category))];
    
    // Calculate category exposures
    const categoryExposures = categories.reduce((acc, category) => {
      const categoryAssets = portfolioData.filter(asset => asset.category === category);
      acc[category] = categoryAssets.length / portfolioData.length;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate correlation matrix between categories
    const correlationMatrix = await this.calculateCorrelationMatrix(categories, portfolioData);
    
    // Calculate concentration risk (Herfindahl index)
    const concentrationRisk = Object.values(categoryExposures)
      .reduce((sum, exposure) => sum + exposure * exposure, 0);
    
    // Calculate diversification score (inverse of concentration)
    const maxDiversification = 1 / categories.length;
    const diversificationScore = Math.max(0, (1 - concentrationRisk / maxDiversification)) * 100;
    
    // Calculate Value at Risk (simplified technology disruption VaR)
    const valueAtRisk = await this.calculateTechnologyVaR(portfolioData, categoryExposures);
    
    // Calculate individual category risks
    const categoryRisks = await this.calculateCategoryRisks(categories, portfolioData);
    
    return {
      valueAtRisk,
      correlationMatrix,
      concentrationRisk,
      diversificationScore,
      categoryRisks
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  static async generateRecommendations(
    portfolioData: any[], 
    riskMetrics: RiskMetrics, 
    trendAnalyses: Record<string, TrendAnalysis>
  ): Promise<RecommendationEngine> {
    analyticsLogger.info('Generating AI recommendations', { 
      portfolioSize: portfolioData.length,
      trendCategories: Object.keys(trendAnalyses).length 
    });
    
    const rebalancingSuggestions = await this.generateRebalancingSuggestions(portfolioData, riskMetrics, trendAnalyses);
    const opportunityAlerts = await this.generateOpportunityAlerts(trendAnalyses);
    const riskMitigation = await this.generateRiskMitigation(riskMetrics);
    
    return {
      rebalancingSuggestions,
      opportunityAlerts,
      riskMitigation
    };
  }

  /**
   * Calculate comprehensive portfolio analytics
   */
  static async calculatePortfolioAnalytics(portfolioData: any[]): Promise<{
    riskMetrics: RiskMetrics;
    trendAnalyses: Record<string, TrendAnalysis>;
    recommendations: RecommendationEngine;
    performanceMetrics: any;
  }> {
    const startTime = Date.now();
    analyticsLogger.info('Starting comprehensive portfolio analytics');
    
    try {
      // Generate mock historical data for trends (in production, this would come from real data)
      const mockHistoricalData = this.generateMockHistoricalData(portfolioData);
      
      // Calculate risk metrics
      const riskMetrics = await this.calculateRiskMetrics(portfolioData);
      
      // Analyze trends for each category
      const categories = [...new Set(portfolioData.map(asset => asset.category))];
      const trendAnalyses: Record<string, TrendAnalysis> = {};
      
      for (const category of categories) {
        const categoryData = mockHistoricalData.filter(d => d.category === category);
        trendAnalyses[category] = await this.analyzeTechnologyTrends(category, categoryData);
      }
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(portfolioData, riskMetrics, trendAnalyses);
      
      // Calculate performance metrics
      const performanceMetrics = {
        analysisTime: Date.now() - startTime,
        dataQuality: this.assessDataQuality(portfolioData),
        confidence: this.calculateOverallConfidence(trendAnalyses),
        lastUpdated: new Date()
      };
      
      analyticsLogger.info('Portfolio analytics completed', {
        analysisTime: performanceMetrics.analysisTime,
        categoriesAnalyzed: categories.length,
        recommendationsGenerated: recommendations.rebalancingSuggestions.length
      });
      
      return {
        riskMetrics,
        trendAnalyses,
        recommendations,
        performanceMetrics
      };
      
    } catch (error) {
      analyticsLogger.error('Portfolio analytics failed', error);
      throw new Error(`Analytics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private static calculateDataConsistency(data: TrendDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation relative to mean indicates higher consistency
    const coefficientOfVariation = standardDeviation / Math.abs(mean);
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private static calculateStandardError(data: TrendDataPoint[], slope: number, intercept: number): number {
    const n = data.length;
    if (n <= 2) return 0;
    
    const residualSumSquares = data.reduce((sum, point, i) => {
      const predicted = slope * i + intercept;
      const residual = point.value - predicted;
      return sum + residual * residual;
    }, 0);
    
    return Math.sqrt(residualSumSquares / (n - 2));
  }

  private static async calculateCorrelationMatrix(categories: string[], portfolioData: any[]): Promise<Record<string, Record<string, number>>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    // Initialize matrix
    categories.forEach(cat1 => {
      matrix[cat1] = {};
      categories.forEach(cat2 => {
        if (cat1 === cat2) {
          matrix[cat1][cat2] = 1.0;
        } else {
          // Simplified correlation calculation (in production, use real market data)
          matrix[cat1][cat2] = this.estimateCategoryCorrelation(cat1, cat2);
        }
      });
    });
    
    return matrix;
  }

  private static estimateCategoryCorrelation(cat1: string, cat2: string): number {
    // Simplified correlation estimates based on technology relationships
    const correlationMap: Record<string, Record<string, number>> = {
      'AI_COMPUTE': { 'ROBOTICS_PHYSICAL_AI': 0.8, 'QUANTUM_COMPUTING': 0.6, 'TRADITIONAL': 0.2 },
      'ROBOTICS_PHYSICAL_AI': { 'AI_COMPUTE': 0.8, 'QUANTUM_COMPUTING': 0.4, 'TRADITIONAL': 0.1 },
      'QUANTUM_COMPUTING': { 'AI_COMPUTE': 0.6, 'ROBOTICS_PHYSICAL_AI': 0.4, 'TRADITIONAL': 0.3 },
      'TRADITIONAL': { 'AI_COMPUTE': 0.2, 'ROBOTICS_PHYSICAL_AI': 0.1, 'QUANTUM_COMPUTING': 0.3 }
    };
    
    return correlationMap[cat1]?.[cat2] || 0.3; // Default moderate correlation
  }

  private static async calculateTechnologyVaR(portfolioData: any[], exposures: Record<string, number>): Promise<number> {
    // Simplified VaR calculation for technology disruption scenarios
    const totalRisk = Object.entries(exposures).reduce((sum, [category, exposure]) => {
      const categoryVolatility = this.getCategoryVolatility(category);
      return sum + (exposure * categoryVolatility);
    }, 0);
    
    // 95% VaR approximation
    return totalRisk * 1.645; // 95th percentile multiplier
  }

  private static getCategoryVolatility(category: string): number {
    const volatilityMap: Record<string, number> = {
      'AI_COMPUTE': 0.45,
      'ROBOTICS_PHYSICAL_AI': 0.55,
      'QUANTUM_COMPUTING': 0.70,
      'BIOTECH_LONGEVITY': 0.60,
      'ENERGY_STORAGE': 0.40,
      'TRADITIONAL': 0.20
    };
    
    return volatilityMap[category] || 0.35;
  }

  private static async calculateCategoryRisks(categories: string[], portfolioData: any[]): Promise<Record<string, number>> {
    return categories.reduce((risks, category) => {
      const categoryAssets = portfolioData.filter(asset => asset.category === category);
      const baseVolatility = this.getCategoryVolatility(category);
      const concentrationFactor = categoryAssets.length / portfolioData.length;
      
      risks[category] = baseVolatility * (1 + concentrationFactor);
      return risks;
    }, {} as Record<string, number>);
  }

  private static async generateRebalancingSuggestions(
    portfolioData: any[], 
    riskMetrics: RiskMetrics, 
    trendAnalyses: Record<string, TrendAnalysis>
  ): Promise<RecommendationEngine['rebalancingSuggestions']> {
    const suggestions: RecommendationEngine['rebalancingSuggestions'] = [];
    
    Object.entries(trendAnalyses).forEach(([category, analysis]) => {
      const currentExposure = portfolioData.filter(asset => asset.category === category).length / portfolioData.length;
      let recommendedExposure = currentExposure;
      let action: 'INCREASE' | 'DECREASE' | 'MAINTAIN' = 'MAINTAIN';
      let reasoning = `Current ${category} exposure is balanced`;
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      
      // Adjust based on trend analysis
      if (analysis.trend === 'ACCELERATING' && analysis.confidence > 0.7) {
        recommendedExposure = Math.min(currentExposure * 1.2, 0.4); // Cap at 40%
        action = 'INCREASE';
        reasoning = `Strong acceleration trend with ${Math.round(analysis.confidence * 100)}% confidence`;
        priority = analysis.trendStrength === 'STRONG' ? 'HIGH' : 'MEDIUM';
      } else if (analysis.trend === 'DECLINING' && analysis.confidence > 0.6) {
        recommendedExposure = currentExposure * 0.8;
        action = 'DECREASE';
        reasoning = `Declining trend detected, reduce exposure to mitigate risk`;
        priority = 'MEDIUM';
      }
      
      // Adjust based on risk metrics
      const categoryRisk = riskMetrics.categoryRisks[category] || 0;
      if (categoryRisk > 0.6 && currentExposure > 0.3) {
        recommendedExposure = Math.min(recommendedExposure, 0.25);
        action = 'DECREASE';
        reasoning += `. High category risk (${Math.round(categoryRisk * 100)}%) suggests reduced exposure`;
        priority = 'HIGH';
      }
      
      suggestions.push({
        action,
        category,
        currentExposure: Math.round(currentExposure * 100),
        recommendedExposure: Math.round(recommendedExposure * 100),
        reasoning,
        priority
      });
    });
    
    return suggestions;
  }

  private static async generateOpportunityAlerts(trendAnalyses: Record<string, TrendAnalysis>): Promise<RecommendationEngine['opportunityAlerts']> {
    const alerts: RecommendationEngine['opportunityAlerts'] = [];
    
    Object.entries(trendAnalyses).forEach(([category, analysis]) => {
      if (analysis.trend === 'ACCELERATING' && analysis.confidence > 0.8) {
        alerts.push({
          category,
          title: `${category} Technology Acceleration`,
          description: `Strong momentum detected in ${category} sector with ${analysis.trendStrength.toLowerCase()} trend strength`,
          potential: analysis.momentum > 0.7 ? 'HIGH' : 'MEDIUM',
          timeframe: analysis.prediction.timeframe,
          confidence: analysis.confidence
        });
      }
    });
    
    return alerts;
  }

  private static async generateRiskMitigation(riskMetrics: RiskMetrics): Promise<RecommendationEngine['riskMitigation']> {
    const mitigations: RecommendationEngine['riskMitigation'] = [];
    
    // Concentration risk
    if (riskMetrics.concentrationRisk > 0.4) {
      mitigations.push({
        riskType: 'Concentration Risk',
        severity: riskMetrics.concentrationRisk > 0.6 ? 'HIGH' : 'MEDIUM',
        recommendation: 'Diversify across more technology categories',
        implementation: `Current concentration index: ${Math.round(riskMetrics.concentrationRisk * 100)}%. Target <25% for better diversification.`
      });
    }
    
    // Technology VaR
    if (riskMetrics.valueAtRisk > 0.3) {
      mitigations.push({
        riskType: 'Technology Disruption Risk',
        severity: riskMetrics.valueAtRisk > 0.5 ? 'HIGH' : 'MEDIUM',
        recommendation: 'Consider defensive technology positions',
        implementation: `95% VaR indicates ${Math.round(riskMetrics.valueAtRisk * 100)}% potential loss in adverse scenarios`
      });
    }
    
    return mitigations;
  }

  private static generateMockHistoricalData(portfolioData: any[]): TrendDataPoint[] {
    const categories = [...new Set(portfolioData.map(asset => asset.category))];
    const data: TrendDataPoint[] = [];
    
    categories.forEach(category => {
      // Generate 12 months of mock data
      for (let i = 0; i < 12; i++) {
        const baseValue = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
        const trend = this.getCategoryTrend(category);
        const value = baseValue + (trend * i * 0.05); // Apply trend over time
        
        data.push({
          timestamp: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000), // Monthly intervals
          value: Math.max(0, Math.min(1, value)),
          confidence: 0.7 + Math.random() * 0.3, // 0.7 to 1.0
          category
        });
      }
    });
    
    return data;
  }

  private static getCategoryTrend(category: string): number {
    const trendMap: Record<string, number> = {
      'AI_COMPUTE': 0.8,
      'ROBOTICS_PHYSICAL_AI': 0.6,
      'QUANTUM_COMPUTING': 1.0,
      'BIOTECH_LONGEVITY': 0.4,
      'ENERGY_STORAGE': 0.5,
      'TRADITIONAL': -0.2
    };
    
    return trendMap[category] || 0;
  }

  private static assessDataQuality(portfolioData: any[]): number {
    if (portfolioData.length === 0) return 0;
    
    const hasCategories = portfolioData.every(asset => asset.category);
    const hasNames = portfolioData.every(asset => asset.name);
    const categoryDiversity = new Set(portfolioData.map(asset => asset.category)).size;
    
    let quality = 0;
    if (hasCategories) quality += 0.4;
    if (hasNames) quality += 0.3;
    if (categoryDiversity >= 3) quality += 0.3;
    
    return quality;
  }

  private static calculateOverallConfidence(trendAnalyses: Record<string, TrendAnalysis>): number {
    const confidences = Object.values(trendAnalyses).map(analysis => analysis.confidence);
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }
}

export default PredictiveAnalyticsService; 