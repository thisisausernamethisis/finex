import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { portfolioAnalysisService } from '../../../../lib/services/portfolioAnalysisService';
import { createChildLogger } from '../../../../lib/logger';
import { serverError, unauthorized } from '../../../../lib/utils/http';

// Create a route-specific logger
const logger = createChildLogger({ route: 'GET /api/matrix/insights' });

/**
 * GET /api/matrix/insights
 * 
 * Analyzes user's portfolio for technology exposure, concentration risks, 
 * and generates AI-powered insights about portfolio composition.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const includeDetailedInsights = searchParams.get('detailed') === 'true';
    
    logger.info('Processing portfolio insights request', {
      userId: user.id,
      forceRefresh,
      includeDetailedInsights
    });
    
    // TODO: Add caching logic here if forceRefresh is false
    // For now, always perform fresh analysis
    
    // Analyze the user's portfolio
    const analysis = await portfolioAnalysisService.analyzeUserPortfolio(user.id);
    
    // Format response based on detail level
    const response = includeDetailedInsights 
      ? formatDetailedResponse(analysis)
      : formatSummaryResponse(analysis);
    
    logger.info('Portfolio insights generated successfully', {
      userId: user.id,
      totalAssets: analysis.totalAssets,
      categorizedAssets: analysis.categorizedAssets,
      exposureCategories: analysis.technologyExposure.length,
      insights: analysis.insights.length,
      risks: analysis.concentrationRisks.length
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

/**
 * Format detailed response with all analysis data
 */
function formatDetailedResponse(analysis: any) {
  return {
    summary: {
      totalAssets: analysis.totalAssets,
      categorizedAssets: analysis.categorizedAssets,
      categorizationProgress: Math.round((analysis.categorizedAssets / analysis.totalAssets) * 100),
      lastAnalyzedAt: analysis.lastAnalyzedAt,
      analysisVersion: analysis.analysisVersion
    },
    technologyExposure: analysis.technologyExposure.map((exposure: any) => ({
      category: exposure.category,
      categoryName: formatCategoryDisplay(exposure.category),
      percentage: exposure.percentage,
      assetCount: exposure.assetCount,
      averageConfidence: exposure.averageConfidence,
      assets: exposure.assets,
      impact: exposure.percentage > 50 ? 'HIGH' : exposure.percentage > 25 ? 'MEDIUM' : 'LOW'
    })),
    concentrationRisks: analysis.concentrationRisks.map((risk: any) => ({
      ...risk,
      affectedCategoriesDisplay: risk.affectedCategories.map((cat: string) => formatCategoryDisplay(cat))
    })),
    insights: analysis.insights.map((insight: any) => ({
      ...insight,
      category: categorizeInsight(insight),
      actionable: isActionableInsight(insight)
    })),
    recommendations: generateActionableRecommendations(analysis),
    portfolioHealth: calculatePortfolioHealthScore(analysis)
  };
}

/**
 * Format summary response with key insights only
 */
function formatSummaryResponse(analysis: any) {
  const topExposures = analysis.technologyExposure.slice(0, 3);
  const highPriorityInsights = analysis.insights
    .filter((insight: any) => insight.impact === 'HIGH' || insight.impact === 'MEDIUM')
    .slice(0, 5);
  
  return {
    summary: {
      totalAssets: analysis.totalAssets,
      categorizedAssets: analysis.categorizedAssets,
      topExposures: topExposures.map((exp: any) => ({
        category: formatCategoryDisplay(exp.category),
        percentage: exp.percentage,
        assetCount: exp.assetCount
      })),
      riskLevel: determineOverallRiskLevel(analysis.concentrationRisks),
      lastAnalyzedAt: analysis.lastAnalyzedAt
    },
    keyInsights: highPriorityInsights.map((insight: any) => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      confidence: insight.confidence
    })),
    quickStats: {
      portfolioHealth: calculatePortfolioHealthScore(analysis),
      diversificationScore: calculateDiversificationScore(analysis.technologyExposure),
      riskScore: calculateRiskScore(analysis.concentrationRisks)
    }
  };
}

/**
 * Format category names for display
 */
function formatCategoryDisplay(category: string): string {
  const formatMap: Record<string, string> = {
    'AI_COMPUTE': 'AI & Compute',
    'ROBOTICS_PHYSICAL_AI': 'Robotics & Physical AI',
    'QUANTUM_COMPUTING': 'Quantum Computing',
    'BIOTECH_HEALTH': 'Biotech & Health',
    'FINTECH_CRYPTO': 'Fintech & Crypto',
    'ENERGY_CLEANTECH': 'Energy & Cleantech',
    'SPACE_DEFENSE': 'Space & Defense',
    'TRADITIONAL_TECH': 'Traditional Tech',
    'OTHER': 'Other'
  };
  
  return formatMap[category] || category;
}

/**
 * Categorize insights for better organization
 */
function categorizeInsight(insight: any): string {
  if (insight.type === 'EXPOSURE') return 'portfolio_composition';
  if (insight.type === 'RISK') return 'risk_management';
  if (insight.type === 'OPPORTUNITY') return 'growth_opportunities';
  if (insight.type === 'RECOMMENDATION') return 'action_items';
  return 'general';
}

/**
 * Determine if an insight is actionable
 */
function isActionableInsight(insight: any): boolean {
  return insight.type === 'RECOMMENDATION' || 
         insight.type === 'OPPORTUNITY' ||
         (insight.type === 'RISK' && insight.metadata?.assetId);
}

/**
 * Generate actionable recommendations based on analysis
 */
function generateActionableRecommendations(analysis: any): Array<{
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  description: string;
  reasoning: string;
}> {
  const recommendations = [];
  
  // High concentration recommendations
  const highConcentrationRisk = analysis.concentrationRisks.find(
    (risk: any) => risk.type === 'HIGH_CONCENTRATION'
  );
  
  if (highConcentrationRisk) {
    recommendations.push({
      id: 'reduce-concentration',
      priority: 'HIGH' as const,
      action: 'Reduce concentration risk',
      description: highConcentrationRisk.recommendation,
      reasoning: `High concentration (${highConcentrationRisk.description}) increases portfolio volatility`
    });
  }
  
  // Categorization recommendations
  const uncategorizedCount = analysis.totalAssets - analysis.categorizedAssets;
  if (uncategorizedCount > 0) {
    recommendations.push({
      id: 'complete-categorization',
      priority: uncategorizedCount > 3 ? 'HIGH' as const : 'MEDIUM' as const,
      action: 'Categorize remaining assets',
      description: `Complete technology categorization for ${uncategorizedCount} assets`,
      reasoning: 'Uncategorized assets limit portfolio analysis accuracy'
    });
  }
  
  // Diversification recommendations
  if (analysis.technologyExposure.length < 3) {
    recommendations.push({
      id: 'improve-diversification',
      priority: 'MEDIUM' as const,
      action: 'Improve diversification',
      description: 'Consider adding assets from different technology categories',
      reasoning: 'Limited diversification increases risk and reduces growth opportunities'
    });
  }
  
  return recommendations;
}

/**
 * Calculate overall portfolio health score (0-100)
 */
function calculatePortfolioHealthScore(analysis: any): number {
  let score = 100;
  
  // Deduct for concentration risks
  analysis.concentrationRisks.forEach((risk: any) => {
    if (risk.severity === 'HIGH') score -= 20;
    else if (risk.severity === 'MEDIUM') score -= 10;
    else score -= 5;
  });
  
  // Deduct for low categorization
  const categorizationRate = analysis.categorizedAssets / analysis.totalAssets;
  if (categorizationRate < 0.8) score -= (1 - categorizationRate) * 30;
  
  // Deduct for low diversification
  if (analysis.technologyExposure.length < 3) score -= 15;
  
  return Math.max(0, Math.round(score));
}

/**
 * Calculate diversification score (0-100)
 */
function calculateDiversificationScore(exposures: any[]): number {
  if (exposures.length === 0) return 0;
  
  // Base score on number of categories
  let score = Math.min(exposures.length * 15, 75);
  
  // Bonus for balanced exposure (no single category >50%)
  const maxExposure = Math.max(...exposures.map(exp => exp.percentage));
  if (maxExposure < 50) score += 15;
  else if (maxExposure < 60) score += 10;
  
  // Bonus for good coverage (>5 categories)
  if (exposures.length >= 5) score += 10;
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate risk score (0-100, higher = more risk)
 */
function calculateRiskScore(risks: any[]): number {
  let score = 0;
  
  risks.forEach((risk: any) => {
    if (risk.severity === 'HIGH') score += 30;
    else if (risk.severity === 'MEDIUM') score += 20;
    else score += 10;
  });
  
  return Math.min(100, score);
}

/**
 * Determine overall risk level
 */
function determineOverallRiskLevel(risks: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  const highRisks = risks.filter((risk: any) => risk.severity === 'HIGH').length;
  const mediumRisks = risks.filter((risk: any) => risk.severity === 'MEDIUM').length;
  
  if (highRisks > 0) return 'HIGH';
  if (mediumRisks > 1) return 'HIGH';
  if (mediumRisks > 0 || risks.length > 2) return 'MEDIUM';
  return 'LOW';
} 