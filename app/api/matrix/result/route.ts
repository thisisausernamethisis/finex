import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { MatrixRepository } from '../../../../lib/repositories/matrixRepository';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { ScenarioRepository } from '../../../../lib/repositories/scenarioRepository';
import { AccessRole, hasAssetAccess, hasScenarioAccess } from '../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';

// Create route-specific logger
const logger = createChildLogger({ route: 'GET /api/matrix/result' });

// Create repositories
const matrixRepository = new MatrixRepository();
const assetRepository = new AssetRepository();
const scenarioRepository = new ScenarioRepository();

// Handler for GET /api/matrix/result
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const assetId = url.searchParams.get('assetId');
    const scenarioId = url.searchParams.get('scenarioId');
    
    // Both assetId and scenarioId are required
    if (!assetId || !scenarioId) {
      return NextResponse.json(
        { 
          error: 'ValidationError', 
          details: [{ 
            message: 'Both assetId and scenarioId query parameters are required' 
          }] 
        },
        { status: 400 }
      );
    }
    
    // Validate IDs
    const assetIdValidation = z.string().cuid().safeParse(assetId);
    if (!assetIdValidation.success) {
      return badRequest(assetIdValidation.error, logger);
    }
    
    const scenarioIdValidation = z.string().cuid().safeParse(scenarioId);
    if (!scenarioIdValidation.success) {
      return badRequest(scenarioIdValidation.error, logger);
    }
    
    // Check if asset exists
    const assetExists = await assetRepository.assetExists(assetId);
    if (!assetExists) {
      return notFound('Asset not found', logger);
    }
    
    // Check if scenario exists
    const scenarioExists = await scenarioRepository.scenarioExists(scenarioId);
    if (!scenarioExists) {
      return notFound('Scenario not found', logger);
    }
    
    // Check if user has access to both the asset and scenario
    const hasAssetViewAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
    if (!hasAssetViewAccess) {
      return forbidden('You do not have access to this asset', logger);
    }
    
    const hasScenarioViewAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
    if (!hasScenarioViewAccess) {
      return forbidden('You do not have access to this scenario', logger);
    }
    
    // Get matrix result
    const result = await matrixRepository.getMatrixResult(assetId, scenarioId);
    
    if (!result) {
      return notFound('Matrix analysis result not found', logger);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
