import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { CardRepository } from '../../../lib/repositories/cardRepository';
import { ThemeRepository } from '../../../lib/repositories/themeRepository';
import { AccessRole, hasThemeAccess } from '../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { badRequest, forbidden, serverError, unauthorized } from '../../../lib/utils/http';
import { getQueryOptions, validateCuid, validateSchema, withPagination } from '../../../lib/utils/api';

// Create route-specific loggers
const listLogger = createChildLogger({ route: 'GET /api/cards' });
const createLogger = createChildLogger({ route: 'POST /api/cards' });

// Create repositories
const cardRepository = new CardRepository();
const themeRepository = new ThemeRepository();

// Schema validation for creating cards
const createCardSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  importance: z.number().int().min(1).max(10).optional().default(1),
  source: z.string().max(500).optional(),
  themeId: z.string().cuid(),
  chunks: z.array(z.object({
    content: z.string(),
    order: z.number().int().min(0)
  })).optional()
});

// Handler for GET /api/cards
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const queryOptions = getQueryOptions(url);
    const themeId = url.searchParams.get('themeId');
    
    // Theme ID is required for listing cards
    if (!themeId) {
      return NextResponse.json(
        { error: 'ValidationError', details: [{ path: 'themeId', message: 'themeId query parameter is required' }] },
        { status: 400 }
      );
    }
    
    // Validate theme ID
    const themeIdValidation = z.string().cuid().safeParse(themeId);
    if (!themeIdValidation.success) {
      return badRequest(themeIdValidation.error, listLogger);
    }
    
    // Check if theme exists
    const themeExists = await themeRepository.themeExists(themeId);
    if (!themeExists) {
      return NextResponse.json(
        { error: 'NotFoundError', message: 'Theme not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the theme
    const hasAccess = await hasThemeAccess(user.id, themeId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this theme', listLogger);
    }
    
    // Use withPagination utility
    const paginationResult = await withPagination(
      queryOptions,
      (page, limit, search) => cardRepository.listCards(themeId, page, limit, search),
      listLogger
    );
    
    if (paginationResult.error) {
      return paginationResult.error;
    }
    
    // Return the standardized response format
    return NextResponse.json(paginationResult.result);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), listLogger);
  }
}

// Handler for POST /api/cards
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', createLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(createCardSchema, body, createLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    const data = validation.data;
    
    // Check if theme exists
    const themeExists = await themeRepository.themeExists(data.themeId);
    if (!themeExists) {
      return NextResponse.json(
        { error: 'NotFoundError', message: 'Theme not found' },
        { status: 404 }
      );
    }
    
    // Check if user has EDITOR access to the theme
    const hasEditorAccess = await hasThemeAccess(user.id, data.themeId, AccessRole.EDITOR);
    if (!hasEditorAccess) {
      return forbidden('You do not have editor access to this theme', createLogger);
    }
    
    // Create card
    const card = await cardRepository.createCard(data);
    
    // Response with 201 Created status
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    createLogger.error('Error creating card', { error });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
