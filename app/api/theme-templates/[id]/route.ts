import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/db';
import { createChildLogger } from '../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { ensureTemplateOwner } from '../../../../lib/authz/ensureTemplateOwner';
import { ThemeTemplateRepository } from '../../../../lib/repositories/themeTemplateRepository';
import { toggleVisibility } from '../../../../lib/services/templateService';
import { hasTemplateAccess } from '../../../../lib/rbac';
import { z } from 'zod';
import { validateSchema } from '../../../../lib/utils/api';
import { TemplateUpsert } from '../../../../lib/validators/templates';
import { Container } from '../../../../lib/container';
import { PrismaClient } from '@prisma/client';

// Create route-specific loggers
const getLogger = createChildLogger({ route: 'GET /api/theme-templates/[id]' });
const updateLogger = createChildLogger({ route: 'PUT /api/theme-templates/[id]' });
const deleteLogger = createChildLogger({ route: 'DELETE /api/theme-templates/[id]' });
const patchLogger = createChildLogger({ route: 'PATCH /api/theme-templates/[id]' });

// Repository instance
const templateRepo = new ThemeTemplateRepository();


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
  const templateId = params.id;
  
  // Use ensureTemplateOwner helper to verify authentication and ownership
  return ensureTemplateOwner(req, templateId, async () => {
    try {
      // Get the template
      const template = await templateRepo.getTemplateById(templateId);
      if (!template) {
        return notFound('Template not found', getLogger);
      }
      
      // Return the template
      return NextResponse.json(template);
    } catch (error) {
      // Ensure we always return a NextResponse
      return serverError(error instanceof Error ? error : new Error('Unknown error'), getLogger);
    }
  });
}

/**
 * PUT handler for updating a theme template
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const templateId = params.id;
  
  // Use ensureTemplateOwner helper to verify authentication and ownership
  return ensureTemplateOwner(req, templateId, async () => {
    try {
      // Parse and validate request body
      let validatedData;
      try {
        const body = await req.json();
        validatedData = TemplateUpsert.partial().parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return badRequest(`Invalid template data: ${error.message}`, updateLogger);
        }
        throw error;
      }
      
      // Update the template
      const updatedTemplate = await prisma.themeTemplate.update({
        where: { id: templateId },
        data: validatedData,
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
  });
}

/**
 * DELETE handler for deleting a theme template
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const templateId = params.id;
  
  // Use ensureTemplateOwner helper to verify authentication and ownership
  return ensureTemplateOwner(req, templateId, async () => {
    try {
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
  });
}

/**
 * PATCH handler for toggling template visibility (public/private)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const templateId = params.id;
  
  // Use ensureTemplateOwner helper to verify authentication and ownership
  return ensureTemplateOwner(req, templateId, async () => {
    // Get current user (ensureTemplateOwner already verified auth)
    const user = await currentUser();
    if (!user) {
      return unauthorized('Authentication required', patchLogger);
    }
    
    try {
      // Parse and validate request body
      let body;
      try {
        body = await req.json();
      } catch (error) {
        return badRequest('Invalid JSON body', patchLogger);
      }
      
      // Validate the schema
      const validation = validateSchema(visibilitySchema, body, patchLogger);
      if (!validation.success) {
        return validation.error;
      }
      
      const { isPublic } = validation.data;
      
      // Update template visibility
      const updatedTemplate = await toggleVisibility(templateId, user.id, isPublic);
      
      // Return the updated template
      return NextResponse.json(updatedTemplate);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return notFound('Template not found', patchLogger);
        }
        return serverError(error, patchLogger);
      }
      return serverError(new Error('Unknown error'), patchLogger);
    }
  });
}
