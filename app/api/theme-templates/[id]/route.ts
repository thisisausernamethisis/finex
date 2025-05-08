import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/db';
import { createChildLogger } from '../../../../lib/logger';
import { forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { AccessRole } from '../../../../lib/services/accessControlService';
import { ThemeTemplateRepository } from '../../../../lib/repositories/themeTemplateRepository';
import { hasTemplateAccess, toggleVisibility } from '../../../../lib/services/templateService';
import { z } from 'zod';
import { validateSchema } from '../../../../lib/utils/api';

// Create route-specific loggers
const getLogger = createChildLogger({ route: 'GET /api/theme-templates/[id]' });
const updateLogger = createChildLogger({ route: 'PUT /api/theme-templates/[id]' });
const deleteLogger = createChildLogger({ route: 'DELETE /api/theme-templates/[id]' });
const patchLogger = createChildLogger({ route: 'PATCH /api/theme-templates/[id]' });

// Repository instance
const templateRepo = new ThemeTemplateRepository();

// Schema for updating template
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional()
});

// Schema for toggling template visibility
const visibilitySchema = z.object({
  isPublic: z.boolean()
});

/**
 * GET handler for retrieving a theme template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', getLogger);
    }
    
    const templateId = params.id;
    
    // Check if template exists
    const template = await templateRepo.getTemplateById(templateId);
    if (!template) {
      return notFound('Template not found', getLogger);
    }
    
    // Check access control
    const hasAccess = await hasTemplateAccess(user.id, templateId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('No access to this template', getLogger);
    }
    
    // Return the template
    return NextResponse.json(template);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), getLogger);
  }
}

/**
 * PUT handler for updating a theme template
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', updateLogger);
    }
    
    const templateId = params.id;
    
    // Check if template exists
    const template = await templateRepo.getTemplateById(templateId);
    if (!template) {
      return notFound('Template not found', updateLogger);
    }
    
    // Only owner can update template
    if (template.ownerId !== user.id) {
      return forbidden('Only the owner can update this template', updateLogger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(updateTemplateSchema, body, updateLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Update the template
    const updatedTemplate = await prisma.themeTemplate.update({
      where: { id: templateId },
      data: validation.data,
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Return the updated template
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), updateLogger);
  }
}

/**
 * DELETE handler for deleting a theme template
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', deleteLogger);
    }
    
    const templateId = params.id;
    
    // Check if template exists
    const template = await templateRepo.getTemplateById(templateId);
    if (!template) {
      return notFound('Template not found', deleteLogger);
    }
    
    // Only owner can delete template
    if (template.ownerId !== user.id) {
      return forbidden('Only the owner can delete this template', deleteLogger);
    }
    
    // Delete the template
    const success = await templateRepo.deleteTemplate(templateId);
    
    if (!success) {
      return serverError(new Error('Failed to delete template'), deleteLogger);
    }
    
    // Return success response
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), deleteLogger);
  }
}

/**
 * PATCH handler for toggling template visibility (public/private)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', patchLogger);
    }
    
    const templateId = params.id;
    
    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(visibilitySchema, body, patchLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    const { isPublic } = validation.data;
    
    try {
      // Template access and ownership verification is handled in the service
      const updatedTemplate = await toggleVisibility(templateId, user.id, isPublic);
      
      // Return the updated template
      return NextResponse.json(updatedTemplate);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return notFound('Template not found', patchLogger);
        } else if (error.message.includes('owner')) {
          return forbidden('Only the owner can toggle template visibility', patchLogger);
        }
      }
      throw error; // Re-throw for the outer catch
    }
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), patchLogger);
  }
}
