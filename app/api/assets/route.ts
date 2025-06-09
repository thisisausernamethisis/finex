import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../lib/repositories/assetRepository';
import { MatrixQueueService } from '../../../lib/services/matrixQueueService';
import { PortfolioInsightQueueService } from '../../../lib/services/portfolioInsightQueueService';
import { z } from 'zod';

// Force Node.js runtime for Prisma and complex dependencies
export const runtime = 'nodejs';
import { createChildLogger } from '../../../lib/logger';
import { serverError, unauthorized } from '../../../lib/utils/http';
import { getQueryOptions, validateSchema, withPagination } from '../../../lib/utils/api';

// Create a route-specific logger
const listLogger = createChildLogger({ route: 'GET /api/assets' });
const createLogger = createChildLogger({ route: 'POST /api/assets' });

// Schema validation for creating assets
const createAssetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  growthValue: z.number().min(0).max(1000000).optional(),
  isPublic: z.boolean().optional(),
  categoryConfidence: z.number().min(0).max(1).optional(),
  categoryInsights: z.record(z.any()).optional()
});

// Create repository and service instances
const assetRepository = new AssetRepository();
const matrixQueueService = new MatrixQueueService();
const portfolioInsightQueueService = new PortfolioInsightQueueService();

// Handler for GET /api/assets
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const queryOptions = getQueryOptions(url);
    
    // Use withPagination utility
    const paginationResult = await withPagination(
      queryOptions,
      (page, limit, search) => assetRepository.listAssets(user.id, page, limit, search),
      listLogger
    );
    
    if (paginationResult.error) {
      return paginationResult.error;
    }
    
    // Return the standardized response format
    return NextResponse.json(paginationResult.result);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), listLogger);
  }
}

// Handler for POST /api/assets
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', createLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(createAssetSchema, body, createLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Create asset
    const asset = await assetRepository.createAsset(user.id, validation.data);
    
    // Queue matrix recalculation for the new asset (background job)
    try {
      await matrixQueueService.queueAssetAddedCalculation(user.id, asset.id);
      await portfolioInsightQueueService.queueOnAssetAdded(user.id, asset.id, asset.name);
    } catch (error) {
      // Log error but don't fail asset creation
      createLogger.warn('Failed to queue matrix calculation for new asset', {
        userId: user.id,
        assetId: asset.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
