import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ScenarioRepository } from '../../../../lib/repositories/scenarioRepository';
import { hasScenarioAccess, AccessRole } from '../../../../lib/services/accessControlService';
import { ScenarioType } from '@prisma/client';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { serverError, unauthorized, notFound, forbidden } from '../../../../lib/utils/http';
import { validateSchema } from '../../../../lib/utils/api';

// Create route-specific loggers
const getLogger = createChildLogger({ route: 'GET /api/scenarios/[scenarioId]' });
const updateLogger = createChildLogger({ route: 'PUT /api/scenarios/[scenarioId]' });
const deleteLogger = createChildLogger({ route: 'DELETE /api/scenarios/[scenarioId]' });

// Schema validation for updating scenarios
const updateScenarioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  probability: z.number().min(0).max(1).optional(),
  type: z.nativeEnum(ScenarioType).optional(),
  timeline: z.string().max(100).optional(),
  isPublic: z.boolean().optional()
});

// Create repository instance
const scenarioRepository = new ScenarioRepository();

// Handler for GET /api/scenarios/[scenarioId]
export async function GET(req: NextRequest, { params }: { params: { scenarioId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', getLogger);
    }
    
    const scenarioId = params.scenarioId;
    
    // Check if user has access to this scenario
    const hasAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this scenario', getLogger);
    }
    
    // Get the scenario
    const scenario = await scenarioRepository.getScenarioById(scenarioId, user.id);
    
    if (!scenario) {
      return notFound('Scenario not found', getLogger);
    }
    
    return NextResponse.json(scenario);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), getLogger);
  }
}

// Handler for PUT /api/scenarios/[scenarioId]
export async function PUT(req: NextRequest, { params }: { params: { scenarioId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', updateLogger);
    }
    
    const scenarioId = params.scenarioId;
    
    // Check if user has edit access to this scenario
    const hasAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.EDITOR);
    if (!hasAccess) {
      return forbidden('You do not have permission to edit this scenario', updateLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(updateScenarioSchema, body, updateLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    // Update scenario
    const updatedScenario = await scenarioRepository.updateScenario(scenarioId, validation.data, user.id);
    
    if (!updatedScenario) {
      return notFound('Scenario not found', updateLogger);
    }
    
    return NextResponse.json(updatedScenario);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), updateLogger);
  }
}

// Handler for DELETE /api/scenarios/[scenarioId]
export async function DELETE(req: NextRequest, { params }: { params: { scenarioId: string } }) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', deleteLogger);
    }
    
    const scenarioId = params.scenarioId;
    
    // Check if user has admin access to this scenario (only admins can delete)
    const hasAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.ADMIN);
    if (!hasAccess) {
      return forbidden('You do not have permission to delete this scenario', deleteLogger);
    }
    
    // Delete scenario
    const success = await scenarioRepository.deleteScenario(scenarioId);
    
    if (!success) {
      return notFound('Scenario not found', deleteLogger);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), deleteLogger);
  }
}
