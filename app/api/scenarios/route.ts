import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ScenarioRepository } from '../../../lib/repositories/scenarioRepository';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { serverError, unauthorized } from '../../../lib/utils/http';
import { validateSchema } from '../../../lib/utils/api';
import { ListParamsSchema } from '../../../lib/validators/zod_list_params';

// Create route-specific loggers
const listLogger = createChildLogger({ route: 'GET /api/scenarios' });
const createLogger = createChildLogger({ route: 'POST /api/scenarios' });

// Schema validation for creating scenarios
const createScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  probability: z.number().min(0).max(1).optional()
});

// Create repository instance
const scenarioRepository = new ScenarioRepository();

// Handler for GET /api/scenarios
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, q } = ListParamsSchema.parse(searchParams);
    
    // Get scenarios with validated parameters
    const paginationResult = await scenarioRepository.listScenarios(
      user.id,
      page,
      limit,
      q
    );
    
    // Return the standardized response format with pagination metadata
    return NextResponse.json({
      items: paginationResult.items,
      total: paginationResult.total,
      page,
      limit,
      pages: Math.ceil(paginationResult.total / limit)
    });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), listLogger);
  }
}

// Handler for POST /api/scenarios
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', createLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(createScenarioSchema, body, createLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Create scenario
    const scenario = await scenarioRepository.createScenario(validation.data);
    
    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
