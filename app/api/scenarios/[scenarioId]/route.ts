import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ScenarioRepository } from '../../../../lib/repositories/scenarioRepository';
import { AccessRole, hasScenarioAccess } from '../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { validateCuid, validateSchema } from '../../../../lib/utils/api';

// Create repository instance
const scenarioRepository = new ScenarioRepository();

// Schema validation for updating scenarios
const updateScenarioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  probability: z.number().min(0).max(1).optional()
});

// Handler for GET /api/scenarios/[scenarioId]
export async function GET(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const logger = createChildLogger({ route: 'GET /api/scenarios/[scenarioId]', scenarioId: params.scenarioId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate scenario ID format and existence
    const validation = await validateCuid(
      params.scenarioId,
      scenarioRepository.scenarioExists.bind(scenarioRepository),
      'Scenario',
      logger
    );
    
    if (!validation.valid) {
      return validation.error;
    }
    
    const scenarioId = params.scenarioId;
    
    // Check if user has access to this scenario
    const hasAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this scenario', logger);
    }
    
    // Get scenario from repository
    const scenario = await scenarioRepository.getScenarioById(scenarioId, user.id);
    
    if (!scenario) {
      return notFound('Scenario not found', logger);
    }
    
    return NextResponse.json(scenario);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for PUT /api/scenarios/[scenarioId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const logger = createChildLogger({ route: 'PUT /api/scenarios/[scenarioId]', scenarioId: params.scenarioId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate scenario ID format and existence
    const idValidation = await validateCuid(
      params.scenarioId,
      scenarioRepository.scenarioExists.bind(scenarioRepository),
      'Scenario',
      logger
    );
    
    if (!idValidation.valid) {
      return idValidation.error;
    }
    
    const scenarioId = params.scenarioId;
    
    // Check if user has EDITOR access to this scenario
    const hasEditorAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.EDITOR);
    if (!hasEditorAccess) {
      return forbidden('You do not have edit access to this scenario', logger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const schemaValidation = validateSchema(updateScenarioSchema, body, logger);
    
    if (!schemaValidation.success) {
      return schemaValidation.error;
    }
    
    // Update scenario
    const scenario = await scenarioRepository.updateScenario(
      scenarioId,
      schemaValidation.data,
      user.id
    );
    
    if (!scenario) {
      return notFound('Scenario not found or update failed', logger);
    }
    
    return NextResponse.json(scenario);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for DELETE /api/scenarios/[scenarioId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const logger = createChildLogger({ route: 'DELETE /api/scenarios/[scenarioId]', scenarioId: params.scenarioId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate scenario ID format and existence
    const idValidation = await validateCuid(
      params.scenarioId,
      scenarioRepository.scenarioExists.bind(scenarioRepository),
      'Scenario',
      logger
    );
    
    if (!idValidation.valid) {
      return idValidation.error;
    }
    
    const scenarioId = params.scenarioId;
    
    // For deletion, require ADMIN access
    const hasAdminAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.ADMIN);
    if (!hasAdminAccess) {
      return forbidden('You do not have admin access to delete this scenario', logger);
    }
    
    // Delete scenario
    const success = await scenarioRepository.deleteScenario(scenarioId);
    
    if (!success) {
      return serverError(new Error('Failed to delete scenario'), logger);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
