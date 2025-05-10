import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../lib/repositories/assetRepository';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { serverError, unauthorized } from '../../../lib/utils/http';
import { validateSchema } from '../../../lib/utils/api';
import { ListParamsSchema } from '../../../lib/validators/zod_list_params';

// Create a route-specific logger
const listLogger = createChildLogger({ route: 'GET /api/assets' });
const createLogger = createChildLogger({ route: 'POST /api/assets' });

// Schema validation for creating assets
const createAssetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional()
});

// Create repository instance
const assetRepository = new AssetRepository();

// Handler for GET /api/assets
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, q } = ListParamsSchema.parse(searchParams);
    
    // Get assets with validated parameters
    const paginationResult = await assetRepository.listAssets(
      user.id,
      page,
      limit,
      q ?? undefined
    );
    
    // Return the standardized response format with pagination metadata
    const hasMore = paginationResult.total > page * limit;
    return NextResponse.json({
      items: paginationResult.items,
      total: paginationResult.total,
      hasMore
    });
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
    
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
