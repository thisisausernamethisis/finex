import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../../lib/db';
import { createChildLogger } from '../../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../../lib/utils/http';
import { cloneAssetFromTemplate } from '../../../../../lib/services/templateService';
import { AccessRole, hasAssetAccess } from '../../../../../lib/services/accessControlService';
import { AssetRepository } from '../../../../../lib/repositories/assetRepository';

// Create a route-specific logger
const logger = createChildLogger({ route: 'POST /api/assets/[assetId]/clone' });

// Repository instance 
const assetRepo = new AssetRepository();

/**
 * POST handler for cloning an asset template
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    const templateId = params.assetId;
    
    // First check if the asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: templateId }
    });
    
    if (!asset) {
      return notFound('Asset not found', logger);
    }
    
    // Then check if it's a template
    if (asset.kind !== 'TEMPLATE') {
      logger.warn('Invalid template kind', { kind: asset.kind });
      return NextResponse.json({ 
        error: 'BadRequestError',
        message: 'Asset is not a template' 
      }, { status: 400 });
    }
    
    // Check access - users can only clone public templates or ones they have access to
    if (asset.userId !== user.id && !asset.isPublic) {
      // Check if user has access through sharing
      const hasAccess = await hasAssetAccess(user.id, templateId, AccessRole.VIEWER);
      if (!hasAccess) {
        return forbidden('No access to template', logger);
      }
    }
    
    // Clone the template
    const newAssetId = await cloneAssetFromTemplate(templateId, user.id);
    
    // Get the new asset
    const newAsset = await assetRepo.getAssetById(newAssetId, user.id);
    
    // Return the cloned asset
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    logger.error('Error cloning asset template', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: params.assetId
    });
    
    if (error instanceof Error && error.message.includes('No access')) {
      return forbidden(error.message, logger);
    }
    
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
