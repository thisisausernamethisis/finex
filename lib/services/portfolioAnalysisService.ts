import { prisma } from '../db';
import { logger } from '../logger';

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'PortfolioAnalysisService' });

// Technology categories enum (matching T-171)
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

// Core interfaces
export interface TechnologyExposure {
  category: TechnologyCategory;
  percentage: number;
  assetCount: number;
  assets: Array<{
    id: string;
    name: string;
    confidence: number;
  }>;
  averageConfidence: number;
}

export interface ConcentrationRisk {
  type: 'HIGH_CONCENTRATION' | 'MODERATE_CONCENTRATION' | 'LOW_DIVERSIFICATION' | 'EMERGING_TECH_HEAVY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  affectedCategories: TechnologyCategory[];
  recommendation: string;
}

export interface PortfolioInsight {
  id: string;
  type: 'EXPOSURE' | 'RISK' | 'OPPORTUNITY' | 'RECOMMENDATION';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface PortfolioAnalysis {
  userId: string;
  totalAssets: number;
  categorizedAssets: number;
  technologyExposure: TechnologyExposure[];
  concentrationRisks: ConcentrationRisk[];
  insights: PortfolioInsight[];
  lastAnalyzedAt: Date;
  analysisVersion: string;
}

/**
 * Main Portfolio Analysis Service
 */
export class PortfolioAnalysisService {
  
  /**
   * Analyze a user's complete portfolio for technology exposure and insights
   */
  async analyzeUserPortfolio(userId: string): Promise<PortfolioAnalysis> {
    serviceLogger.info('Starting portfolio analysis', { userId });
    
    try {
      // Get user's assets with categorization data
      const assets = await this.getUserAssets(userId);
      
      if (assets.length === 0) {
        throw new Error('No assets found for portfolio analysis');
      }
      
      // Calculate technology exposure
      const technologyExposure = this.calculateTechnologyExposure(assets);
      
      // Detect concentration risks
      const concentrationRisks = this.detectConcentrationRisks(technologyExposure, assets);
      
      // Generate AI-powered insights
      const insights = await this.generatePortfolioInsights(assets, technologyExposure, concentrationRisks);
      
      const analysis: PortfolioAnalysis = {
        userId,
        totalAssets: assets.length,
        categorizedAssets: assets.filter(a => a.category).length,
        technologyExposure,
        concentrationRisks,
        insights,
        lastAnalyzedAt: new Date(),
        analysisVersion: '1.0.0'
      };
      
      serviceLogger.info('Portfolio analysis completed', {
        userId,
        totalAssets: analysis.totalAssets,
        categorizedAssets: analysis.categorizedAssets,
        exposureCategories: technologyExposure.length,
        risksDetected: concentrationRisks.length,
        insightsGenerated: insights.length
      });
      
      return analysis;
      
    } catch (error) {
      serviceLogger.error('Portfolio analysis failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Get user's assets with categorization data
   */
  private async getUserAssets(userId: string) {
    const assets = await prisma.asset.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        categoryConfidence: true,
        categoryInsights: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    serviceLogger.debug('Retrieved user assets', {
      userId,
      totalAssets: assets.length,
      categorizedAssets: assets.filter(a => a.category).length
    });
    
    return assets;
  }
  
  /**
   * Calculate technology exposure percentages across categories
   */
  private calculateTechnologyExposure(assets: any[]): TechnologyExposure[] {
    // Filter to categorized assets only
    const categorizedAssets = assets.filter(asset => asset.category);
    
    if (categorizedAssets.length === 0) {
      return [];
    }
    
    // Group assets by category
    const categoryGroups = new Map<TechnologyCategory, any[]>();
    
    categorizedAssets.forEach(asset => {
      const category = asset.category as TechnologyCategory;
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(asset);
    });
    
    // Calculate exposure for each category
    const exposures: TechnologyExposure[] = [];
    
    categoryGroups.forEach((assets, category) => {
      const percentage = (assets.length / categorizedAssets.length) * 100;
      const averageConfidence = assets.reduce((sum, asset) => 
        sum + (asset.categoryConfidence || 0.5), 0) / assets.length;
      
      exposures.push({
        category,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        assetCount: assets.length,
        assets: assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          confidence: asset.categoryConfidence || 0.5
        })),
        averageConfidence: Math.round(averageConfidence * 100) / 100
      });
    });
    
    // Sort by percentage (highest first)
    exposures.sort((a, b) => b.percentage - a.percentage);
    
    return exposures;
  }
  
  /**
   * Detect concentration risks in the portfolio
   */
  private detectConcentrationRisks(
    exposures: TechnologyExposure[], 
    allAssets: any[]
  ): ConcentrationRisk[] {
    const risks: ConcentrationRisk[] = [];
    
    // High concentration risk (>60% in single category)
    const highConcentrationExposure = exposures.find(exp => exp.percentage > 60);
    if (highConcentrationExposure) {
      risks.push({
        type: 'HIGH_CONCENTRATION',
        severity: 'HIGH',
        description: `${highConcentrationExposure.percentage}% of portfolio concentrated in ${this.formatCategoryName(highConcentrationExposure.category)}`,
        affectedCategories: [highConcentrationExposure.category],
        recommendation: `Consider diversifying beyond ${this.formatCategoryName(highConcentrationExposure.category)} to reduce concentration risk`
      });
    }
    
    // Moderate concentration risk (>40% in single category)
    const moderateConcentrationExposure = exposures.find(exp => exp.percentage > 40 && exp.percentage <= 60);
    if (moderateConcentrationExposure && !highConcentrationExposure) {
      risks.push({
        type: 'MODERATE_CONCENTRATION',
        severity: 'MEDIUM',
        description: `${moderateConcentrationExposure.percentage}% of portfolio in ${this.formatCategoryName(moderateConcentrationExposure.category)}`,
        affectedCategories: [moderateConcentrationExposure.category],
        recommendation: `Monitor concentration in ${this.formatCategoryName(moderateConcentrationExposure.category)} and consider diversification`
      });
    }
    
    // Low diversification (fewer than 3 categories)
    if (exposures.length < 3 && exposures.length > 0) {
      risks.push({
        type: 'LOW_DIVERSIFICATION',
        severity: 'MEDIUM',
        description: `Portfolio only covers ${exposures.length} technology categories`,
        affectedCategories: exposures.map(exp => exp.category),
        recommendation: 'Consider expanding into additional technology categories for better diversification'
      });
    }
    
    // Emerging tech heavy (>80% in emerging categories)
    const emergingCategories = [
      TechnologyCategory.AI_COMPUTE,
      TechnologyCategory.ROBOTICS_PHYSICAL_AI,
      TechnologyCategory.QUANTUM_COMPUTING,
      TechnologyCategory.BIOTECH_HEALTH
    ];
    
    const emergingExposure = exposures
      .filter(exp => emergingCategories.includes(exp.category))
      .reduce((sum, exp) => sum + exp.percentage, 0);
    
    if (emergingExposure > 80) {
      risks.push({
        type: 'EMERGING_TECH_HEAVY',
        severity: 'MEDIUM',
        description: `${Math.round(emergingExposure)}% exposure to emerging technologies`,
        affectedCategories: exposures
          .filter(exp => emergingCategories.includes(exp.category))
          .map(exp => exp.category),
        recommendation: 'Consider adding some traditional technology exposure for stability'
      });
    }
    
    return risks;
  }
  
  /**
   * Generate AI-powered portfolio insights
   */
  private async generatePortfolioInsights(
    assets: any[],
    exposures: TechnologyExposure[],
    risks: ConcentrationRisk[]
  ): Promise<PortfolioInsight[]> {
    const insights: PortfolioInsight[] = [];
    
    // Generate exposure insights
    if (exposures.length > 0) {
      const topExposure = exposures[0];
      insights.push({
        id: `exposure-${topExposure.category}`,
        type: 'EXPOSURE',
        title: `${this.formatCategoryName(topExposure.category)} Focused Portfolio`,
        description: `Your portfolio has ${topExposure.percentage}% exposure to ${this.formatCategoryName(topExposure.category)} across ${topExposure.assetCount} asset(s)`,
        impact: topExposure.percentage > 50 ? 'HIGH' : topExposure.percentage > 25 ? 'MEDIUM' : 'LOW',
        confidence: topExposure.averageConfidence
      });
    }
    
    // Generate specific asset insights
    for (const exposure of exposures.slice(0, 3)) { // Top 3 exposures
      if (exposure.assets.length === 1) {
        const asset = exposure.assets[0];
        insights.push({
          id: `single-asset-${exposure.category}`,
          type: 'RISK',
          title: `Single Asset ${this.formatCategoryName(exposure.category)} Exposure`,
          description: `${asset.name} represents 100% of your ${this.formatCategoryName(exposure.category)} exposure`,
          impact: 'MEDIUM',
          confidence: asset.confidence,
          metadata: { assetId: asset.id, category: exposure.category }
        });
      }
    }
    
    // Generate risk insights
    risks.forEach((risk, index) => {
      insights.push({
        id: `risk-${risk.type}-${index}`,
        type: 'RISK',
        title: risk.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: risk.description,
        impact: risk.severity === 'HIGH' ? 'HIGH' : risk.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        confidence: 0.9 // High confidence in rule-based risk detection
      });
    });
    
    // Generate opportunity insights
    const missingCategories = this.identifyMissingCategories(exposures);
    if (missingCategories.length > 0) {
      insights.push({
        id: 'opportunity-diversification',
        type: 'OPPORTUNITY',
        title: 'Diversification Opportunities',
        description: `Consider exposure to ${missingCategories.slice(0, 2).map(cat => this.formatCategoryName(cat)).join(' and ')} for better diversification`,
        impact: 'MEDIUM',
        confidence: 0.8
      });
    }
    
    // Generate recommendation insights
    if (exposures.length > 0) {
      const totalCategorized = assets.filter(a => a.category).length;
      const totalAssets = assets.length;
      
      if (totalCategorized < totalAssets) {
        insights.push({
          id: 'recommendation-categorization',
          type: 'RECOMMENDATION',
          title: 'Complete Asset Categorization',
          description: `${totalAssets - totalCategorized} assets need technology categorization for better portfolio analysis`,
          impact: 'MEDIUM',
          confidence: 1.0
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Identify missing technology categories for diversification opportunities
   */
  private identifyMissingCategories(exposures: TechnologyExposure[]): TechnologyCategory[] {
    const presentCategories = new Set(exposures.map(exp => exp.category));
    const allCategories = Object.values(TechnologyCategory);
    
    return allCategories.filter(category => 
      !presentCategories.has(category) && category !== TechnologyCategory.OTHER
    );
  }
  
  /**
   * Format category names for display
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
export const portfolioAnalysisService = new PortfolioAnalysisService(); 