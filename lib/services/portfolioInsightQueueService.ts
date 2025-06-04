import { Queue } from 'bullmq';
import { logger } from '../logger';

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'PortfolioInsightQueueService' });

// Redis connection options
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Queue name (matches worker queue name)
const QUEUE_NAME = 'portfolio-insights';

// Create the portfolio insights queue
export const portfolioInsightQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000 // Start with 5 second delay, exponentially increase
    }
  }
});

// Job data interface (matching worker interface)
interface PortfolioInsightJobData {
  userId: string;
  triggerReason: 'asset_added' | 'asset_categorized' | 'asset_removed' | 'manual_refresh' | 'scheduled';
  metadata?: {
    assetId?: string;
    assetName?: string;
    category?: string;
  };
}

/**
 * Portfolio Insight Queue Service
 */
export class PortfolioInsightQueueService {
  
  /**
   * Queue a portfolio analysis job for a user
   */
  async queuePortfolioAnalysis(
    userId: string,
    triggerReason: PortfolioInsightJobData['triggerReason'],
    metadata?: PortfolioInsightJobData['metadata']
  ): Promise<string> {
    try {
      const jobData: PortfolioInsightJobData = {
        userId,
        triggerReason,
        metadata
      };
      
      // Create job with unique ID to prevent duplicates
      const jobId = `portfolio-insights:${userId}:${Date.now()}`;
      
      const job = await portfolioInsightQueue.add(
        'analyze-portfolio',
        jobData,
        {
          jobId,
          delay: this.calculateJobDelay(triggerReason),
          priority: this.calculateJobPriority(triggerReason)
        }
      );
      
      serviceLogger.info('Portfolio insight job queued', {
        jobId: job.id,
        userId,
        triggerReason,
        metadata
      });
      
      return job.id || jobId;
      
    } catch (error) {
      serviceLogger.error('Failed to queue portfolio insight job', {
        userId,
        triggerReason,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Queue analysis when an asset is added
   */
  async queueOnAssetAdded(userId: string, assetId: string, assetName: string): Promise<string> {
    return this.queuePortfolioAnalysis(userId, 'asset_added', {
      assetId,
      assetName
    });
  }
  
  /**
   * Queue analysis when an asset is categorized
   */
  async queueOnAssetCategorized(
    userId: string, 
    assetId: string, 
    assetName: string, 
    category: string
  ): Promise<string> {
    return this.queuePortfolioAnalysis(userId, 'asset_categorized', {
      assetId,
      assetName,
      category
    });
  }
  
  /**
   * Queue analysis when an asset is removed
   */
  async queueOnAssetRemoved(userId: string, assetId: string, assetName: string): Promise<string> {
    return this.queuePortfolioAnalysis(userId, 'asset_removed', {
      assetId,
      assetName
    });
  }
  
  /**
   * Queue manual refresh of portfolio analysis
   */
  async queueManualRefresh(userId: string): Promise<string> {
    return this.queuePortfolioAnalysis(userId, 'manual_refresh');
  }
  
  /**
   * Queue scheduled portfolio analysis
   */
  async queueScheduledAnalysis(userId: string): Promise<string> {
    return this.queuePortfolioAnalysis(userId, 'scheduled');
  }
  
  /**
   * Get job status by job ID
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';
    progress?: number;
    data?: any;
    error?: string;
  }> {
    try {
      const job = await portfolioInsightQueue.getJob(jobId);
      
      if (!job) {
        return { status: 'unknown' };
      }
      
      const state = await job.getState();
      const progress = job.progress;
      
      let result: any = {
        status: state,
        progress: typeof progress === 'number' ? progress : undefined
      };
      
      if (state === 'completed') {
        result.data = job.returnvalue;
      } else if (state === 'failed') {
        result.error = job.failedReason;
      }
      
      return result;
      
    } catch (error) {
      serviceLogger.error('Failed to get job status', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { status: 'unknown' };
    }
  }
  
  /**
   * Get recent portfolio insight jobs for a user
   */
  async getUserPortfolioJobs(userId: string, limit: number = 10): Promise<Array<{
    id: string;
    status: string;
    triggerReason: string;
    createdAt: Date;
    completedAt?: Date;
    data?: any;
    error?: string;
  }>> {
    try {
      // Get recent jobs from the queue
      const jobs = await portfolioInsightQueue.getJobs(
        ['completed', 'failed', 'active', 'waiting'],
        0,
        limit * 2 // Get more than needed to filter by user
      );
      
      // Filter jobs for this user and format response
      const userJobs = jobs
        .filter(job => job.data?.userId === userId)
        .slice(0, limit)
        .map(job => ({
          id: job.id || 'unknown',
          status: job.opts?.delay ? 'delayed' : 'unknown',
          triggerReason: job.data?.triggerReason || 'unknown',
          createdAt: new Date(job.timestamp),
          completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
          data: job.returnvalue,
          error: job.failedReason
        }));
      
      return userJobs;
      
    } catch (error) {
      serviceLogger.error('Failed to get user portfolio jobs', {
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }
  
  /**
   * Cancel a pending portfolio insight job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await portfolioInsightQueue.getJob(jobId);
      
      if (!job) {
        serviceLogger.warn('Job not found for cancellation', { jobId });
        return false;
      }
      
      await job.remove();
      
      serviceLogger.info('Portfolio insight job cancelled', { jobId });
      return true;
      
    } catch (error) {
      serviceLogger.error('Failed to cancel job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        portfolioInsightQueue.getWaiting(),
        portfolioInsightQueue.getActive(),
        portfolioInsightQueue.getCompleted(),
        portfolioInsightQueue.getFailed(),
        portfolioInsightQueue.getDelayed()
      ]);
      
      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
      
    } catch (error) {
      serviceLogger.error('Failed to get queue stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
    }
  }
  
  /**
   * Calculate job delay based on trigger reason
   */
  private calculateJobDelay(triggerReason: PortfolioInsightJobData['triggerReason']): number {
    switch (triggerReason) {
      case 'manual_refresh':
        return 0; // Execute immediately
      case 'asset_added':
        return 2000; // 2 second delay to allow for batching
      case 'asset_categorized':
        return 1000; // 1 second delay
      case 'asset_removed':
        return 1000; // 1 second delay
      case 'scheduled':
        return 0; // Execute immediately for scheduled jobs
      default:
        return 5000; // 5 second default delay
    }
  }
  
  /**
   * Calculate job priority based on trigger reason
   */
  private calculateJobPriority(triggerReason: PortfolioInsightJobData['triggerReason']): number {
    switch (triggerReason) {
      case 'manual_refresh':
        return 10; // Highest priority
      case 'asset_categorized':
        return 8; // High priority (categorization affects analysis significantly)
      case 'asset_added':
        return 6; // Medium priority
      case 'asset_removed':
        return 6; // Medium priority
      case 'scheduled':
        return 3; // Lower priority
      default:
        return 5; // Default priority
    }
  }
}

// Export service instance
export const portfolioInsightQueueService = new PortfolioInsightQueueService(); 