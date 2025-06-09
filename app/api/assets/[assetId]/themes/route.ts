import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { hasAssetAccess, AccessRole } from '../../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../../lib/logger';
import { serverError, unauthorized, forbidden, badRequest } from '../../../../../lib/utils/http';
import { validateSchema } from '../../../../../lib/utils/api';
import { prisma } from '../../../../../lib/db';

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';

// Create route-specific logger
const logger = createChildLogger({ route: 'POST /api/assets/[assetId]/themes' });

// Schema validation for creating themes
const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(100)
});

// Handler for POST /api/assets/[assetId]/themes
export async function POST(req: NextRequest, { params }: { params: { assetId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    const assetId = params.assetId;
    
    // Check if user has edit access to this asset
    const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.EDITOR);
    if (!hasAccess) {
      return forbidden('You do not have permission to edit this asset', logger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(createThemeSchema, body, logger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Create theme
    const theme = await prisma.theme.create({
      data: {
        ...validation.data,
        assetId
      },
      include: {
        cards: true
      }
    });
    
    logger.info('Theme created successfully', {
      userId: user.id,
      assetId,
      themeId: theme.id,
      themeName: theme.name
    });
    
    return NextResponse.json(theme, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}