import { prisma } from '../db';
import { logger } from '../logger';

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'MatrixCalculationService' });

// Technology categories enum (matching T-171 implementation)
export enum TechnologyCategory {
  AI_COMPUTE = 'AI_COMPUTE',
  ROBOTICS_PHYSICAL_AI = 'ROBOTICS_PHYSICAL_AI',
  QUANTUM_COMPUTING = 'QUANTUM_COMPUTING',
  TRADITIONAL_TECH = 'TRADITIONAL_TECH',
  BIOTECH_HEALTH = 'BIOTECH_HEALTH',
  FINTECH_CRYPTO = 'FINTECH_CRYPTO',
  ENERGY_CLEANTECH = 'ENERGY_CLEANTECH',
  SPACE_DEFENSE = 'SPACE_DEFENSE',
  OTHER = 'OTHER'
}

// Scenario types
export enum ScenarioType {
  TECHNOLOGY = 'TECHNOLOGY',
  ECONOMIC = 'ECONOMIC',
  GEOPOLITICAL = 'GEOPOLITICAL',
  REGULATORY = 'REGULATORY',
  MARKET = 'MARKET'
}

// Core interfaces
export interface AssetScenarioCalculation {
  assetId: string;
  assetName: string;
  assetCategory: TechnologyCategory | null;
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  baseImpact: number;
  technologyMultiplier: number;
  timelineAdjustment: number;
  confidenceScore: number;
  finalImpact: number;
  explanation: string;
}

export interface MatrixCalculationResult {
  userId: string;
  calculations: AssetScenarioCalculation[];
  portfolioAggregation: {
    averageImpact: number;
    riskScore: number;
    opportunityScore: number;
    categoryExposure: Record<TechnologyCategory, number>;
  };
  lastCalculatedAt: Date;
  calculationVersion: string;
}

/**
 * Technology impact multipliers based on category-scenario relationships
 */
const TECHNOLOGY_MULTIPLIERS = {
  [TechnologyCategory.AI_COMPUTE]: {
    [ScenarioType.TECHNOLOGY]: 2.5,
    [ScenarioType.REGULATORY]: 1.8,
    [ScenarioType.ECONOMIC]: 1.3,
    [ScenarioType.GEOPOLITICAL]: 1.4,
    [ScenarioType.MARKET]: 1.2
  },
  [TechnologyCategory.ROBOTICS_PHYSICAL_AI]: {
    [ScenarioType.TECHNOLOGY]: 3.0,
    [ScenarioType.REGULATORY]: 1.6,
    [ScenarioType.ECONOMIC]: 1.4,
    [ScenarioType.GEOPOLITICAL]: 1.2,
    [ScenarioType.MARKET]: 1.3
  },
  [TechnologyCategory.QUANTUM_COMPUTING]: {
    [ScenarioType.TECHNOLOGY]: 4.0,
    [ScenarioType.REGULATORY]: 1.2,
    [ScenarioType.ECONOMIC]: 1.1,
    [ScenarioType.GEOPOLITICAL]: 1.8,
    [ScenarioType.MARKET]: 1.0
  },
  [TechnologyCategory.BIOTECH_HEALTH]: {
    [ScenarioType.TECHNOLOGY]: 2.2,
    [ScenarioType.REGULATORY]: 2.0,
    [ScenarioType.ECONOMIC]: 1.3,
    [ScenarioType.GEOPOLITICAL]: 1.4,
    [ScenarioType.MARKET]: 1.5
  },
  [TechnologyCategory.FINTECH_CRYPTO]: {
    [ScenarioType.TECHNOLOGY]: 1.8,
    [ScenarioType.REGULATORY]: 2.5,
    [ScenarioType.ECONOMIC]: 2.0,
    [ScenarioType.GEOPOLITICAL]: 1.7,
    [ScenarioType.MARKET]: 2.2
  },
  [TechnologyCategory.ENERGY_CLEANTECH]: {
    [ScenarioType.TECHNOLOGY]: 2.0,
    [ScenarioType.REGULATORY]: 2.3,
    [ScenarioType.ECONOMIC]: 1.5,
    [ScenarioType.GEOPOLITICAL]: 1.9,
    [ScenarioType.MARKET]: 1.6
  },
  [TechnologyCategory.SPACE_DEFENSE]: {
    [ScenarioType.TECHNOLOGY]: 1.7,
    [ScenarioType.REGULATORY]: 1.3,
    [ScenarioType.ECONOMIC]: 1.2,
    [ScenarioType.GEOPOLITICAL]: 2.5,
    [ScenarioType.MARKET]: 1.1
  },
  [TechnologyCategory.TRADITIONAL_TECH]: {
    [ScenarioType.TECHNOLOGY]: 1.2,
    [ScenarioType.REGULATORY]: 1.4,
    [ScenarioType.ECONOMIC]: 1.6,
    [ScenarioType.GEOPOLITICAL]: 1.5,
    [ScenarioType.MARKET]: 1.8
  },
  [TechnologyCategory.OTHER]: {
    [ScenarioType.TECHNOLOGY]: 1.0,
    [ScenarioType.REGULATORY]: 1.0,
    [ScenarioType.ECONOMIC]: 1.0,
    [ScenarioType.GEOPOLITICAL]: 1.0,
    [ScenarioType.MARKET]: 1.0
  }
};

/**
 * Main Matrix Calculation Service
 */
export class MatrixCalculationService {
  
  /**
   * Calculate matrix impacts for a user's complete portfolio
   */
  async calculateUserMatrix(userId: string): Promise<MatrixCalculationResult> {
    serviceLogger.info('Starting matrix calculation', { userId });
    
    try {
      // Get user's assets with categorization
      const assets = await this.getUserCategorizedAssets(userId);
      
      if (assets.length === 0) {
        throw new Error('No categorized assets found for matrix calculation');
      }
      
      // Get technology scenarios
      const scenarios = await this.getTechnologyScenarios();
      
      if (scenarios.length === 0) {
        throw new Error('No scenarios found for matrix calculation');
      }
      
      // Calculate asset-scenario impacts
      const calculations = await this.calculateAssetScenarioImpacts(assets, scenarios);
      
      // Aggregate portfolio-level insights
      const portfolioAggregation = this.aggregatePortfolioImpacts(calculations, assets);
      
      const result: MatrixCalculationResult = {
        userId,
        calculations,
        portfolioAggregation,
        lastCalculatedAt: new Date(),
        calculationVersion: '1.0.0'
      };
      
      serviceLogger.info('Matrix calculation completed', {
        userId,
        assetCount: assets.length,
        scenarioCount: scenarios.length,
        calculationCount: calculations.length,
        averageImpact: portfolioAggregation.averageImpact
      });
      
      return result;
      
    } catch (error) {
      serviceLogger.error('Matrix calculation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Get user's categorized assets
   */
  private async getUserCategorizedAssets(userId: string) {
    const assets = await prisma.asset.findMany({
      where: { 
        userId
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return assets;
  }
  
  /**
   * Get technology scenarios
   */
  private async getTechnologyScenarios() {
    const scenarios = await prisma.scenario.findMany({
      where: {
        type: { in: Object.values(ScenarioType) }
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        timeline: true,
        probability: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return scenarios;
  }
  
  /**
   * Calculate impact scores for each asset-scenario combination
   */
  private async calculateAssetScenarioImpacts(assets: any[], scenarios: any[]): Promise<AssetScenarioCalculation[]> {
    const calculations: AssetScenarioCalculation[] = [];
    
    for (const asset of assets) {
      for (const scenario of scenarios) {
        const calculation = await this.calculateSingleAssetScenarioImpact(asset, scenario);
        calculations.push(calculation);
      }
    }
    
    return calculations;
  }
  
  /**
   * Calculate impact for a single asset-scenario pair
   */
  private async calculateSingleAssetScenarioImpact(asset: any, scenario: any): Promise<AssetScenarioCalculation> {
    // Get base impact (simplified for now)
    const baseImpact = this.getBaseImpact(scenario);
    
    // Get technology multiplier
    const technologyMultiplier = this.getTechnologyMultiplier(
      asset.category as TechnologyCategory,
      scenario.type as ScenarioType
    );
    
    // Calculate timeline adjustment
    const timelineAdjustment = this.calculateTimelineAdjustment(scenario.timeline, scenario.probability);
    
    // Calculate confidence score
    const confidenceScore = asset.categoryConfidence || 0.5;
    
    // Calculate final impact
    const finalImpact = this.calculateFinalImpact({
      baseImpact,
      technologyMultiplier,
      timelineAdjustment,
      confidenceScore
    });
    
    // Generate explanation
    const explanation = this.generateImpactExplanation({
      assetName: asset.name,
      assetCategory: asset.category,
      scenarioName: scenario.name,
      scenarioType: scenario.type,
      finalImpact,
      technologyMultiplier
    });
    
    return {
      assetId: asset.id,
      assetName: asset.name,
      assetCategory: asset.category,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      scenarioType: scenario.type,
      baseImpact,
      technologyMultiplier,
      timelineAdjustment,
      confidenceScore,
      finalImpact,
      explanation
    };
  }
  
  /**
   * Get base impact score
   */
  private getBaseImpact(scenario: any): number {
    const probabilityMultiplier = (scenario.probability || 0.5) / 100;
    
    if (scenario.type === ScenarioType.TECHNOLOGY) {
      return 2.0 + probabilityMultiplier;
    } else if (scenario.type === ScenarioType.REGULATORY) {
      return 1.5 + probabilityMultiplier;
    } else {
      return 1.0 + probabilityMultiplier;
    }
  }
  
  /**
   * Get technology multiplier
   */
  private getTechnologyMultiplier(category: TechnologyCategory, scenarioType: ScenarioType): number {
    const categoryMultipliers = TECHNOLOGY_MULTIPLIERS[category];
    if (!categoryMultipliers) {
      return 1.0;
    }
    return categoryMultipliers[scenarioType] || 1.0;
  }
  
  /**
   * Calculate timeline adjustment factor
   */
  private calculateTimelineAdjustment(timeline: string | null, probability: number | null): number {
    const years = this.parseTimelineToYears(timeline);
    const prob = (probability || 50) / 100;
    
    if (years <= 2) {
      return 1.2 + (prob * 0.3);
    } else if (years <= 5) {
      return 1.0 + (prob * 0.2);
    } else {
      return 0.8 + (prob * 0.2);
    }
  }
  
  /**
   * Parse timeline to years
   */
  private parseTimelineToYears(timeline: string | null): number {
    if (!timeline) return 5;
    
    if (timeline.includes('2024') || timeline.includes('2025')) return 1;
    if (timeline.includes('2026') || timeline.includes('2027')) return 3;
    if (timeline.includes('2028') || timeline.includes('2029')) return 5;
    if (timeline.includes('2030')) return 7;
    
    return 5;
  }
  
  /**
   * Calculate final impact with all adjustments
   */
  private calculateFinalImpact({
    baseImpact,
    technologyMultiplier,
    timelineAdjustment,
    confidenceScore
  }: {
    baseImpact: number;
    technologyMultiplier: number;
    timelineAdjustment: number;
    confidenceScore: number;
  }): number {
    const rawImpact = baseImpact * technologyMultiplier * timelineAdjustment;
    const confidenceAdjusted = rawImpact * (0.5 + confidenceScore * 0.5);
    
    return Math.max(-5, Math.min(5, Math.round(confidenceAdjusted * 100) / 100));
  }
  
  /**
   * Generate impact explanation
   */
  private generateImpactExplanation({
    assetName,
    assetCategory,
    scenarioName,
    scenarioType,
    finalImpact,
    technologyMultiplier
  }: {
    assetName: string;
    assetCategory: TechnologyCategory;
    scenarioName: string;
    scenarioType: ScenarioType;
    finalImpact: number;
    technologyMultiplier: number;
  }): string {
    const categoryName = this.formatCategoryName(assetCategory);
    const impactDirection = finalImpact > 0 ? 'benefits from' : 'is negatively affected by';
    const impactMagnitude = Math.abs(finalImpact) > 3 ? 'significantly' : 
                           Math.abs(finalImpact) > 1 ? 'moderately' : 'slightly';
    
    let explanation = `${assetName} (${categoryName}) ${impactMagnitude} ${impactDirection} ${scenarioName}`;
    
    if (technologyMultiplier > 2.0) {
      explanation += ` due to direct technology category alignment`;
    }
    
    return explanation;
  }
  
  /**
   * Aggregate portfolio impacts
   */
  private aggregatePortfolioImpacts(calculations: AssetScenarioCalculation[], assets: any[]) {
    const impacts = calculations.map(c => c.finalImpact);
    const averageImpact = impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
    
    const negativeImpacts = impacts.filter(i => i < 0);
    const positiveImpacts = impacts.filter(i => i > 0);
    
    const riskScore = negativeImpacts.length > 0 ? 
      Math.abs(negativeImpacts.reduce((sum, i) => sum + i, 0) / negativeImpacts.length) : 0;
    
    const opportunityScore = positiveImpacts.length > 0 ?
      positiveImpacts.reduce((sum, i) => sum + i, 0) / positiveImpacts.length : 0;
    
    const categoryExposure = assets.reduce((acc, asset) => {
      const category = asset.category as TechnologyCategory;
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<TechnologyCategory, number>);
    
    return {
      averageImpact: Math.round(averageImpact * 100) / 100,
      riskScore: Math.round(riskScore * 100) / 100,
      opportunityScore: Math.round(opportunityScore * 100) / 100,
      categoryExposure
    };
  }
  
  /**
   * Format category names
   */
  private formatCategoryName(category: TechnologyCategory): string {
    const formatMap: Record<TechnologyCategory, string> = {
      [TechnologyCategory.AI_COMPUTE]: 'AI & Compute',
      [TechnologyCategory.ROBOTICS_PHYSICAL_AI]: 'Robotics & Physical AI',
      [TechnologyCategory.QUANTUM_COMPUTING]: 'Quantum Computing',
      [TechnologyCategory.BIOTECH_HEALTH]: 'Biotech & Health',
      [TechnologyCategory.FINTECH_CRYPTO]: 'Fintech & Crypto',
      [TechnologyCategory.ENERGY_CLEANTECH]: 'Energy & Cleantech',
      [TechnologyCategory.SPACE_DEFENSE]: 'Space & Defense',
      [TechnologyCategory.TRADITIONAL_TECH]: 'Traditional Tech',
      [TechnologyCategory.OTHER]: 'Other'
    };
    
    return formatMap[category] || category;
  }
}

// Export service instance
export const matrixCalculationService = new MatrixCalculationService(); 