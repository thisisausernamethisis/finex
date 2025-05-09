import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { ThemeTemplateRepository } from '@/lib/repositories/themeTemplateRepository';
import { parseRequestBody } from '@/lib/utils/api';
import { logger } from '@/lib/logger';
import { createRateLimiter } from '@/lib/rateLimit';

// Rate limit: 50 requests per minute
const rateLimiter = createRateLimiter({
  uniqueTokenPerInterval: 100,
  interval: 60 * 1000, // 1 minute
  tokensPerInterval: 50,
});

// Validate search params
const ListParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  q: z.string().optional(),
  mine: z.boolean().optional(),
});

// Logger for this API route
const apiLogger = logger.child({ route: 'api/theme-templates' });

/**
 * GET /api/theme-templates
 * List theme templates with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await rateLimiter.limit();
    
    // Get authenticated user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const q = searchParams.get('q');
    const mine = searchParams.get('mine') === 'true';  // boolean
    
    // Validate params
    const result = ListParamsSchema.safeParse({
      page: pageParam,
      limit: limitParam,
      q,
      mine,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { page, limit } = result.data;
    
    // Get templates
    const templateRepository = new ThemeTemplateRepository();
    const templates = await templateRepository.listTemplates({
      page,
      limit,
      userId,
      q,
      mine,
    });
    
    return NextResponse.json(templates);
  } catch (error) {
    apiLogger.error('Error listing templates', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theme-templates
 * Create a new theme template
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    await rateLimiter.limit();
    
    // Get authenticated user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await parseRequestBody(request);
    
    // Create template
    const templateRepository = new ThemeTemplateRepository();
    const template = await templateRepository.createTemplate({
      ownerId: userId,
      name: body.name,
      description: body.description,
      payload: body.payload,
      isPublic: body.isPublic ?? false,
    });
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    apiLogger.error('Error creating template', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
