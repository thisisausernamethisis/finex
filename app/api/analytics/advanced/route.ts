import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PredictiveAnalyticsService } from '../../../../lib/services/predictiveAnalyticsService';
import { CacheService } from '../../../../lib/services/cacheService';
import { logger } from '../../../../lib/logger';

// Create a route-specific logger
const routeLogger = logger.child({ route: 'GET /api/analytics/advanced' });

/**
 * GET /api/analytics/advanced
 * Advanced predictive analytics and AI-powered recommendations
 * 
 * Query Parameters:
 * - includeRisk: boolean (default: true) - include risk metrics
 * - includeTrends: boolean (default: true) - include trend analysis
 * - includeRecommendations: boolean (default: true) - include AI recommendations
 * - forceRefresh: boolean (default: false) - bypass cache
 * 
 * Response:
 * - 200: Advanced analytics results
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    routeLogger.info('Advanced analytics request received');
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      routeLogger.warn('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeRisk = searchParams.get('includeRisk') !== 'false';
    const includeTrends = searchParams.get('includeTrends') !== 'false';
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    routeLogger.info('Processing advanced analytics', {
      userId,
      includeRisk,
      includeTrends,
      includeRecommendations,
      forceRefresh
    });
    
    // Generate cache key
    const cacheKey = `analytics:advanced:${userId}:${includeRisk}:${includeTrends}:${includeRecommendations}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedResult = await CacheService.get(cacheKey);
      if (cachedResult) {
        const cacheTime = Date.now() - startTime;
        routeLogger.info('Advanced analytics served from cache', { 
          userId, 
          responseTime: cacheTime 
        });
        return NextResponse.json(cachedResult);
      }
    }
    
    // Get user's portfolio data (mock for now - in production would fetch from database)
    const portfolioData = await getUserPortfolioData(userId);
    
    if (portfolioData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No portfolio data found',
        message: 'Please add assets to your portfolio to receive advanced analytics'
      }, { status: 400 });
    }
    
    // Calculate comprehensive analytics
    const analytics = await PredictiveAnalyticsService.calculatePortfolioAnalytics(portfolioData);
    
    // Format response based on requested components
    const response = {
      success: true,
      data: {
        ...(includeRisk && { riskMetrics: analytics.riskMetrics }),
        ...(includeTrends && { trendAnalyses: analytics.trendAnalyses }),
        ...(includeRecommendations && { recommendations: analytics.recommendations }),
        performanceMetrics: {
          ...analytics.performanceMetrics,
          cached: false,
          responseTime: Date.now() - startTime
        },
        metadata: {
          userId,
          portfolioSize: portfolioData.length,
          categoriesAnalyzed: Object.keys(analytics.trendAnalyses).length,
          lastUpdated: new Date(),
          analysisVersion: '2.0'
        }
      }
    };
    
    // Cache the result for 5 minutes
    await CacheService.set(cacheKey, response, 300);
    
    const totalTime = Date.now() - startTime;
    routeLogger.info('Advanced analytics completed', {
      userId,
      portfolioSize: portfolioData.length,
      categoriesAnalyzed: Object.keys(analytics.trendAnalyses).length,
      recommendationsGenerated: analytics.recommendations.rebalancingSuggestions.length,
      responseTime: totalTime
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const totalTime = Date.now() - startTime;
    
    routeLogger.error('Advanced analytics failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: totalTime
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Mock function to get user portfolio data
 * In production, this would fetch from database
 */
async function getUserPortfolioData(userId: string): Promise<any[]> {
  // Mock portfolio data with various technology categories
  const mockPortfolio = [
    { id: '1', name: 'NVIDIA', category: 'AI_COMPUTE', allocation: 25 },
    { id: '2', name: 'Tesla', category: 'ROBOTICS_PHYSICAL_AI', allocation: 20 },
    { id: '3', name: 'Microsoft', category: 'AI_COMPUTE', allocation: 15 },
    { id: '4', name: 'Alphabet', category: 'AI_COMPUTE', allocation: 10 },
    { id: '5', name: 'IonQ', category: 'QUANTUM_COMPUTING', allocation: 8 },
    { id: '6', name: 'Boston Dynamics', category: 'ROBOTICS_PHYSICAL_AI', allocation: 7 },
    { id: '7', name: 'Regeneron', category: 'BIOTECH_LONGEVITY', allocation: 6 },
    { id: '8', name: 'Tesla Energy', category: 'ENERGY_STORAGE', allocation: 5 },
    { id: '9', name: 'Apple', category: 'TRADITIONAL', allocation: 4 }
  ];
  
  return mockPortfolio;
}

/**
 * POST /api/analytics/advanced
 * Request custom analytics analysis with specific parameters
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    routeLogger.info('Custom analytics request received');
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      routeLogger.warn('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const {
      portfolioAssets = [],
      analysisType = 'comprehensive',
      timeframe = '6M',
      riskTolerance = 'moderate'
    } = body;
    
    routeLogger.info('Processing custom analytics', {
      userId,
      analysisType,
      timeframe,
      riskTolerance,
      assetsCount: portfolioAssets.length
    });
    
    // Validate input
    if (portfolioAssets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No assets provided',
        message: 'Please provide portfolio assets for analysis'
      }, { status: 400 });
    }
    
    // Calculate custom analytics
    const analytics = await PredictiveAnalyticsService.calculatePortfolioAnalytics(portfolioAssets);
    
    // Apply custom filters based on analysis type
    let filteredAnalytics = analytics;
    
    if (analysisType === 'risk-focused') {
      filteredAnalytics = {
        ...analytics,
        recommendations: {
          ...analytics.recommendations,
          rebalancingSuggestions: analytics.recommendations.rebalancingSuggestions
            .filter(suggestion => suggestion.priority === 'HIGH'),
          riskMitigation: analytics.recommendations.riskMitigation
        }
      };
    } else if (analysisType === 'growth-focused') {
      filteredAnalytics = {
        ...analytics,
        recommendations: {
          ...analytics.recommendations,
          opportunityAlerts: analytics.recommendations.opportunityAlerts
            .filter(alert => alert.potential === 'HIGH'),
          rebalancingSuggestions: analytics.recommendations.rebalancingSuggestions
            .filter(suggestion => suggestion.action === 'INCREASE')
        }
      };
    }
    
    const response = {
      success: true,
      data: {
        ...filteredAnalytics,
        customParameters: {
          analysisType,
          timeframe,
          riskTolerance
        },
        metadata: {
          userId,
          portfolioSize: portfolioAssets.length,
          analysisVersion: '2.0-custom',
          lastUpdated: new Date(),
          responseTime: Date.now() - startTime
        }
      }
    };
    
    const totalTime = Date.now() - startTime;
    routeLogger.info('Custom analytics completed', {
      userId,
      analysisType,
      portfolioSize: portfolioAssets.length,
      responseTime: totalTime
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const totalTime = Date.now() - startTime;
    
    routeLogger.error('Custom analytics failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: totalTime
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
} 