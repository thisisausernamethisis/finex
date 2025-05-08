import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { MatrixRepository } from '../../../lib/repositories/matrixRepository';
import { AssetRepository } from '../../../lib/repositories/assetRepository';
import { ScenarioRepository } from '../../../lib/repositories/scenarioRepository';
import { AccessRole, hasAssetAccess, hasScenarioAccess } from '../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../lib/logger';
import { badRequest, forbidden, serverError, unauthorized } from '../../../lib/utils/http';
import { getQueryOptions, validateSchema, withPagination } from '../../../lib/utils/api';

// Create route-specific loggers
const listLogger = createChildLogger({ route: 'GET /api/matrix' });
const createLogger = createChildLogger({ route: 'POST /api/matrix' });

// Schema validation for queueing a matrix analysis
const queueMatrixSchema = z.object({
  assetId: z.string().cuid(),
  scenarioId: z.string().cuid()
});

// Create repositories
const matrixRepository = new MatrixRepository();
const assetRepository = new AssetRepository();
const scenarioRepository = new ScenarioRepository();

// Handler for GET /api/matrix
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', listLogger);
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const queryOptions = getQueryOptions(url);
    const assetId = url.searchParams.get('assetId');
    const scenarioId = url.searchParams.get('scenarioId');
    
    // If assetId is provided, validate it
    if (assetId) {
      const assetIdValidation = z.string().cuid().safeParse(assetId);
      if (!assetIdValidation.success) {
        return badRequest(assetIdValidation.error, listLogger);
      }
      
      // Check if asset exists
      const assetExists = await assetRepository.assetExists(assetId);
      if (!assetExists) {
        return NextResponse.json(
          { error: 'NotFoundError', message: 'Asset not found' },
          { status: 404 }
        );
      }
      
      // Check if user has access to this asset
      const hasAccess = await hasAssetAccess(user.id, assetId, AccessRole.VIEWER);
      if (!hasAccess) {
        return forbidden('You do not have access to this asset', listLogger);
      }
    }
    
    // If scenarioId is provided, validate it
    if (scenarioId) {
      const scenarioIdValidation = z.string().cuid().safeParse(scenarioId);
      if (!scenarioIdValidation.success) {
        return badRequest(scenarioIdValidation.error, listLogger);
      }
      
      // Check if scenario exists
      const scenarioExists = await scenarioRepository.scenarioExists(scenarioId);
      if (!scenarioExists) {
        return NextResponse.json(
          { error: 'NotFoundError', message: 'Scenario not found' },
          { status: 404 }
        );
      }
      
      // Check if user has access to this scenario
      const hasAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.VIEWER);
      if (!hasAccess) {
        return forbidden('You do not have access to this scenario', listLogger);
      }
    }
    
    // Use withPagination utility
    const paginationResult = await withPagination(
      queryOptions,
      (page, limit) => matrixRepository.listMatrixResults(
        user.id, 
        page, 
        limit,
        assetId || undefined,
        scenarioId || undefined
      ),
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

// Handler for POST /api/matrix
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', createLogger);
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate using zod schema
    const validation = validateSchema(queueMatrixSchema, body, createLogger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    const { assetId, scenarioId } = validation.data;
    
    // Check if asset exists
    const assetExists = await assetRepository.assetExists(assetId);
    if (!assetExists) {
      return NextResponse.json(
        { error: 'NotFoundError', message: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Check if scenario exists
    const scenarioExists = await scenarioRepository.scenarioExists(scenarioId);
    if (!scenarioExists) {
      return NextResponse.json(
        { error: 'NotFoundError', message: 'Scenario not found' },
        { status: 404 }
      );
    }
    
    // Check if user has EDITOR access to both the asset and scenario
    const hasAssetEditorAccess = await hasAssetAccess(user.id, assetId, AccessRole.EDITOR);
    if (!hasAssetEditorAccess) {
      return forbidden('You do not have editor access to this asset', createLogger);
    }
    
    const hasScenarioEditorAccess = await hasScenarioAccess(user.id, scenarioId, AccessRole.EDITOR);
    if (!hasScenarioEditorAccess) {
      return forbidden('You do not have editor access to this scenario', createLogger);
    }
    
    // Queue matrix analysis job
    const result = await matrixRepository.queueMatrixAnalysis(assetId, scenarioId);
    
    // Return the job information
    return NextResponse.json({
      assetId,
      scenarioId,
      jobId: result.jobId,
      status: result.status
    }, { status: 202 }); // 202 Accepted, as processing will happen asynchronously
  } catch (error) {
    createLogger.error('Error queueing matrix analysis', { error });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), createLogger);
  }
}
