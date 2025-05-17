import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createChildLogger } from '../../../lib/logger';
import { badRequest, serverError, unauthorized } from '../../../lib/utils/http';
import { searchService } from '../../../lib/services/searchService';

// Create route-specific logger
const searchLogger = createChildLogger({ route: 'GET /api/search' });

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', searchLogger);
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const assetId = url.searchParams.get('assetId') || undefined;
    const scenarioId = url.searchParams.get('scenarioId') || undefined;
    const domain = url.searchParams.get('domain') || undefined;
    
    // Validate required parameters
    if (!query) {
      return badRequest('Query parameter is required', searchLogger);
    }
    
    // Get search results
    const searchResults = await searchService.hybridSearch({
      query,
      assetId,
      scenarioId,
      domain: domain as any,
      limit: 20
    });
    
    // Format the response with confidence values
    // Since the hybridSearch only returns id and score, we'll simulate content and add confidence
    const formattedResults = searchResults.map(result => {
      // In a real implementation, we'd fetch the content from a repository
      // Here we're adding a placeholder and the confidence value with default of 0.5
      return {
        id: result.id,
        content: `Content for result ${result.id}`,
        score: result.score,
        confidence: 0.5 // Default confidence
      };
    });
    
    // Return the response
    return NextResponse.json({
      results: formattedResults,
      count: formattedResults.length
    });
  } catch (error) {
    searchLogger.error('Search error', { error });
    return serverError(error instanceof Error ? error : new Error('Unknown error'), searchLogger);
  }
}
