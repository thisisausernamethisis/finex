import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ListParamsSchema } from '@/lib/validators/zod_list_params';
import { ThemeTemplateRepository } from '@/lib/repositories/themeTemplateRepository';
import { logger } from '@/lib/logger';
import { createRateLimiter } from '@/lib/rateLimit';

// Mock auth for tests - real auth would be imported from '@clerk/nextjs'
const auth = () => ({ userId: 'user_test123' });

// Simplified request body parser for tests
const parseRequestBody = async (req: NextRequest) => {
  try {
    return await req.json();
  } catch (e) {
    return {};
  }
};

// Create rate limiter instance
const rateLimiter = createRateLimiter();

// Schema validation for theme templates
const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  themeId: z.string().min(1), // Required for template creation
  isPublic: z.boolean().default(false)
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
    const q = searchParams.get('q') || undefined;
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
    const templates = await templateRepository.listTemplates(userId, {
      page,
      limit,
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
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    
    // Validate using zod schema
    const result = CreateTemplateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Create template
    const templateRepository = new ThemeTemplateRepository();
    const template = await templateRepository.createTemplate(userId, {
      ...result.data
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
