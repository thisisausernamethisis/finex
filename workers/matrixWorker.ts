import { Worker, Job } from 'bullmq';
import { matrixCalculationService } from '../lib/services/matrixCalculationService';
import { logger } from '../lib/logger';
import Redis from 'ioredis';

// Redis connection for BullMQ - disabled for Vercel deployment
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Create a worker-specific logger
const workerLogger = logger.child({ service: 'MatrixWorker' });

// Job types for matrix calculations
export interface MatrixCalculationJobData {
  userId: string;
  trigger: 'asset_added' | 'asset_categorized' | 'asset_removed' | 'scenario_updated' | 'manual_refresh';
  metadata?: {
    assetId?: string;
    scenarioId?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

/**
 * Matrix calculation worker
 * Processes background matrix calculations when portfolio changes occur
 */
let matrixWorker: Worker<MatrixCalculationJobData> | null = null;

export function startMatrixWorker(): Worker<MatrixCalculationJobData> {
  if (matrixWorker) {
    return matrixWorker;
  }
  
  matrixWorker = new Worker<MatrixCalculationJobData>(
    'matrixCalculation',
    async (job: Job<MatrixCalculationJobData>) => {
    const { userId, trigger, metadata } = job.data;
    
    workerLogger.info('Processing matrix calculation job', {
      jobId: job.id,
      userId,
      trigger,
      metadata
    });
    
    try {
      const startTime = Date.now();
      
      // Perform matrix calculation
      const result = await matrixCalculationService.calculateUserMatrix(userId);
      
      const processingTime = Date.now() - startTime;
      
      // Log successful completion
      workerLogger.info('Matrix calculation job completed', {
        jobId: job.id,
        userId,
        trigger,
        processingTime,
        totalCalculations: result.calculations.length,
        averageImpact: result.portfolioAggregation.averageImpact,
        riskScore: result.portfolioAggregation.riskScore,
        opportunityScore: result.portfolioAggregation.opportunityScore
      });
      
      // Return job result for potential future use
      return {
        success: true,
        calculationId: `calc_${Date.now()}_${userId}`,
        portfolioMetrics: result.portfolioAggregation,
        processingTime,
        metadata: {
          calculatedAt: result.lastCalculatedAt,
          calculationVersion: result.calculationVersion,
          totalCalculations: result.calculations.length
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      workerLogger.error('Matrix calculation job failed', {
        jobId: job.id,
        userId,
        trigger,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Determine if this should retry
      if (errorMessage.includes('No categorized assets found')) {
        // Don't retry for missing data - user needs to add assets first
        workerLogger.warn('Skipping retry for missing assets', { userId });
        return {
          success: false,
          error: 'No categorized assets found',
          shouldRetry: false
        };
      } else if (errorMessage.includes('No scenarios found')) {
        // Don't retry for missing scenarios - system data issue
        workerLogger.warn('Skipping retry for missing scenarios', { userId });
        return {
          success: false,
          error: 'No scenarios found',
          shouldRetry: false
        };
      }
      
      // Rethrow for automatic retry handling
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // Process up to 3 matrix calculations simultaneously
    removeOnComplete: { count: 50 }, // Keep last 50 completed jobs
    removeOnFail: { count: 20 }, // Keep last 20 failed jobs
  }
);

    // Worker event handlers
  matrixWorker.on('completed', (job, result) => {
    workerLogger.info('Matrix calculation job completed successfully', {
      jobId: job.id,
      userId: job.data.userId,
      trigger: job.data.trigger,
      result: {
        success: result.success,
        processingTime: result.processingTime
      }
    });
  });

  matrixWorker.on('failed', (job, err) => {
    workerLogger.error('Matrix calculation job failed', {
      jobId: job?.id,
      userId: job?.data?.userId,
      trigger: job?.data?.trigger,
      error: err.message,
      attempts: job?.attemptsMade,
      maxAttempts: job?.opts?.attempts
    });
  });

  matrixWorker.on('stalled', (jobId) => {
    workerLogger.warn('Matrix calculation job stalled', { jobId });
  });

  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    workerLogger.info('Shutting down matrix worker...');
    if (matrixWorker) {
      await matrixWorker.close();
    }
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    workerLogger.info('Shutting down matrix worker...');
    if (matrixWorker) {
      await matrixWorker.close();
    }
    await redis.quit();
    process.exit(0);
  });

  workerLogger.info('Matrix calculation worker started', {
    queueName: 'matrixCalculation',
    concurrency: 3
  });

  return matrixWorker;
}

export function getMatrixWorker(): Worker<MatrixCalculationJobData> | null {
  return matrixWorker;
}

// Export processMatrixJob for testing
export async function processMatrixJob(job: Job<MatrixCalculationJobData>) {
  // This is the job processing logic extracted for testing
  const { userId, trigger, metadata } = job.data;
  
  workerLogger.info('Processing matrix calculation job', {
    jobId: job.id,
    userId,
    trigger,
    metadata
  });
  
  try {
    const startTime = Date.now();
    
    // Perform matrix calculation
    const result = await matrixCalculationService.calculateUserMatrix(userId);
    
    const processingTime = Date.now() - startTime;
    
    // Log successful completion
    workerLogger.info('Matrix calculation job completed', {
      jobId: job.id,
      userId,
      trigger,
      processingTime,
      totalCalculations: result.calculations.length,
      averageImpact: result.portfolioAggregation.averageImpact,
      riskScore: result.portfolioAggregation.riskScore,
      opportunityScore: result.portfolioAggregation.opportunityScore
    });
    
    // Return job result for potential future use
    return {
      success: true,
      calculationId: `calc_${Date.now()}_${userId}`,
      portfolioMetrics: result.portfolioAggregation,
      processingTime,
      metadata: {
        calculatedAt: result.lastCalculatedAt,
        calculationVersion: result.calculationVersion,
        totalCalculations: result.calculations.length
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    workerLogger.error('Matrix calculation job failed', {
      jobId: job.id,
      userId,
      trigger,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Determine if this should retry
    if (errorMessage.includes('No categorized assets found')) {
      // Don't retry for missing data - user needs to add assets first
      workerLogger.warn('Skipping retry for missing assets', { userId });
      return {
        success: false,
        error: 'No categorized assets found',
        shouldRetry: false
      };
    } else if (errorMessage.includes('No scenarios found')) {
      // Don't retry for missing scenarios - system data issue
      workerLogger.warn('Skipping retry for missing scenarios', { userId });
      return {
        success: false,
        error: 'No scenarios found',
        shouldRetry: false
      };
    }
    
    // Rethrow for automatic retry handling
    throw error;
  }
}
