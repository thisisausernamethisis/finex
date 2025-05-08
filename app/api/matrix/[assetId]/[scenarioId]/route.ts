import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { MatrixRepository } from '../../../../../lib/repositories/matrixRepository';
import { AssetRepository } from '../../../../../lib/repositories/assetRepository';
import { ScenarioRepository } from '../../../../../lib/repositories/scenarioRepository';
import { AccessRole, hasAssetAccess, hasScenarioAccess } from '../../../../../lib/services/accessControlService';
import { createChildLogger } from '../../../../../lib/logger';
import { forbidden, notFound, serverError, unauthorized } from '../../../../../lib/utils/http';
import { httpRequestsTotal, httpRequestDuration } from '../../../../../lib/metrics';

// Create route-specific logger
const logger = createChildLogger({ route: 'GET /api/matrix/[assetId]/[scenarioId]' });

// Create repositories
const matrixRepository = new MatrixRepository();
const assetRepository = new AssetRepository();
const scenarioRepository = new ScenarioRepository();

/**
 * GET /api/matrix/[assetId]/[scenarioId]
 * Retrieves the matrix analysis result for a specific asset-scenario pair
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { assetId: string; scenarioId: string } }
) {
  const startTime = Date.now();
  
  try {
    const { assetId, scenarioId } = params;
    
    // Authenticate user
    const user = await currentUser();
    
    if (!user) {
      httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 401 });
      return unauthorized('Authentication required', logger);
    }
    
    // Check if asset exists
    const assetExists = await assetRepository.assetExists(assetId);
    if (!assetExists) {
      httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 404 });
      return notFound('Asset not found', logger);
    }
    
    // Check if scenario exists
    const scenarioExists = await scenarioRepository.scenarioExists(scenarioId);
    if (!scenarioExists) {
      httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 404 });
      return notFound('Scenario not found', logger);
    }
    
    // Check if user has access to both the asset and scenario
    const hasAssetViewAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
    if (!hasAssetViewAccess) {
      httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 403 });
      return forbidden('You do not have access to this asset', logger);
    }
    
    const hasScenarioViewAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
    if (!hasScenarioViewAccess) {
      httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 403 });
      return forbidden('You do not have access to this scenario', logger);
    }
    
    // Get matrix result
    const result = await matrixRepository.getMatrixResult(assetId, scenarioId);
    
    if (!result) {
      httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 404 });
      return notFound('Matrix analysis result not found', logger);
    }
    
    // Record metrics
    httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 200 });
    httpRequestDuration.set({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId' }, (Date.now() - startTime) / 1000);
    
    return NextResponse.json(result);
  } catch (error) {
    httpRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 500 });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  } finally {
    httpRequestDuration.set({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId' }, (Date.now() - startTime) / 1000);
  }
}
