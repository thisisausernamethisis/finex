import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { hasAssetAccess } from '../../../../lib/rbac';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { validateCuid, validateSchema } from '../../../../lib/utils/api';
import { ensureOwner } from '../../../../lib/authz/ensureOwner';

// Create repository instance
const assetRepository = new AssetRepository();

// Import the validator schema
import { AssetUpsert } from '../../../../lib/validators/assets';

// Handler for GET /api/assets/[assetId]
export async function GET(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const logger = createChildLogger({ route: 'GET /api/assets/[assetId]', assetId: params.assetId });
  
  // Validate asset ID format and existence
  const validation = await validateCuid(
    params.assetId,
    assetRepository.assetExists.bind(assetRepository),
    'Asset',
    logger
  );
  
  if (!validation.valid) {
    return validation.error;
  }
  
  const assetId = params.assetId;
  
  // Use the ensureOwner helper to handle authorization
  return ensureOwner(req, assetId, async () => {
    try {
      // Get asset from repository
      const user = await currentUser();
      const asset = await assetRepository.getAssetById(assetId, user!.id);
      
      if (!asset) {
        return notFound('Asset not found', logger);
      }
      
      return NextResponse.json(asset);
    } catch (error) {
      return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
    }
  });
}

// Handler for PUT /api/assets/[assetId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const logger = createChildLogger({ route: 'PUT /api/assets/[assetId]', assetId: params.assetId });
  
  // Validate asset ID format and existence
  const idValidation = await validateCuid(
    params.assetId,
    assetRepository.assetExists.bind(assetRepository),
    'Asset',
    logger
  );
  
  if (!idValidation.valid) {
    return idValidation.error;
  }
  
  const assetId = params.assetId;
  
  // Use the ensureOwner helper to handle authorization
  return ensureOwner(req, assetId, async () => {
    try {
      // Parse and validate request body
      let validatedData;
      try {
        const body = await req.json();
        validatedData = AssetUpsert.partial().parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return badRequest(`Invalid asset data: ${error.message}`, logger);
        }
        throw error;
      }
      
      // Update asset
      const user = await currentUser();
      const asset = await assetRepository.updateAsset(
        assetId,
        validatedData,
        user!.id
      );
      
      if (!asset) {
        return notFound('Asset not found or update failed', logger);
      }
      
      return NextResponse.json(asset);
    } catch (error) {
      return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
    }
  });
}

// Handler for DELETE /api/assets/[assetId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const logger = createChildLogger({ route: 'DELETE /api/assets/[assetId]', assetId: params.assetId });
  
  // Validate asset ID format and existence
  const idValidation = await validateCuid(
    params.assetId,
    assetRepository.assetExists.bind(assetRepository),
    'Asset',
    logger
  );
  
  if (!idValidation.valid) {
    return idValidation.error;
  }
  
  const assetId = params.assetId;
  
  // Use the ensureOwner helper to handle authorization
  return ensureOwner(req, assetId, async () => {
    try {
      // Delete asset
      const user = await currentUser();
      const success = await assetRepository.deleteAsset(assetId, user!.id);
      
      if (!success) {
        return serverError(new Error('Failed to delete asset'), logger);
      }
      
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
    }
  });
}
