import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ThemeRepository } from '../../../lib/repositories/themeRepository';
import { AccessRole, hasAssetAccess, hasScenarioAccess } from '../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { badRequest, serverError, unauthorized } from '../../../lib/utils/http';
import { getQueryOptions, validateCuid, validateSchema, withPagination } from '../../../lib/utils/api';

// Create route-specific loggers
const listLogger = createChildLogger({ route: 'GET /api/themes' });
const createLogger = createChildLogger({ route: 'POST /api/themes' });

// Schema validation for creating themes
const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  themeType: z.enum(['STANDARD', 'GROWTH', 'PROBABILITY']).optional(),
  assetId: z.string().cuid().optional(),
  scenarioId: z.string().cuid().optional(),
  manualValue: z.number().optional(),
  useManualValue: z.boolean().optional()
}).refine(data => data.assetId || data.scenarioId, {
  message: 'Either assetId or scenarioId must be provided',
  path: ['assetId']
}).refine(data => !(data.assetId && data.scenarioId), {
  message: 'Only one of assetId or scenarioId can be provided',
  path: ['assetId']
});

// Create repository instance
const themeRepository = new ThemeRepository();

// Handler for GET /api/themes
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const queryOptions = getQueryOptions(url);
    const assetId = url.searchParams.get('assetId');
    const scenarioId = url.searchParams.get('scenarioId');
    
    // Validate parent IDs if provided
    if (assetId) {
      const assetIdValidation = z.string().cuid().safeParse(assetId);
      if (!assetIdValidation.success) {
        return badRequest(assetIdValidation.error, listLogger);
      }
      
      // Check if user has access to this asset
      const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
      if (!hasAccess) {
        return unauthorized('You do not have access to this asset', listLogger);
      }
    }
    
    if (scenarioId) {
      const scenarioIdValidation = z.string().cuid().safeParse(scenarioId);
      if (!scenarioIdValidation.success) {
        return badRequest(scenarioIdValidation.error, listLogger);
      }
      
      // Check if user has access to this scenario
      const hasAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
      if (!hasAccess) {
        return unauthorized('You do not have access to this scenario', listLogger);
      }
    }
    
    // Use withPagination utility
    const paginationResult = await withPagination(
      queryOptions,
      (page, limit, search) => themeRepository.listThemes(page, limit, assetId || undefined, scenarioId || undefined, search),
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

// Handler for POST /api/themes
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', createLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(createThemeSchema, body, createLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    const data = validation.data;
    
    // Check if user has EDITOR access to the parent entity
    if (data.assetId) {
      const hasAccess = await hasAssetAccess(user.id, data.assetId, AccessRole.EDITOR);
      if (!hasAccess) {
        return unauthorized('You do not have editor access to this asset', createLogger);
      }
    } else if (data.scenarioId) {
      const hasAccess = await hasScenarioAccess(user.id, data.scenarioId, AccessRole.EDITOR);
      if (!hasAccess) {
        return unauthorized('You do not have editor access to this scenario', createLogger);
      }
    }
    
    // Create theme
    const theme = await themeRepository.createTheme(data);
    
    return NextResponse.json(theme, { status: 201 });
  } catch (error) {
    createLogger.error('Error creating theme', { error });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
