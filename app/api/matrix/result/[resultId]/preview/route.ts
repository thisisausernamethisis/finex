/**
 * Matrix Analysis Result Preview API
 * 
 * Provides a lightweight endpoint to access matrix result summaries
 * without requiring the full analysis data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../../../lib/db';
import { logger } from '../../../../../../lib/logger';
import { isOwner } from '../../../../../../lib/rbac';
import { MatrixResultPreviewSchema } from '../../../../../../lib/validators/matrix';
import { unauthorized, notFound, serverError, forbidden } from '../../../../../../lib/utils/http';

// Logger for this API route
const previewLogger = logger.child({ component: 'MatrixPreviewAPI' });

/**
 * GET handler for retrieving a matrix result preview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { resultId: string } }
): Promise<NextResponse> {
  try {
    // Get the user from auth
    const user = await currentUser();
    if (!user) {
      return unauthorized('You must be logged in to access this resource', previewLogger);
    }
    
    const userId = user.id;

    // Input validation
    const resultId = params.resultId;
    if (!resultId) {
      previewLogger.warn('Missing result ID', { userId });
      return NextResponse.json(
        { error: 'Missing result ID' },
        { status: 400 }
      );
    }

    // Get the matrix result, including minimal fields for preview
    const result = await prisma.matrixAnalysisResult.findUnique({
      where: {
        id: resultId,
      },
      include: {
        asset: {
          select: {
            userId: true,
            isPublic: true,
          },
        },
        scenario: {
          select: {
            id: true,
          },
        },
      },
    });

    // If no result found
    if (!result) {
      previewLogger.warn('Matrix result not found', { resultId, userId });
      return notFound('Matrix result not found', previewLogger);
    }

    // Check permissions - user must own the asset
    const hasAccess = isOwner(userId, { ownerId: result.asset.userId }) || result.asset.isPublic;

    if (!hasAccess) {
      previewLogger.warn('Unauthorized access to matrix result', { resultId, userId });
      return forbidden('You do not have permission to view this matrix result', previewLogger);
    }

    // Format response
    const response = {
      id: result.id,
      assetId: result.assetId,
      scenarioId: result.scenarioId,
      impact: result.impact,
      summary: result.summary,
      // Explicitly cast result to access the confidence field that exists in the database
      // but may not be reflected in the TypeScript definitions
      confidence: (result as any).confidence,
      status: result.status,
      completedAt: result.completedAt,
      updatedAt: result.updatedAt
    };

    previewLogger.info('Serving matrix result preview', { resultId, userId });
    return NextResponse.json(response);
  } catch (error) {
    previewLogger.error('Error in matrix preview endpoint', {
      error: error instanceof Error ? error.message : String(error),
      resultId: params.resultId,
    });

    return serverError(
      error instanceof Error ? error : new Error('Unknown error'),
      previewLogger
    );
  }
}
