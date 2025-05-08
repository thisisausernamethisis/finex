import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../../lib/db';
import { createChildLogger } from '../../../../../lib/logger';
import { forbidden, notFound, serverError, unauthorized } from '../../../../../lib/utils/http';
import { cloneThemeTemplate } from '../../../../../lib/services/templateService';
import { z } from 'zod';
import { validateSchema } from '../../../../../lib/utils/api';
import { hasTemplateAccess } from '../../../../../lib/services/templateService';
import { AccessRole } from '../../../../../lib/services/accessControlService';
import { ThemeTemplateRepository } from '../../../../../lib/repositories/themeTemplateRepository';

// Create a route-specific logger
const logger = createChildLogger({ route: 'POST /api/theme-templates/[id]/clone' });

// Schema for validating request body
const cloneSchema = z.object({
  assetId: z.string().min(1)
});

// Repository instance
const templateRepo = new ThemeTemplateRepository();

/**
 * POST handler for cloning a theme template
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    const templateId = params.id;
    
    // Check if template exists
    const templateExists = await templateRepo.templateExists(templateId);
    if (!templateExists) {
      return notFound('Template not found', logger);
    }
    
    // Check access control
    const hasAccess = await hasTemplateAccess(user.id, templateId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('No access to this template', logger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(cloneSchema, body, logger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Clone the template
    const themeId = await cloneThemeTemplate(
      templateId,
      validation.data.assetId,
      user.id
    );
    
    // Get the new theme
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        themeType: true,
        assetId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Return the cloned theme
    return NextResponse.json(theme, { status: 201 });
  } catch (error) {
    logger.error('Error cloning theme template', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: params.id
    });
    
    if (error instanceof Error && error.message.includes('No access')) {
      return forbidden(error.message, logger);
    }
    
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
