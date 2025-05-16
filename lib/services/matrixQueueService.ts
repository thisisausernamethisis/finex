import { Queue } from 'bullmq';
import { searchService } from './searchService';
import { logger } from '../logger';

// Logger for this service
const serviceLogger = logger.child({ component: 'MatrixQueueService' });

// Redis connection options for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Initialize the matrix queue
const matrixQueue = new Queue('matrix-analysis', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 100
  }
});

/**
 * Service for enqueueing matrix analysis jobs
 * Enhanced with search service metrics for confidence calculation
 */
export const matrixQueueService = {
  /**
   * Enqueues a matrix job with search diagnostics
   * 
   * @param assetId The asset ID to analyze
   * @param scenarioId The scenario ID to analyze
   * @param query Optional search query to use for retrieving evidence
   * @returns The job ID
   */
  async enqueueMatrixJob(opts: {
    assetId: string;
    scenarioId: string;
    query?: string;
  }): Promise<string> {
    const { assetId, scenarioId, query } = opts;
    
    // Default job data without search metrics
    let jobData: any = {
      assetId,
      scenarioId,
      retrievalVar: 0.5, // Default
      rankCorr: 0.5      // Default
    };
    
    // If a search query is provided, perform the search and collect metrics
    if (query) {
      serviceLogger.debug('Performing hybrid search for matrix job', { assetId, scenarioId, query });
      
      try {
        // Perform hybrid search
        const results = await searchService.hybridSearch({
          query,
          assetId,
          scenarioId,
          topK: 5
        });

        // Extract the top chunks for evidence
        const chunks = results.slice(0, 3);

        // Extract the metrics from the search results
        // The metrics are attached as non-enumerable properties
        const retrievalVar = (results as any).retrievalVar !== undefined ? (results as any).retrievalVar : 0.5;
        const rankCorr = (results as any).rankCorr !== undefined ? (results as any).rankCorr : 0.5;

        // Add search metrics to job data
        jobData = {
          ...jobData,
          chunks,
          retrievalVar,
          rankCorr
        };

        serviceLogger.debug('Search metrics collected for matrix job', {
          retrievalVar,
          rankCorr,
          numChunks: chunks.length
        });
      } catch (error) {
        serviceLogger.error('Failed to perform search for matrix job', {
          error: error instanceof Error ? error.message : 'Unknown error',
          assetId,
          scenarioId
        });
        // Continue with default metrics if search fails
      }
    }
    
    // Create a unique job ID
    const jobIdString = `matrix:${assetId}:${scenarioId}`;
    
    // Add job to queue
    const job = await matrixQueue.add('analyze', jobData, { jobId: jobIdString });
    
    serviceLogger.info('Matrix analysis job enqueued', {
      jobId: job.id || jobIdString,
      assetId,
      scenarioId,
      hasSearchMetrics: jobData.retrievalVar !== 0.5 || jobData.rankCorr !== 0.5
    });
    
    return job.id || jobIdString;
  }
};
