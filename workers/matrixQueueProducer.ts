import { searchService } from '../lib/services/searchService';
import { matrixQueue } from './queues';
import { logger } from '../lib/logger';

// Logger for queue producer
const producerLogger = logger.child({ component: 'MatrixQueueProducer' });

interface SearchResult { 
  id: string; 
  score: number; 
}

/**
 * Enqueues a matrix analysis job with search-based diagnostics
 * This is the preferred entry point for new matrix analysis jobs
 * 
 * @param opts.assetId The asset ID to analyze
 * @param opts.scenarioId The scenario ID to analyze
 * @param opts.query Optional search query to use for retrieving evidence
 * @returns A promise that resolves when the job is added to the queue
 */
export async function enqueueMatrixJob(opts: {
  assetId: string;
  scenarioId: string;
  query: string;
}) {
  const { assetId, scenarioId, query } = opts;
  
  producerLogger.debug('Performing hybrid search for matrix job', { 
    assetId, 
    scenarioId, 
    query 
  });
  
  // Perform search with metrics tracking
  const results = await searchService.hybridSearch({
    query: opts.query,
    assetId: opts.assetId,
    scenarioId: opts.scenarioId,
    topK: 5
  });
  
  // Support both old and new diagnostic property names for backward compatibility
  // retrievalVariance is the new property name, retrievalVar is the legacy name
  // TODO: After next minor release, remove legacy "retrievalVar" support
  const retrievalVariance = (results as any).retrievalVariance ?? (results as any).retrievalVar ?? 0.5;
  // rankCorrelation is the new property name, rankCorr is the legacy name
  // TODO: After next minor release, remove legacy "rankCorr" support
  const rankCorrelation = (results as any).rankCorrelation ?? (results as any).rankCorr ?? 0.5;
  
  producerLogger.debug('Search metrics collected for matrix job', {
    retrievalVariance,
    rankCorrelation,
    resultsCount: results.length
  });
  
  // Add job to the queue with the search metrics
  await matrixQueue.add('matrix-run', {
    assetId: opts.assetId,
    scenarioId: opts.scenarioId,
    chunks: results.slice(0, 3),  // Use top 3 chunks as evidence
    retrievalVariance,
    retrievalVar: retrievalVariance,  // Add legacy name
    rankCorrelation,
    rankCorr: rankCorrelation,  // Add legacy name
  });
  
  producerLogger.info('Matrix job enqueued with search metrics', {
    assetId,
    scenarioId,
    metricsIncluded: true
  });
}
