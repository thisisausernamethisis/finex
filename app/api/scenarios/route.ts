import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ScenarioRepository } from '../../../lib/repositories/scenarioRepository';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { serverError, unauthorized } from '../../../lib/utils/http';
import { getQueryOptions, validateSchema, withPagination } from '../../../lib/utils/api';

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
    
    // Get query parameters
    const url = new URL(req.url);
    const queryOptions = getQueryOptions(url);
    
    // Use withPagination utility
    const paginationResult = await withPagination(
      queryOptions,
      (page, limit, search) => scenarioRepository.listScenarios(user.id, page, limit, search),
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
