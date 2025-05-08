import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { AccessRole, hasAssetAccess } from '../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { validateCuid, validateSchema } from '../../../../lib/utils/api';

// Create repository instance
const assetRepository = new AssetRepository();

// Schema validation for updating assets
const updateAssetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional()
});

// Handler for GET /api/assets/[assetId]
export async function GET(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const logger = createChildLogger({ route: 'GET /api/assets/[assetId]', assetId: params.assetId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized();
    }
    
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
    
    // Check if user has access to this asset
    const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this asset', logger);
    }
    
    // Get asset from repository
    const asset = await assetRepository.getAssetById(assetId, user.id);
    
    if (!asset) {
      return notFound('Asset not found', logger);
    }
    
    return NextResponse.json(asset);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for PUT /api/assets/[assetId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const logger = createChildLogger({ route: 'PUT /api/assets/[assetId]', assetId: params.assetId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized();
    }
    
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
    
    // Check if user has EDITOR access to this asset
    const hasEditorAccess = await hasAssetAccess(user.id, assetId, AccessRole.EDITOR);
    if (!hasEditorAccess) {
      return forbidden('You do not have edit access to this asset', logger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const schemaValidation = validateSchema(updateAssetSchema, body, logger);
    
    if (!schemaValidation.success) {
      return schemaValidation.error;
    }
    
    // Update asset
    const asset = await assetRepository.updateAsset(
      assetId,
      schemaValidation.data,
      user.id
    );
    
    if (!asset) {
      return notFound('Asset not found or update failed', logger);
    }
    
    return NextResponse.json(asset);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for DELETE /api/assets/[assetId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const logger = createChildLogger({ route: 'DELETE /api/assets/[assetId]', assetId: params.assetId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized();
    }
    
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
    
    // For deletion, require ADMIN access
    const hasAdminAccess = await hasAssetAccess(user.id, assetId, AccessRole.ADMIN);
    if (!hasAdminAccess) {
      return forbidden('You do not have admin access to delete this asset', logger);
    }
    
    // Delete asset
    const success = await assetRepository.deleteAsset(assetId, user.id);
    
    if (!success) {
      return serverError(new Error('Failed to delete asset'), logger);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
