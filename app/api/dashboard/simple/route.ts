import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { ScenarioRepository } from '../../../../lib/repositories/scenarioRepository';
import { createChildLogger } from '../../../../lib/logger';
import { serverError, unauthorized } from '../../../../lib/utils/http';

// Define enums locally
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

enum ScenarioType {
  TECHNOLOGY = 'TECHNOLOGY',
  ECONOMIC = 'ECONOMIC',
  GEOPOLITICAL = 'GEOPOLITICAL',
  REGULATORY = 'REGULATORY',
  MARKET = 'MARKET'
}

// Create a route-specific logger
const logger = createChildLogger({ route: 'GET /api/dashboard/simple' });

// Create repository instances
const assetRepository = new AssetRepository();
const scenarioRepository = new ScenarioRepository();

/**
 * GET /api/dashboard/simple
 * 
 * Returns a simplified dashboard view with:
 * - Portfolio technology breakdown
 * - Key insights and revelations
 * - Top scenarios by relevance
 * - Quick actions and recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Get all user data in parallel
    const [
      { items: assets },
      { items: scenarios }
    ] = await Promise.all([
      assetRepository.listAssets(user.id, 1, 1000),
      scenarioRepository.listScenarios(user.id, 1, 100)
    ]);
    
    // Generate simplified dashboard data
    const dashboardData = await generateSimpleDashboardData(assets, scenarios);
    
    logger.info('Generated simple dashboard data', {
      userId: user.id,
      totalAssets: assets.length,
      totalScenarios: scenarios.length,
      categorizationProgress: dashboardData.overview.categorizationProgress
    });
    
    return NextResponse.json(dashboardData);
    
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

/**
 * Generate simplified dashboard data optimized for quick insights
 */
async function generateSimpleDashboardData(
  assets: any[], 
  scenarios: any[]
): Promise<SimpleDashboardData> {
  // Portfolio overview with key metrics
  const overview = generatePortfolioOverview(assets);
  
  // Technology breakdown
  const techBreakdown = generateTechnologyBreakdown(assets);
  
  // Key insights and revelations
  const insights = generateKeyInsights(assets, techBreakdown);
  
  // Top technology scenarios
  const topScenarios = getTopTechnologyScenarios(scenarios);
  
  // Quick actions based on current state
  const quickActions = generateQuickActions(assets, techBreakdown, insights);
  
  // Performance metrics for monitoring
  const performance = calculatePerformanceMetrics(assets, techBreakdown);
  
  return {
    overview,
    techBreakdown,
    insights,
    topScenarios,
    quickActions,
    performance,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Generate high-level portfolio overview
 */
function generatePortfolioOverview(assets: any[]): PortfolioOverview {
  const categorized = assets.filter(asset => asset.category);
  const totalValue = assets.reduce((sum, asset) => sum + (asset.growthValue || 0), 0);
  
  return {
    totalAssets: assets.length,
    categorizedAssets: categorized.length,
    uncategorizedAssets: assets.length - categorized.length,
    categorizationProgress: categorized.length / assets.length,
    totalPortfolioValue: totalValue,
    emergingTechExposure: calculateEmergingTechExposure(categorized),
    riskScore: calculateSimpleRiskScore(categorized)
  };
}

/**
 * Generate technology category breakdown
 */
function generateTechnologyBreakdown(assets: any[]): TechBreakdownItem[] {
  const categorized = assets.filter(asset => asset.category);
  const categoryCounts: Record<string, TechBreakdownItem> = {};
  
  // Initialize breakdown items
  Object.values(TechnologyCategory).forEach(category => {
    categoryCounts[category] = {
      category: category as TechnologyCategory,
      count: 0,
      percentage: 0,
      totalValue: 0,
      valuePercentage: 0,
      averageConfidence: 0,
      assets: [],
      riskLevel: 'low'
    };
  });
  
  // Populate data
  const totalValue = categorized.reduce((sum, asset) => sum + (asset.growthValue || 0), 0);
  
  categorized.forEach(asset => {
    const category = asset.category;
    const item = categoryCounts[category];
    
    item.count++;
    item.totalValue += asset.growthValue || 0;
    item.assets.push({
      id: asset.id,
      name: asset.name,
      value: asset.growthValue || 0,
      confidence: asset.categoryConfidence || 0
    });
  });
  
  // Calculate percentages and averages
  Object.values(categoryCounts).forEach(item => {
    if (item.count > 0) {
      item.percentage = (item.count / categorized.length) * 100;
      item.valuePercentage = totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0;
      item.averageConfidence = item.assets.reduce((sum, a) => sum + a.confidence, 0) / item.count;
      item.riskLevel = item.percentage > 50 ? 'high' : item.percentage > 30 ? 'medium' : 'low';
    }
  });
  
  // Return only categories with assets, sorted by value percentage
  return Object.values(categoryCounts)
    .filter(item => item.count > 0)
    .sort((a, b) => b.valuePercentage - a.valuePercentage);
}

/**
 * Generate key insights and revelations with matrix analysis opportunities
 */
function generateKeyInsights(assets: any[], techBreakdown: TechBreakdownItem[]): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  
  // Matrix analysis readiness insight
  const categorizedAssets = assets.filter(asset => asset.category);
  if (categorizedAssets.length >= 3 && techBreakdown.length >= 2) {
    insights.push({
      type: 'opportunity',
      title: 'Ready for AI Matrix Analysis',
      message: `Portfolio has ${categorizedAssets.length} categorized assets across ${techBreakdown.length} technology categories - perfect for comprehensive impact analysis`,
      severity: 'info',
      actionable: true
    });
  }
  
  // Portfolio composition insights
  if (techBreakdown.length > 0) {
    const dominant = techBreakdown[0];
    if (dominant.percentage > 40) {
      insights.push({
        type: 'concentration',
        title: 'High Technology Concentration',
        message: `${dominant.percentage.toFixed(1)}% of portfolio concentrated in ${getCategoryDisplayName(dominant.category)}`,
        severity: dominant.percentage > 60 ? 'high' : 'medium',
        actionable: true,
        category: dominant.category
      });
    }
  }
  
  // Cross-category analysis opportunities
  if (techBreakdown.length >= 3) {
    const topCategories = techBreakdown.slice(0, 3);
    insights.push({
      type: 'opportunity',
      title: 'Cross-Technology Analysis Available',
      message: `Analyze interactions between ${topCategories.map(t => getCategoryDisplayName(t.category)).join(', ')} using scenario modeling`,
      severity: 'info',
      actionable: true
    });
  }
  
  // Emerging technology exposure
  const emergingTechRatio = calculateEmergingTechExposure(categorizedAssets);
  if (emergingTechRatio > 0.6) {
    insights.push({
      type: 'exposure',
      title: 'High Emerging Technology Exposure', 
      message: `${(emergingTechRatio * 100).toFixed(1)}% exposure to emerging technologies like AI, Quantum, and Robotics`,
      severity: 'medium',
      actionable: true
    });
  } else if (emergingTechRatio < 0.2) {
    insights.push({
      type: 'opportunity',
      title: 'Low Emerging Technology Exposure',
      message: `Only ${(emergingTechRatio * 100).toFixed(1)}% exposure to high-growth emerging technologies`,
      severity: 'low',
      actionable: true
    });
  }
  
  // Low categorization warning
  const categorizationRate = categorizedAssets.length / assets.length;
  if (categorizationRate < 0.5 && assets.length > 2) {
    insights.push({
      type: 'confirmation',
      title: 'Complete Asset Categorization',
      message: `${((1 - categorizationRate) * 100).toFixed(1)}% of assets need categorization for optimal analysis`,
      severity: 'medium',
      actionable: true
    });
  }
  
  return insights.slice(0, 5); // Limit to top 5 insights
}

/**
 * Get top technology scenarios relevant to portfolio
 */
function getTopTechnologyScenarios(scenarios: any[]): SimplifiedScenario[] {
  const techScenarios = scenarios.filter(s => s.type === ScenarioType.TECHNOLOGY);
  
  return techScenarios
    .map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      probability: scenario.probability || 0.5,
      timeline: scenario.timeline || 'Unknown',
      impact: calculateScenarioImpact(scenario),
      relevance: 'high' as const
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3); // Top 3 scenarios
}

/**
 * Generate quick actions based on current state
 */
function generateQuickActions(
  assets: any[], 
  techBreakdown: TechBreakdownItem[], 
  insights: DashboardInsight[]
): QuickAction[] {
  const actions: QuickAction[] = [];
  
  // Matrix analysis opportunities
  const categorizedAssets = assets.filter(asset => asset.category);
  if (categorizedAssets.length >= 2) {
    actions.push({
      id: 'run-matrix-analysis',
      title: 'Run AI Matrix Analysis',
      description: `Analyze impact scenarios across your ${categorizedAssets.length} categorized assets using AI-powered insights`,
      type: 'analysis',
      priority: 'high',
      estimatedTime: '30 seconds',
      endpoint: '/api/matrix/analyze'
    });
  }
  
  // Existing categorization action
  const uncategorized = assets.filter(asset => !asset.category);
  if (uncategorized.length > 0) {
    actions.push({
      id: 'categorize-assets',
      title: 'Categorize Remaining Assets',
      description: `${uncategorized.length} assets need technology categorization for better analysis`,
      type: 'categorization',
      priority: uncategorized.length > 5 ? 'high' : 'medium',
      estimatedTime: `${Math.ceil(uncategorized.length * 0.5)} minutes`,
      endpoint: '/api/assets/categorize'
    });
  }
  
  // Risk management actions based on concentration
  const highConcentration = techBreakdown.find(item => item.percentage > 50);
  if (highConcentration) {
    actions.push({
      id: 'analyze-concentration-risk',
      title: 'Analyze Concentration Risk',
      description: `High exposure to ${getCategoryDisplayName(highConcentration.category)} - review risk scenarios`,
      type: 'risk-management',
      priority: 'high',
      estimatedTime: '5 minutes',
      endpoint: '/api/scenarios/technology'
    });
  }
  
  // Diversification opportunities
  const underrepresentedCategories = getUnderrepresentedCategories(techBreakdown);
  if (underrepresentedCategories.length > 0) {
    actions.push({
      id: 'explore-diversification',
      title: 'Explore Diversification',
      description: `Consider exposure to ${underrepresentedCategories.slice(0, 2).join(', ')} technologies`,
      type: 'analysis',
      priority: 'medium',
      estimatedTime: '10 minutes'
    });
  }
  
  // Sort by priority and return top 4
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return actions
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 4);
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(assets: any[], techBreakdown: TechBreakdownItem[]): PerformanceMetrics {
  const categorized = assets.filter(a => a.category);
  
  return {
    categorizationRate: categorized.length / assets.length,
    averageConfidence: categorized.length > 0 
      ? categorized.reduce((sum, a) => sum + (a.categoryConfidence || 0), 0) / categorized.length 
      : 0,
    diversificationScore: calculateDiversificationScore(techBreakdown),
    emergingTechRatio: calculateEmergingTechExposure(categorized) / 100,
    lastAnalysisDate: new Date().toISOString()
  };
}

// Helper functions

function calculateEmergingTechExposure(categorizedAssets: any[]): number {
  if (categorizedAssets.length === 0) return 0;
  
  const emergingTechCategories = [
    TechnologyCategory.AI_COMPUTE,
    TechnologyCategory.ROBOTICS_PHYSICAL_AI,
    TechnologyCategory.QUANTUM_COMPUTING
  ];
  
  const emergingTechAssets = categorizedAssets.filter(asset => 
    emergingTechCategories.includes(asset.category)
  );
  
  return (emergingTechAssets.length / categorizedAssets.length) * 100;
}

function calculateSimpleRiskScore(categorizedAssets: any[]): number {
  if (categorizedAssets.length === 0) return 0;
  
  // Simple risk calculation based on concentration
  const categoryDistribution: Record<string, number> = {};
  
  categorizedAssets.forEach(asset => {
    categoryDistribution[asset.category] = (categoryDistribution[asset.category] || 0) + 1;
  });
  
  const concentrations = Object.values(categoryDistribution)
    .map(count => count / categorizedAssets.length);
  
  // Higher concentration = higher risk
  const maxConcentration = Math.max(...concentrations);
  return Math.min(maxConcentration * 10, 10); // Scale to 0-10
}

function calculateScenarioImpact(scenario: any): 'low' | 'medium' | 'high' {
  const text = `${scenario.name} ${scenario.description || ''}`.toLowerCase();
  
  if (text.includes('breakthrough') || text.includes('revolutionary')) {
    return 'high';
  } else if (text.includes('advancement') || text.includes('adoption')) {
    return 'medium';
  }
  
  return 'low';
}

function calculateDiversificationScore(techBreakdown: TechBreakdownItem[]): number {
  if (techBreakdown.length === 0) return 0;
  
  // Shannon diversity index adapted for portfolio
  const total = techBreakdown.reduce((sum, item) => sum + item.count, 0);
  
  let diversity = 0;
  techBreakdown.forEach(item => {
    if (item.count > 0) {
      const p = item.count / total;
      diversity -= p * Math.log2(p);
    }
  });
  
  // Normalize to 0-1 scale
  const maxDiversity = Math.log2(techBreakdown.length);
  return maxDiversity > 0 ? diversity / maxDiversity : 0;
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

/**
 * Get underrepresented technology categories
 */
function getUnderrepresentedCategories(techBreakdown: TechBreakdownItem[]): string[] {
  const represented = new Set(techBreakdown.map(item => item.category));
  const emerging = [
    TechnologyCategory.AI_COMPUTE,
    TechnologyCategory.QUANTUM_COMPUTING,
    TechnologyCategory.ROBOTICS_PHYSICAL_AI,
    TechnologyCategory.BIOTECH_HEALTH
  ];
  
  return emerging
    .filter(category => !represented.has(category))
    .map(category => getCategoryDisplayName(category));
}

// Type definitions

interface SimpleDashboardData {
  overview: PortfolioOverview;
  techBreakdown: TechBreakdownItem[];
  insights: DashboardInsight[];
  topScenarios: SimplifiedScenario[];
  quickActions: QuickAction[];
  performance: PerformanceMetrics;
  lastUpdated: string;
}

interface PortfolioOverview {
  totalAssets: number;
  categorizedAssets: number;
  uncategorizedAssets: number;
  categorizationProgress: number;
  totalPortfolioValue: number;
  emergingTechExposure: number;
  riskScore: number;
}

interface TechBreakdownItem {
  category: TechnologyCategory;
  count: number;
  percentage: number;
  totalValue: number;
  valuePercentage: number;
  averageConfidence: number;
  assets: Array<{
    id: string;
    name: string;
    value: number;
    confidence: number;
  }>;
  riskLevel: 'low' | 'medium' | 'high';
}

interface DashboardInsight {
  type: 'concentration' | 'exposure' | 'opportunity' | 'confirmation';
  title: string;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  actionable: boolean;
  category?: TechnologyCategory;
}

interface SimplifiedScenario {
  id: string;
  name: string;
  probability: number;
  timeline: string;
  impact: 'low' | 'medium' | 'high';
  relevance: 'low' | 'medium' | 'high';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  type: 'categorization' | 'analysis' | 'risk-management';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  endpoint?: string;
}

interface PerformanceMetrics {
  categorizationRate: number;
  averageConfidence: number;
  diversificationScore: number;
  emergingTechRatio: number;
  lastAnalysisDate: string;
} 