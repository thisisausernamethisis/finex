import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { createChildLogger } from '../../../../lib/logger';
import { serverError, unauthorized } from '../../../../lib/utils/http';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Define TechnologyCategory enum locally until Prisma client is properly generated
enum TechnologyCategory {
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

// Create a route-specific logger
const logger = createChildLogger({ route: 'GET /api/portfolio/insights' });

// Create repository instance
const assetRepository = new AssetRepository();

/**
 * GET /api/portfolio/insights
 * 
 * Generates comprehensive portfolio insights including:
 * - Technology concentration analysis
 * - Risk exposure assessment  
 * - Asset revelations and hidden insights
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Get all user's assets with categorization data
    const { items: assets } = await assetRepository.listAssets(user.id, 1, 1000);
    
    // Generate portfolio insights
    const insights = await generatePortfolioInsights(assets);
    
    logger.info('Generated portfolio insights', {
      userId: user.id,
      totalAssets: assets.length,
      categorizedAssets: assets.filter(a => a.category).length
    });
    
    return NextResponse.json(insights);
    
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

/**
 * Generate comprehensive portfolio insights
 */
async function generatePortfolioInsights(assets: any[]): Promise<{
  summary: PortfolioSummary;
  concentrations: TechConcentration[];
  revelations: AssetRevelation[];
  risks: ConcentrationRisk[];
  recommendations: string[];
}> {
  const categorizedAssets = assets.filter(asset => asset.category);
  const uncategorizedAssets = assets.filter(asset => !asset.category);
  
  // Calculate technology concentrations
  const concentrations = calculateTechConcentrations(categorizedAssets);
  
  // Generate asset revelations
  const revelations = generateAssetRevelations(categorizedAssets);
  
  // Assess concentration risks
  const risks = assessConcentrationRisks(concentrations);
  
  // Generate strategic recommendations
  const recommendations = generateRecommendations(concentrations, risks, assets.length);
  
  const summary: PortfolioSummary = {
    totalAssets: assets.length,
    categorizedAssets: categorizedAssets.length,
    uncategorizedAssets: uncategorizedAssets.length,
    categorizationProgress: categorizedAssets.length / assets.length,
    dominantCategory: concentrations[0]?.category || null,
    technologyExposure: calculateTotalTechExposure(concentrations),
    portfolioRiskScore: calculatePortfolioRiskScore(risks)
  };
  
  return {
    summary,
    concentrations,
    revelations,
    risks,
    recommendations
  };
}

/**
 * Calculate technology concentration percentages
 */
function calculateTechConcentrations(assets: any[]): TechConcentration[] {
  const categoryCounts: Record<string, number> = {};
  const categoryValues: Record<string, number> = {};
  
  // Initialize counters
  Object.values(TechnologyCategory).forEach(category => {
    categoryCounts[category] = 0;
    categoryValues[category] = 0;
  });
  
  // Count assets and sum values by category
  assets.forEach(asset => {
    if (asset.category) {
      categoryCounts[asset.category] = (categoryCounts[asset.category] || 0) + 1;
      categoryValues[asset.category] = (categoryValues[asset.category] || 0) + (asset.growthValue || 0);
    }
  });
  
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, asset) => sum + (asset.growthValue || 0), 0);
  
  // Convert to concentration objects and sort by percentage
  const concentrations: TechConcentration[] = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category: category as TechnologyCategory,
      assetCount: count,
      percentage: (count / totalAssets) * 100,
      totalValue: categoryValues[category] || 0,
      valuePercentage: totalValue > 0 ? ((categoryValues[category] || 0) / totalValue) * 100 : 0,
      averageConfidence: calculateAverageConfidence(assets, category as TechnologyCategory)
    }))
    .sort((a, b) => b.percentage - a.percentage);
  
  return concentrations;
}

/**
 * Generate asset revelations - surprising insights about assets
 */
function generateAssetRevelations(assets: any[]): AssetRevelation[] {
  const revelations: AssetRevelation[] = [];
  
  assets.forEach(asset => {
    if (!asset.category || !asset.categoryConfidence) return;
    
    const insight = generateAssetInsight(asset);
    if (insight) {
      revelations.push({
        assetId: asset.id,
        assetName: asset.name,
        insight: insight.text,
        confidence: asset.categoryConfidence,
        category: asset.category as TechnologyCategory,
        surpriseFactor: insight.surpriseFactor,
        actionable: insight.actionable
      });
    }
  });
  
  // Sort by surprise factor and confidence
  return revelations
    .sort((a, b) => (b.surpriseFactor * b.confidence) - (a.surpriseFactor * a.confidence))
    .slice(0, 10); // Top 10 most interesting revelations
}

/**
 * Generate insight for a specific asset
 */
function generateAssetInsight(asset: any): { text: string; surpriseFactor: number; actionable: boolean } | null {
  const category = asset.category as TechnologyCategory;
  const confidence = asset.categoryConfidence;
  
  // High confidence insights
  if (confidence > 0.85) {
    switch (category) {
      case TechnologyCategory.AI_COMPUTE:
        return {
          text: `${asset.name} is ${Math.round(confidence * 100)}% classified as AI/Compute - major AI exposure`,
          surpriseFactor: category === TechnologyCategory.AI_COMPUTE ? 0.6 : 0.9,
          actionable: true
        };
      case TechnologyCategory.ROBOTICS_PHYSICAL_AI:
        return {
          text: `${asset.name} is primarily a robotics/physical AI play (${Math.round(confidence * 100)}% confidence)`,
          surpriseFactor: 0.8,
          actionable: true
        };
      case TechnologyCategory.QUANTUM_COMPUTING:
        return {
          text: `${asset.name} is a pure quantum computing investment - high risk/reward potential`,
          surpriseFactor: 0.95,
          actionable: true
        };
    }
  }
  
  // Medium confidence but surprising categorization
  if (confidence > 0.7 && confidence < 0.85) {
    return {
      text: `${asset.name} classified as ${getCategoryDisplayName(category)} with moderate confidence (${Math.round(confidence * 100)}%)`,
      surpriseFactor: 0.5,
      actionable: false
    };
  }
  
  return null;
}

/**
 * Assess concentration risks
 */
function assessConcentrationRisks(concentrations: TechConcentration[]): ConcentrationRisk[] {
  const risks: ConcentrationRisk[] = [];
  
  concentrations.forEach(concentration => {
    let riskLevel: 'low' | 'medium' | 'high';
    let riskDescription: string;
    
    if (concentration.percentage > 50) {
      riskLevel = 'high';
      riskDescription = `High concentration risk: ${concentration.percentage.toFixed(1)}% of portfolio in ${getCategoryDisplayName(concentration.category)}`;
    } else if (concentration.percentage > 30) {
      riskLevel = 'medium';
      riskDescription = `Medium concentration: ${concentration.percentage.toFixed(1)}% exposure to ${getCategoryDisplayName(concentration.category)}`;
    } else {
      riskLevel = 'low';
      riskDescription = `Balanced exposure: ${concentration.percentage.toFixed(1)}% in ${getCategoryDisplayName(concentration.category)}`;
    }
    
    // Category-specific risk factors
    const categoryRisks = getCategorySpecificRisks(concentration.category);
    
    risks.push({
      category: concentration.category,
      riskLevel,
      percentage: concentration.percentage,
      description: riskDescription,
      specificRisks: categoryRisks,
      mitigation: generateMitigationStrategy(concentration.category, riskLevel)
    });
  });
  
  return risks;
}

/**
 * Generate strategic recommendations
 */
function generateRecommendations(
  concentrations: TechConcentration[], 
  risks: ConcentrationRisk[], 
  totalAssets: number
): string[] {
  const recommendations: string[] = [];
  
  // Portfolio size recommendations
  if (totalAssets < 5) {
    recommendations.push('Consider expanding portfolio size for better diversification');
  }
  
  // Concentration recommendations
  const highRisks = risks.filter(r => r.riskLevel === 'high');
  if (highRisks.length > 0) {
    recommendations.push(`Reduce concentration in ${highRisks.map(r => getCategoryDisplayName(r.category)).join(', ')}`);
  }
  
  // Technology-specific recommendations
  const aiExposure = concentrations.find(c => c.category === TechnologyCategory.AI_COMPUTE);
  if (aiExposure && aiExposure.percentage > 40) {
    recommendations.push('High AI exposure detected - monitor AI regulation developments closely');
  }
  
  const quantumExposure = concentrations.find(c => c.category === TechnologyCategory.QUANTUM_COMPUTING);
  if (quantumExposure && quantumExposure.percentage > 20) {
    recommendations.push('Significant quantum computing exposure - track quantum breakthrough timelines');
  }
  
  // Diversification recommendations
  if (concentrations.length < 3) {
    recommendations.push('Consider diversifying across more technology categories');
  }
  
  return recommendations;
}

// Helper functions and type definitions

interface PortfolioSummary {
  totalAssets: number;
  categorizedAssets: number;
  uncategorizedAssets: number;
  categorizationProgress: number;
  dominantCategory: TechnologyCategory | null;
  technologyExposure: number;
  portfolioRiskScore: number;
}

interface TechConcentration {
  category: TechnologyCategory;
  assetCount: number;
  percentage: number;
  totalValue: number;
  valuePercentage: number;
  averageConfidence: number;
}

interface AssetRevelation {
  assetId: string;
  assetName: string;
  insight: string;
  confidence: number;
  category: TechnologyCategory;
  surpriseFactor: number;
  actionable: boolean;
}

interface ConcentrationRisk {
  category: TechnologyCategory;
  riskLevel: 'low' | 'medium' | 'high';
  percentage: number;
  description: string;
  specificRisks: string[];
  mitigation: string[];
}

function calculateAverageConfidence(assets: any[], category: TechnologyCategory): number {
  const categoryAssets = assets.filter(a => a.category === category && a.categoryConfidence);
  if (categoryAssets.length === 0) return 0;
  
  const totalConfidence = categoryAssets.reduce((sum, asset) => sum + asset.categoryConfidence, 0);
  return totalConfidence / categoryAssets.length;
}

function calculateTotalTechExposure(concentrations: TechConcentration[]): number {
  const emergingTechCategories = [
    TechnologyCategory.AI_COMPUTE,
    TechnologyCategory.ROBOTICS_PHYSICAL_AI,
    TechnologyCategory.QUANTUM_COMPUTING
  ];
  
  return concentrations
    .filter(c => emergingTechCategories.includes(c.category))
    .reduce((sum, c) => sum + c.percentage, 0);
}

function calculatePortfolioRiskScore(risks: ConcentrationRisk[]): number {
  const riskWeights = { low: 1, medium: 2, high: 3 };
  const totalRisk = risks.reduce((sum, risk) => sum + riskWeights[risk.riskLevel] * risk.percentage, 0);
  return Math.min(totalRisk / 100, 10); // Scale to 0-10
}

function getCategoryDisplayName(category: TechnologyCategory): string {
  const displayNames = {
    [TechnologyCategory.AI_COMPUTE]: 'AI/Compute',
    [TechnologyCategory.ROBOTICS_PHYSICAL_AI]: 'Robotics/Physical AI',
    [TechnologyCategory.QUANTUM_COMPUTING]: 'Quantum Computing',
    [TechnologyCategory.BIOTECH_HEALTH]: 'Biotech/Health',
    [TechnologyCategory.FINTECH_CRYPTO]: 'Fintech/Crypto',
    [TechnologyCategory.ENERGY_CLEANTECH]: 'Energy/CleanTech',
    [TechnologyCategory.SPACE_DEFENSE]: 'Space/Defense',
    [TechnologyCategory.TRADITIONAL_TECH]: 'Traditional Tech',
    [TechnologyCategory.OTHER]: 'Other'
  };
  
  return displayNames[category] || category;
}

function getCategorySpecificRisks(category: TechnologyCategory): string[] {
  const categoryRisks = {
    [TechnologyCategory.AI_COMPUTE]: [
      'AI regulation uncertainty',
      'Compute cost volatility',
      'Technology disruption risk'
    ],
    [TechnologyCategory.ROBOTICS_PHYSICAL_AI]: [
      'Regulatory approval delays',
      'Manufacturing automation risk',
      'Safety and liability concerns'
    ],
    [TechnologyCategory.QUANTUM_COMPUTING]: [
      'Technology timeline uncertainty',
      'Commercial viability risk',
      'Competition from established players'
    ],
    [TechnologyCategory.BIOTECH_HEALTH]: [
      'Regulatory approval risk',
      'Clinical trial failures',
      'Patent expiration risk'
    ],
    [TechnologyCategory.FINTECH_CRYPTO]: [
      'Regulatory crackdown risk',
      'Technology obsolescence',
      'Market volatility'
    ],
    [TechnologyCategory.ENERGY_CLEANTECH]: [
      'Policy change risk',
      'Technology cost competition',
      'Grid integration challenges'
    ],
    [TechnologyCategory.SPACE_DEFENSE]: [
      'Government contract dependency',
      'Launch failure risk',
      'Geopolitical tensions'
    ],
    [TechnologyCategory.TRADITIONAL_TECH]: [
      'Technology disruption',
      'Market saturation',
      'Legacy system burden'
    ],
    [TechnologyCategory.OTHER]: [
      'Unclear category risks',
      'Market position uncertainty'
    ]
  };
  
  return categoryRisks[category] || [];
}

function generateMitigationStrategy(category: TechnologyCategory, riskLevel: 'low' | 'medium' | 'high'): string[] {
  const strategies: string[] = [];
  
  if (riskLevel === 'high') {
    strategies.push('Consider reducing position size');
    strategies.push('Implement stop-loss mechanisms');
  }
  
  if (riskLevel === 'medium' || riskLevel === 'high') {
    strategies.push('Monitor category-specific developments closely');
    strategies.push('Diversify within the category');
  }
  
  // Category-specific mitigation
  switch (category) {
    case TechnologyCategory.AI_COMPUTE:
      strategies.push('Track AI regulation developments');
      strategies.push('Monitor compute efficiency breakthroughs');
      break;
    case TechnologyCategory.QUANTUM_COMPUTING:
      strategies.push('Follow quantum milestone timelines');
      strategies.push('Assess commercial readiness regularly');
      break;
  }
  
  return strategies;
} 