import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { hasAssetAccess, AccessRole } from '../../../../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../../../../lib/logger';
import { serverError, unauthorized, forbidden, badRequest } from '../../../../../../../lib/utils/http';
import { validateSchema } from '../../../../../../../lib/utils/api';
import { prisma } from '../../../../../../../lib/db';

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';

// Create route-specific logger
const logger = createChildLogger({ route: 'POST /api/assets/[assetId]/themes/[themeId]/cards' });

// Schema validation for creating cards
const createCardSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  importance: z.number().int().min(1).max(5),
  source: z.string().max(500).optional()
});

// Handler for POST /api/assets/[assetId]/themes/[themeId]/cards
export async function POST(req: NextRequest, { params }: { params: { assetId: string; themeId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    const { assetId, themeId } = params;
    
    // Check if user has edit access to this asset
    const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.EDITOR);
    if (!hasAccess) {
      return forbidden('You do not have permission to edit this asset', logger);
    }
    
    // Verify the theme belongs to this asset
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        assetId: assetId
      }
    });
    
    if (!theme) {
      return badRequest('Theme not found for this asset', logger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(createCardSchema, body, logger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Create card
    const card = await prisma.card.create({
      data: {
        ...validation.data,
        themeId
      }
    });
    
    logger.info('Card created successfully', {
      userId: user.id,
      assetId,
      themeId,
      cardId: card.id,
      cardTitle: card.title
    });
    
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}