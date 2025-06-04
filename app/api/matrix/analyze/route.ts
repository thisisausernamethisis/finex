import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { matrixAnalysisService, MatrixAnalysisOptions } from '@/lib/services/matrixAnalysisService';
import { logger } from '@/lib/logger';

// Request validation schema
const matrixAnalysisSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  scenarioId: z.string().min(1, 'Scenario ID is required'),
  options: z.object({
    focusQuery: z.string().optional(),
    includeGlobalContext: z.boolean().default(true),
    contextTokenLimit: z.number().min(1000).max(10000).default(4000),
    confidenceThreshold: z.number().min(0).max(1).default(0.6),
    prioritizeRecency: z.boolean().default(false)
  }).optional()
});

const batchAnalysisSchema = z.object({
  pairs: z.array(z.object({
    assetId: z.string().min(1),
    scenarioId: z.string().min(1)
  })).min(1).max(20), // Limit batch size
  options: z.object({
    focusQuery: z.string().optional(),
    includeGlobalContext: z.boolean().default(true),
    contextTokenLimit: z.number().min(1000).max(10000).default(4000),
    confidenceThreshold: z.number().min(0).max(1).default(0.6),
    prioritizeRecency: z.boolean().default(false),
    parallelLimit: z.number().min(1).max(5).default(3)
  }).optional()
});

/**
 * POST /api/matrix/analyze
 * Perform AI-powered matrix analysis for asset-scenario pairs
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const apiLogger = logger.child({ 
    endpoint: 'POST /api/matrix/analyze',
    requestId 
  });

  try {
    const body = await request.json();
    apiLogger.info('Matrix analysis request received', { 
      bodyKeys: Object.keys(body),
      isBatch: Array.isArray(body.pairs)
    });

    // Check if this is a batch analysis request
    if (body.pairs && Array.isArray(body.pairs)) {
      return handleBatchAnalysis(body, apiLogger);
    } else {
      return handleSingleAnalysis(body, apiLogger);
    }
  } catch (error) {
    apiLogger.error('Matrix analysis request failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Matrix analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'ANALYSIS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single matrix analysis
 */
async function handleSingleAnalysis(body: any, apiLogger: any) {
  // Validate request
  const validatedData = matrixAnalysisSchema.parse(body);
  const { assetId, scenarioId, options } = validatedData;

  apiLogger.info('Performing single matrix analysis', {
    assetId,
    scenarioId,
    options
  });

  // Check for cached result first
  const cachedResult = await matrixAnalysisService.getCachedAnalysis(
    assetId,
    scenarioId,
    24 * 60 * 60 * 1000 // 24 hours
  );

  if (cachedResult) {
    apiLogger.info('Returning cached matrix analysis result', {
      analysisId: cachedResult.analysisId,
      cacheAge: Date.now() - new Date(cachedResult.generatedAt).getTime()
    });

    return NextResponse.json({
      success: true,
      data: cachedResult,
      cached: true,
      processingTime: 0
    });
  }

  // Perform new analysis
  const startTime = Date.now();
  const result = await matrixAnalysisService.performMatrixAnalysis(
    assetId,
    scenarioId,
    options as MatrixAnalysisOptions
  );

  const totalProcessingTime = Date.now() - startTime;

  apiLogger.info('Matrix analysis completed successfully', {
    analysisId: result.analysisId,
    impactScore: result.impactScore,
    confidenceLevel: result.confidenceLevel,
    processingTime: totalProcessingTime
  });

  return NextResponse.json({
    success: true,
    data: result,
    cached: false,
    processingTime: totalProcessingTime
  });
}

/**
 * Handle batch matrix analysis
 */
async function handleBatchAnalysis(body: any, apiLogger: any) {
  // Validate request
  const validatedData = batchAnalysisSchema.parse(body);
  const { pairs, options } = validatedData;

  apiLogger.info('Performing batch matrix analysis', {
    pairCount: pairs.length,
    options
  });

  const startTime = Date.now();
  const result = await matrixAnalysisService.performBatchAnalysis(
    pairs,
    options as MatrixAnalysisOptions & { parallelLimit?: number }
  );

  const totalProcessingTime = Date.now() - startTime;

  apiLogger.info('Batch matrix analysis completed', {
    batchId: result.batchId,
    successRate: `${result.successfulAnalyses}/${result.totalPairs}`,
    averageImpactScore: result.summary.averageImpactScore,
    averageConfidence: result.summary.averageConfidence,
    processingTime: totalProcessingTime
  });

  return NextResponse.json({
    success: true,
    data: result,
    processingTime: totalProcessingTime
  });
}

/**
 * GET /api/matrix/analyze
 * Get analysis status or cached results
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');
  const scenarioId = searchParams.get('scenarioId');

  if (!assetId || !scenarioId) {
    return NextResponse.json(
      { 
        error: 'Missing required parameters',
        message: 'Both assetId and scenarioId are required',
        code: 'MISSING_PARAMETERS'
      },
      { status: 400 }
    );
  }

  try {
    const cachedResult = await matrixAnalysisService.getCachedAnalysis(
      assetId,
      scenarioId
    );

    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    } else {
      return NextResponse.json({
        success: true,
        data: null,
        cached: false,
        message: 'No cached analysis found'
      });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to retrieve analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'RETRIEVAL_ERROR'
      },
      { status: 500 }
    );
  }
} 