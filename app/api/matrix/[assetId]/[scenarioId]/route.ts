import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { MatrixRepository } from '../../../../../lib/repositories/matrixRepository';
import { AssetRepository } from '../../../../../lib/repositories/assetRepository';
import { ScenarioRepository } from '../../../../../lib/repositories/scenarioRepository';
import { AccessRole, hasAssetAccess, hasScenarioAccess } from '../../../../../lib/services/accessControlService';
import { createChildLogger } from '../../../../../lib/logger';
import { forbidden, notFound, serverError, unauthorized } from '../../../../../lib/utils/http';
import { apiRequestsTotal, apiRequestDuration } from '../../../../../lib/metrics';

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
      apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 401 });
      return unauthorized('Authentication required', logger);
    }
    
    // Check if asset exists
    const assetExists = await assetRepository.assetExists(assetId);
    if (!assetExists) {
      apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 404 });
      return notFound('Asset not found', logger);
    }
    
    // Check if scenario exists
    const scenarioExists = await scenarioRepository.scenarioExists(scenarioId);
    if (!scenarioExists) {
      apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 404 });
      return notFound('Scenario not found', logger);
    }
    
    // Check if user has access to both the asset and scenario
    const hasAssetViewAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
    if (!hasAssetViewAccess) {
      apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 403 });
      return forbidden('You do not have access to this asset', logger);
    }
    
    const hasScenarioViewAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
    if (!hasScenarioViewAccess) {
      apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 403 });
      return forbidden('You do not have access to this scenario', logger);
    }
    
    // Get matrix result
    const result = await matrixRepository.getMatrixResult(assetId, scenarioId);
    
    if (!result) {
      apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 404 });
      return notFound('Matrix analysis result not found', logger);
    }
    
    // Record metrics
    apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 200 });
    apiRequestDuration.set({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId' }, (Date.now() - startTime) / 1000);
    
    return NextResponse.json(result);
  } catch (error) {
    apiRequestsTotal.inc({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId', status: 500 });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  } finally {
    apiRequestDuration.set({ method: 'GET', path: '/api/matrix/:assetId/:scenarioId' }, (Date.now() - startTime) / 1000);
  }
}

/**
 * POST /api/matrix/[assetId]/[scenarioId]
 * Triggers a new matrix analysis for a specific asset-scenario pair
 * Optionally accepts a search query for evidence retrieval
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { assetId: string; scenarioId: string } }
) {
  const startTime = Date.now();
  const routePath = '/api/matrix/:assetId/:scenarioId';
  
  try {
    const { assetId, scenarioId } = params;
    
    // Parse request body for query (optional)
    const body = await req.json().catch(() => ({}));
    const query = body.query?.trim() || undefined;
    
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 401 });
      return unauthorized('Authentication required', logger);
    }
    
    // Check if asset exists
    const assetExists = await assetRepository.assetExists(assetId);
    if (!assetExists) {
      apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 404 });
      return notFound('Asset not found', logger);
    }
    
    // Check if scenario exists
    const scenarioExists = await scenarioRepository.scenarioExists(scenarioId);
    if (!scenarioExists) {
      apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 404 });
      return notFound('Scenario not found', logger);
    }
    
    // Check if user has access to both the asset and scenario
    const hasAssetEditAccess = await hasAssetAccess(user.id, assetId, AccessRole.EDITOR);
    if (!hasAssetEditAccess) {
      apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 403 });
      return forbidden('You do not have edit access to this asset', logger);
    }
    
    const hasScenarioEditAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.EDITOR);
    if (!hasScenarioEditAccess) {
      apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 403 });
      return forbidden('You do not have edit access to this scenario', logger);
    }
    
    // Initiate matrix analysis
    const job = await matrixRepository.queueMatrixAnalysis(assetId, scenarioId, query);
    
    // Record metrics
    apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 202 });
    apiRequestDuration.set({ method: 'POST', path: routePath }, (Date.now() - startTime) / 1000);
    
    // Return job info
    return NextResponse.json(
      {
        message: 'Matrix analysis queued',
        jobId: job.jobId,
        status: job.status
      },
      { status: 202 }
    );
  } catch (error) {
    logger.error('Error queueing matrix analysis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ...params
    });
    
    apiRequestsTotal.inc({ method: 'POST', path: routePath, status: 500 });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  } finally {
    apiRequestDuration.set({ method: 'POST', path: routePath }, (Date.now() - startTime) / 1000);
  }
}
