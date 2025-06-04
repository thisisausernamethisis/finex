import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { matrixCalculationService } from '../../../../lib/services/matrixCalculationService';
import { CacheService } from '../../../../lib/services/cacheService';
import { logger } from '../../../../lib/logger';

// Create a route-specific logger
const routeLogger = logger.child({ route: 'GET /api/matrix/calculate' });

/**
 * GET /api/matrix/calculate
 * Calculate real-time matrix impacts for user's portfolio with caching
 * 
 * Query Parameters:
 * - mode: 'summary' | 'detailed' (default: 'summary')
 * - forceRefresh: boolean (default: false) - bypass cache
 * 
 * Response:
 * - 200: Matrix calculation results
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    routeLogger.info('Matrix calculation request received');
    
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
    const mode = searchParams.get('mode') || 'summary';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    routeLogger.info('Processing matrix calculation', {
      userId,
      mode,
      forceRefresh
    });
    
    // Generate cache key
    const cacheKey = `matrix:${userId}:${mode}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedResult = await CacheService.get(cacheKey);
      if (cachedResult) {
        const cacheTime = Date.now() - startTime;
        routeLogger.info('Matrix calculation served from cache', { 
          userId, 
          mode, 
          responseTime: cacheTime 
        });
        return NextResponse.json(cachedResult);
      }
    }
    
    // Calculate matrix impacts
    const result = await matrixCalculationService.calculateUserMatrix(userId);
    
    // Format response based on mode
    let formattedResponse;
    
    if (mode === 'summary') {
      formattedResponse = {
        success: true,
        data: {
          portfolioMetrics: result.portfolioAggregation,
          topOpportunities: result.calculations
            .filter(calc => calc.finalImpact > 2)
            .sort((a, b) => b.finalImpact - a.finalImpact)
            .slice(0, 5)
            .map(calc => ({
              assetName: calc.assetName,
              scenarioName: calc.scenarioName,
              impact: calc.finalImpact,
              explanation: calc.explanation
            })),
          topRisks: result.calculations
            .filter(calc => calc.finalImpact < -1)
            .sort((a, b) => a.finalImpact - b.finalImpact)
            .slice(0, 5)
            .map(calc => ({
              assetName: calc.assetName,
              scenarioName: calc.scenarioName,
              impact: calc.finalImpact,
              explanation: calc.explanation
            })),
          metadata: {
            lastCalculatedAt: result.lastCalculatedAt,
            calculationVersion: result.calculationVersion,
            totalCalculations: result.calculations.length,
            cached: false,
            responseTime: Date.now() - startTime
          }
        }
      };
    } else {
      // Detailed response
      formattedResponse = {
        success: true,
        data: {
          portfolioMetrics: result.portfolioAggregation,
          calculations: result.calculations.map(calc => ({
            assetId: calc.assetId,
            assetName: calc.assetName,
            assetCategory: calc.assetCategory,
            scenarioId: calc.scenarioId,
            scenarioName: calc.scenarioName,
            scenarioType: calc.scenarioType,
            impact: calc.finalImpact,
            breakdown: {
              baseImpact: calc.baseImpact,
              technologyMultiplier: calc.technologyMultiplier,
              timelineAdjustment: calc.timelineAdjustment,
              confidenceScore: calc.confidenceScore
            },
            explanation: calc.explanation
          })),
          categoryBreakdown: Object.entries(result.portfolioAggregation.categoryExposure).map(([category, count]) => ({
            category,
            assetCount: count,
            averageImpact: result.calculations
              .filter(calc => calc.assetCategory === category)
              .reduce((sum, calc) => sum + calc.finalImpact, 0) / 
              Math.max(result.calculations.filter(calc => calc.assetCategory === category).length, 1)
          })),
          metadata: {
            lastCalculatedAt: result.lastCalculatedAt,
            calculationVersion: result.calculationVersion,
            totalCalculations: result.calculations.length,
            userId: result.userId,
            cached: false,
            responseTime: Date.now() - startTime
          }
        }
      };
    }
    
    // Cache the result
    await CacheService.set(cacheKey, formattedResponse, 300); // Cache for 5 minutes
    
    const totalTime = Date.now() - startTime;
    routeLogger.info('Matrix calculation completed', {
      userId,
      mode,
      averageImpact: result.portfolioAggregation.averageImpact,
      totalCalculations: result.calculations.length,
      responseTime: totalTime
    });
    
    return NextResponse.json(formattedResponse);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const totalTime = Date.now() - startTime;
    
    routeLogger.error('Matrix calculation failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: totalTime
    });
    
    // Determine if this is a user error or system error
    if (errorMessage.includes('No categorized assets found') || 
        errorMessage.includes('No scenarios found')) {
      return NextResponse.json(
        { 
          error: 'Insufficient data for matrix calculation',
          details: errorMessage 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 