import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ThemeRepository } from '../../../../lib/repositories/themeRepository';
import { AccessRole, hasThemeAccess } from '../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { validateCuid, validateSchema } from '../../../../lib/utils/api';

// Create repository instance
const themeRepository = new ThemeRepository();

// Schema validation for updating themes
const updateThemeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  manualValue: z.number().optional(),
  useManualValue: z.boolean().optional()
});

// Handler for GET /api/themes/[themeId]
export async function GET(
  req: NextRequest,
  { params }: { params: { themeId: string } }
) {
  const logger = createChildLogger({ route: 'GET /api/themes/[themeId]', themeId: params.themeId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate theme ID format and existence
    const validation = await validateCuid(
      params.themeId,
      themeRepository.themeExists.bind(themeRepository),
      'Theme',
      logger
    );
    
    if (!validation.valid) {
      return validation.error;
    }
    
    const themeId = params.themeId;
    
    // Check if user has access to this theme
    const hasAccess = await hasThemeAccess(user.id, themeId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this theme', logger);
    }
    
    // Get theme from repository
    const theme = await themeRepository.getThemeById(themeId);
    
    if (!theme) {
      return notFound('Theme not found', logger);
    }
    
    return NextResponse.json(theme);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for PUT /api/themes/[themeId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { themeId: string } }
) {
  const logger = createChildLogger({ route: 'PUT /api/themes/[themeId]', themeId: params.themeId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate theme ID format and existence
    const idValidation = await validateCuid(
      params.themeId,
      themeRepository.themeExists.bind(themeRepository),
      'Theme',
      logger
    );
    
    if (!idValidation.valid) {
      return idValidation.error;
    }
    
    const themeId = params.themeId;
    
    // Check if user has EDITOR access to this theme
    const hasEditorAccess = await hasThemeAccess(user.id, themeId, AccessRole.EDITOR);
    if (!hasEditorAccess) {
      return forbidden('You do not have edit access to this theme', logger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const schemaValidation = validateSchema(updateThemeSchema, body, logger);
    
    if (!schemaValidation.success) {
      return schemaValidation.error;
    }
    
    // Update theme
    const theme = await themeRepository.updateTheme(
      themeId,
      schemaValidation.data
    );
    
    if (!theme) {
      return notFound('Theme not found or update failed', logger);
    }
    
    return NextResponse.json(theme);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for DELETE /api/themes/[themeId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { themeId: string } }
) {
  const logger = createChildLogger({ route: 'DELETE /api/themes/[themeId]', themeId: params.themeId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate theme ID format and existence
    const idValidation = await validateCuid(
      params.themeId,
      themeRepository.themeExists.bind(themeRepository),
      'Theme',
      logger
    );
    
    if (!idValidation.valid) {
      return idValidation.error;
    }
    
    const themeId = params.themeId;
    
    // For deletion, require ADMIN access
    const hasAdminAccess = await hasThemeAccess(user.id, themeId, AccessRole.ADMIN);
    if (!hasAdminAccess) {
      return forbidden('You do not have admin access to delete this theme', logger);
    }
    
    // Get theme to check if it's a special one
    const theme = await themeRepository.getThemeById(themeId);
    
    if (!theme) {
      return notFound('Theme not found', logger);
    }
    
    // Don't allow deletion of special themes (GROWTH, PROBABILITY)
    if (theme.themeType !== 'STANDARD') {
      return forbidden(`Cannot delete a ${theme.themeType} theme as it's required by the system`, logger);
    }
    
    // Delete theme
    const success = await themeRepository.deleteTheme(themeId);
    
    if (!success) {
      return serverError(new Error('Failed to delete theme'), logger);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
