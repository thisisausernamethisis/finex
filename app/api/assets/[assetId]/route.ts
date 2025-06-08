import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { hasAssetAccess, AccessRole } from '../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { serverError, unauthorized, notFound, forbidden } from '../../../../lib/utils/http';
import { validateSchema } from '../../../../lib/utils/api';

// Create route-specific loggers
const getLogger = createChildLogger({ route: 'GET /api/assets/[assetId]' });
const updateLogger = createChildLogger({ route: 'PUT /api/assets/[assetId]' });
const deleteLogger = createChildLogger({ route: 'DELETE /api/assets/[assetId]' });

// Schema validation for updating assets
const updateAssetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional()
});

// Create repository instance
const assetRepository = new AssetRepository();

// Handler for GET /api/assets/[assetId]
export async function GET(req: NextRequest, { params }: { params: { assetId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', getLogger);
    }
    
    const assetId = params.assetId;
    
    // Check if user has access to this asset
    const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this asset', getLogger);
    }
    
    // Get the asset
    const asset = await assetRepository.getAssetById(assetId, user.id);
    
    if (!asset) {
      return notFound('Asset not found', getLogger);
    }
    
    return NextResponse.json(asset);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), getLogger);
  }
}

// Handler for PUT /api/assets/[assetId]
export async function PUT(req: NextRequest, { params }: { params: { assetId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', updateLogger);
    }
    
    const assetId = params.assetId;
    
    // Check if user has edit access to this asset
    const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.EDITOR);
    if (!hasAccess) {
      return forbidden('You do not have permission to edit this asset', updateLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(updateAssetSchema, body, updateLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Update asset
    const updatedAsset = await assetRepository.updateAsset(assetId, validation.data, user.id);
    
    if (!updatedAsset) {
      return notFound('Asset not found', updateLogger);
    }
    
    return NextResponse.json(updatedAsset);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), updateLogger);
  }
}

// Handler for DELETE /api/assets/[assetId]
export async function DELETE(req: NextRequest, { params }: { params: { assetId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', deleteLogger);
    }
    
    const assetId = params.assetId;
    
    // Check if user has admin access to this asset (only admins can delete)
    const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.ADMIN);
    if (!hasAccess) {
      return forbidden('You do not have permission to delete this asset', deleteLogger);
    }
    
    // Delete asset
    const success = await assetRepository.deleteAsset(assetId, user.id);
    
    if (!success) {
      return notFound('Asset not found', deleteLogger);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), deleteLogger);
  }
}
