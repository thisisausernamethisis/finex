import { Queue } from 'bullmq';
import { prisma } from '../db';
import { logger } from '../logger';

// Create logger for categorization service
const serviceLogger = logger.child({ component: 'CategorizationService' });

// Redis connection
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create queue instance
const techCategorizationQueue = new Queue('tech-categorization', { connection: redisConnection });

export interface CategorizationJobRequest {
  assetId: string;
  forceRecategorize?: boolean;
  priority?: number;
}

export interface CategorizationJobStatus {
  jobId: string;
  assetId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress?: number;
  result?: {
    category: string;
    confidence: number;
    insights: any;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Queue an asset for technology categorization
 */
export async function queueAssetForCategorization(
  request: CategorizationJobRequest
): Promise<{ jobId: string; position: number }> {
  try {
    const job = await techCategorizationQueue.add(
      'categorize-asset',
      {
        assetId: request.assetId,
        forceRecategorize: request.forceRecategorize || false
      },
      {
        priority: request.priority || 1,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 100
      }
    );
    
    // Get position in queue
    const waiting = await techCategorizationQueue.getWaiting();
    const position = waiting.findIndex(j => j.id === job.id) + 1;
    
    serviceLogger.info('Asset categorization job queued', {
      jobId: job.id,
      assetId: request.assetId,
      position
    });
    
    return {
      jobId: job.id!,
      position
    };
    
  } catch (error) {
    serviceLogger.error('Failed to queue categorization job', {
      assetId: request.assetId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get categorization job status
 */
export async function getCategorizationJobStatus(jobId: string): Promise<CategorizationJobStatus | null> {
  try {
    const job = await techCategorizationQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }
    
    const state = await job.getState();
    const progress = job.progress as number;
    
    let result = undefined;
    let error = undefined;
    
    if (state === 'completed' && job.returnvalue) {
      result = {
        category: job.returnvalue.category,
        confidence: job.returnvalue.confidence,
        insights: job.returnvalue.insights
      };
    }
    
    if (state === 'failed' && job.failedReason) {
      error = job.failedReason;
    }
    
    return {
      jobId: job.id!,
      assetId: job.data.assetId,
      status: state as any,
      progress,
      result,
      error,
      createdAt: new Date(job.timestamp),
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined
    };
    
  } catch (error) {
    serviceLogger.error('Failed to get job status', {
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Get categorization queue statistics
 */
export async function getCategorizationQueueStats() {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      techCategorizationQueue.getWaiting(),
      techCategorizationQueue.getActive(),
      techCategorizationQueue.getCompleted(),
      techCategorizationQueue.getFailed()
    ]);
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
    
  } catch (error) {
    serviceLogger.error('Failed to get queue stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Bulk categorize multiple assets
 */
export async function bulkCategorizeAssets(
  assetIds: string[],
  forceRecategorize = false,
  priority = 1
): Promise<{ jobIds: string[]; totalQueued: number }> {
  try {
    const jobs = await Promise.all(
      assetIds.map(assetId => 
        queueAssetForCategorization({ assetId, forceRecategorize, priority })
      )
    );
    
    const jobIds = jobs.map(job => job.jobId);
    
    serviceLogger.info('Bulk categorization jobs queued', {
      totalAssets: assetIds.length,
      totalQueued: jobIds.length,
      forceRecategorize
    });
    
    return {
      jobIds,
      totalQueued: jobIds.length
    };
    
  } catch (error) {
    serviceLogger.error('Failed to bulk queue categorization jobs', {
      totalAssets: assetIds.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get assets that need categorization (no category or low confidence)
 */
export async function getAssetsNeedingCategorization(
  userId: string,
  minConfidence = 0.8
): Promise<Array<{ id: string; name: string; category: string | null; categoryConfidence: number | null }>> {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        userId,
        OR: [
          { category: null },
          { categoryConfidence: { lt: minConfidence } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        categoryConfidence: true
      },
      orderBy: [
        { categoryConfidence: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    serviceLogger.info('Found assets needing categorization', {
      userId,
      count: assets.length,
      minConfidence
    });
    
    return assets;
    
  } catch (error) {
    serviceLogger.error('Failed to get assets needing categorization', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Auto-categorize all user assets that need it
 */
export async function autoCategorizeUserAssets(
  userId: string,
  minConfidence = 0.8,
  forceRecategorize = false
): Promise<{ jobIds: string[]; totalQueued: number }> {
  try {
    const assetsNeedingCategorization = await getAssetsNeedingCategorization(userId, minConfidence);
    
    if (assetsNeedingCategorization.length === 0) {
      serviceLogger.info('No assets need categorization', { userId });
      return { jobIds: [], totalQueued: 0 };
    }
    
    const assetIds = assetsNeedingCategorization.map(asset => asset.id);
    const result = await bulkCategorizeAssets(assetIds, forceRecategorize, 2); // Higher priority for auto-categorization
    
    serviceLogger.info('Auto-categorization initiated for user', {
      userId,
      assetsFound: assetsNeedingCategorization.length,
      jobsQueued: result.totalQueued
    });
    
    return result;
    
  } catch (error) {
    serviceLogger.error('Failed to auto-categorize user assets', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
} 