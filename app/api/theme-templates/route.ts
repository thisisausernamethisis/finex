import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serverError, unauthorized, badRequest } from '../../../lib/utils/http';
import { validateSchema } from '../../../lib/utils/api';
import { createChildLogger } from '../../../lib/logger';
import { ThemeTemplateRepository } from '../../../lib/repositories';
import { checkRateLimit } from '../../../lib/rateLimit';
import { z } from 'zod';

const listLogger = createChildLogger({ route: 'GET /api/theme-templates' });
const createLogger = createChildLogger({ route: 'POST /api/theme-templates' });

// Create repository instance (no direct test imports)
// This will be replaced with the mock during tests via Jest's module mocking
let templateRepo = new ThemeTemplateRepository();

// Validation schemas
const themeTemplateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  themeId: z.string().min(1),
  isPublic: z.boolean().optional().default(false)
});

// Search/filter params validation schema
const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
  q: z.string().max(100).optional(),
  mine: z.enum(['true', 'false']).optional().transform(val => val === 'true'),  // boolean - corrected parsing
  publicOnly: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

/**
 * Helper function to apply rate limit and add headers to response
 * @param userId The user's ID to use as the rate limit key
 * @param req The incoming request
 * @returns Rate limit result including response if limit exceeded
 */
function applyRateLimit(userId: string, req: NextRequest): {
  limitExceeded: boolean;
  rateLimitHeaders: Record<string, string>;
  rateLimitResponse?: NextResponse;
} {
  // Check rate limit (100 requests per minute)
  const rateLimit = checkRateLimit(`templates-${userId}`, 100, 60);
  
  // If rate limited, return 429 response
  if (rateLimit.isLimited) {
    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
    
    // Add all rate limit headers
    Object.entries(rateLimit.headers).forEach(([key, value]) => {
      rateLimitResponse.headers.set(key, value);
    });
    
    return {
      limitExceeded: true,
      rateLimitHeaders: rateLimit.headers,
      rateLimitResponse
    };
  }
  
  // Not rate limited, just return the headers
  return {
    limitExceeded: false,
    rateLimitHeaders: rateLimit.headers
  };
}

/**
 * GET handler for listing theme templates
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Get and validate query parameters
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Validate query parameters
    const validationResult = searchParamsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return badRequest(validationResult.error, listLogger);
    }
    
    // Special validation for negative page numbers - return 400
    if (queryParams.page && parseInt(queryParams.page, 10) < 1) {
      return badRequest('Page number must be positive', listLogger);
    }
    
    // Special validation for too long search query - return 400
    if (queryParams.q && queryParams.q.length > 100) {
      return badRequest('Search query must not exceed 100 characters', listLogger);
    }
    
    // Extract validated search options
    const searchOptions = validationResult.data;
    
    // Apply rate limiting
    const rateLimit = applyRateLimit(user.id, req);
    
    // Return 429 if rate limited
    if (rateLimit.limitExceeded && rateLimit.rateLimitResponse) {
      return rateLimit.rateLimitResponse;
    }
    
    // Debug logging
    console.log('[ROUTE DEBUG] Searching with params:', {
      userId: user.id,
      q: searchOptions.q,
      mine: searchOptions.mine,
      page: searchOptions.page,
      limit: searchOptions.limit
    });

    // Query templates with all filters applied at the repository level
    const result = await templateRepo.listTemplates(user.id, {
      page: searchOptions.page,
      limit: searchOptions.limit,
      q: searchOptions.q,
      mine: searchOptions.mine,
      publicOnly: searchOptions.publicOnly
    });
    
    // Debug the results
    console.log('[ROUTE DEBUG] Search results:', { 
      total: result.total, 
      count: result.items?.length || 0,
      items: result.items?.map((item: any) => ({ 
        id: item.id, 
        name: item.name, 
        ownerId: item.ownerId 
      }))
    });
    
    // Ensure result has the required OpenAPI schema properties
    const responseData = {
      items: result.items || [],
      total: result.total ?? (result.items?.length ?? 0),
      hasMore: result.hasMore || false
    };
    
    // Add debugging information if DEBUG_TEMPLATES is enabled
    if (process.env.DEBUG_TEMPLATES) {
      console.debug('[DEBUG] payload', {
        q: searchOptions.q, 
        mine: searchOptions.mine, 
        total: responseData.total, 
        items: responseData.items.map((t: any) => ({ id: t.id, name: t.name, ownerId: t.ownerId }))
      });
    }
    
    // Add rate limiting headers to the response
    const response = NextResponse.json(responseData);
    
    // Apply rate limit headers to the response
    Object.entries(rateLimit.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Log response for debugging
    listLogger.debug('Returning template search results', {
      totalItems: responseData.total,
      returnedItems: responseData.items.length,
      hasMore: responseData.hasMore,
      searchTerm: searchOptions.q,
      page: searchOptions.page
    });
    
    return response;
  } catch (error) {
    console.error('[ERROR] Template search error:', error);
    return serverError(error instanceof Error ? error : new Error('Unknown error'), listLogger);
  }
}

/**
 * POST handler for creating a new theme template
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', createLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(themeTemplateCreateSchema, body, createLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Create template
    const template = await templateRepo.createTemplate(user.id, validation.data);
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
