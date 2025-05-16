import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../lib/repositories/assetRepository';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { badRequest, serverError, unauthorized } from '../../../lib/utils/http';
import { validateSchema, validateCuid } from '../../../lib/utils/api';
import { ensureOwner } from '../../../lib/authz/ensureOwner';
import { ListParamsSchema } from '../../../lib/validators/zod_list_params';
import { AssetUpsert } from '../../../lib/validators/assets';

// Create a route-specific logger
const listLogger = createChildLogger({ route: 'GET /api/assets' });
const createLogger = createChildLogger({ route: 'POST /api/assets' });
const deleteLogger = createChildLogger({ route: 'DELETE /api/assets' });

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
    
    // Parse and validate request body
    let validatedData;
    try {
      const body = await req.json();
      validatedData = AssetUpsert.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequest(`Invalid asset data: ${error.message}`, createLogger);
      }
      throw error;
    }
    
    // Create asset
    const asset = await assetRepository.createAsset(user.id, validatedData);
    
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}

// Handler for DELETE /api/assets?id=[assetId]
export async function DELETE(req: NextRequest) {
  // Get asset ID from query parameter
  const assetId = req.nextUrl.searchParams.get('id');
  if (!assetId) {
    return NextResponse.json({ message: 'Asset ID is required' }, { status: 400 });
  }
  
  // Validate asset ID format and existence
  const idValidation = await validateCuid(
    assetId,
    assetRepository.assetExists.bind(assetRepository),
    'Asset',
    deleteLogger
  );
  
  if (!idValidation.valid) {
    return idValidation.error;
  }
  
  // Use the ensureOwner helper to handle authorization
  return ensureOwner(req, assetId, async () => {
    try {
      // Delete asset
      const user = await currentUser();
      const success = await assetRepository.deleteAsset(assetId, user!.id);
      
      if (!success) {
        return serverError(new Error('Failed to delete asset'), deleteLogger);
      }
      
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return serverError(error instanceof Error ? error : new Error('Unknown error'), deleteLogger);
    }
  });
}
