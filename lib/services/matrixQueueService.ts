import { Queue } from 'bullmq';
import { logger } from '../logger';
import Redis from 'ioredis';
import type { MatrixCalculationJobData } from '../../workers/matrixWorker';

// Redis connection for BullMQ
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'MatrixQueueService' });

/**
 * Matrix Queue Service
 * Manages background job scheduling for matrix calculations
 */
export class MatrixQueueService {
  private queue: Queue<MatrixCalculationJobData>;

  constructor() {
    this.queue = new Queue<MatrixCalculationJobData>('matrixCalculation', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
      },
    });

    serviceLogger.info('Matrix queue service initialized');
  }

  /**
   * Queue a matrix calculation for when an asset is added
   */
  async queueAssetAddedCalculation(userId: string, assetId: string): Promise<void> {
    try {
      await this.queue.add(
        'asset_added',
        {
          userId,
          trigger: 'asset_added',
          metadata: {
            assetId,
            priority: 'normal'
          }
        },
        {
          priority: 10, // Normal priority
          delay: 2000, // Small delay to allow categorization to complete
        }
      );

      serviceLogger.info('Queued matrix calculation for asset added', {
        userId,
        assetId
      });
    } catch (error) {
      serviceLogger.error('Failed to queue asset added calculation', {
        userId,
        assetId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Queue a matrix calculation for when an asset is categorized
   */
  async queueAssetCategorizedCalculation(userId: string, assetId: string): Promise<void> {
    try {
      await this.queue.add(
        'asset_categorized',
        {
          userId,
          trigger: 'asset_categorized',
          metadata: {
            assetId,
            priority: 'high'
          }
        },
        {
          priority: 5, // Higher priority for categorization events
          delay: 1000, // Quick delay
        }
      );

      serviceLogger.info('Queued matrix calculation for asset categorized', {
        userId,
        assetId
      });
    } catch (error) {
      serviceLogger.error('Failed to queue asset categorized calculation', {
        userId,
        assetId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Queue a matrix calculation for when an asset is removed
   */
  async queueAssetRemovedCalculation(userId: string, assetId: string): Promise<void> {
    try {
      await this.queue.add(
        'asset_removed',
        {
          userId,
          trigger: 'asset_removed',
          metadata: {
            assetId,
            priority: 'normal'
          }
        },
        {
          priority: 10, // Normal priority
          delay: 500, // Quick recalculation
        }
      );

      serviceLogger.info('Queued matrix calculation for asset removed', {
        userId,
        assetId
      });
    } catch (error) {
      serviceLogger.error('Failed to queue asset removed calculation', {
        userId,
        assetId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Queue a matrix calculation for when scenarios are updated
   */
  async queueScenarioUpdatedCalculation(scenarioId: string, affectedUserIds?: string[]): Promise<void> {
    try {
      if (affectedUserIds && affectedUserIds.length > 0) {
        // Queue for specific users
        for (const userId of affectedUserIds) {
          await this.queue.add(
            'scenario_updated',
            {
              userId,
              trigger: 'scenario_updated',
              metadata: {
                scenarioId,
                priority: 'normal'
              }
            },
            {
              priority: 15, // Lower priority for scenario updates
              delay: 10000, // 10 second delay to batch scenario updates
            }
          );
        }

        serviceLogger.info('Queued matrix calculations for scenario updated', {
          scenarioId,
          affectedUsers: affectedUserIds.length
        });
      } else {
        serviceLogger.info('No users affected by scenario update', { scenarioId });
      }
    } catch (error) {
      serviceLogger.error('Failed to queue scenario updated calculations', {
        scenarioId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Queue a manual matrix calculation refresh
   */
  async queueManualRefresh(userId: string): Promise<void> {
    try {
      await this.queue.add(
        'manual_refresh',
        {
          userId,
          trigger: 'manual_refresh',
          metadata: {
            priority: 'high'
          }
        },
        {
          priority: 1, // Highest priority for manual requests
          delay: 0, // No delay for manual requests
        }
      );

      serviceLogger.info('Queued manual matrix calculation refresh', {
        userId
      });
    } catch (error) {
      serviceLogger.error('Failed to queue manual refresh', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();

      const stats = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };

      serviceLogger.debug('Queue statistics retrieved', stats);

      return stats;
    } catch (error) {
      serviceLogger.error('Failed to get queue statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Clear failed jobs (useful for maintenance)
   */
  async clearFailedJobs(): Promise<number> {
    try {
      const failedJobs = await this.queue.getFailed();
      let clearedCount = 0;

      for (const job of failedJobs) {
        await job.remove();
        clearedCount++;
      }

      serviceLogger.info('Cleared failed jobs', { clearedCount });

      return clearedCount;
    } catch (error) {
      serviceLogger.error('Failed to clear failed jobs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    try {
      await this.queue.pause();
      serviceLogger.info('Matrix calculation queue paused');
    } catch (error) {
      serviceLogger.error('Failed to pause queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    try {
      await this.queue.resume();
      serviceLogger.info('Matrix calculation queue resumed');
    } catch (error) {
      serviceLogger.error('Failed to resume queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if a user has pending calculations
   */
  async hasPendingCalculations(userId: string): Promise<boolean> {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();

      const userJobs = [...waiting, ...active].filter(job => 
        job.data.userId === userId
      );

      const hasPending = userJobs.length > 0;

      serviceLogger.debug('Checked pending calculations', {
        userId,
        hasPending,
        pendingCount: userJobs.length
      });

      return hasPending;
    } catch (error) {
      serviceLogger.error('Failed to check pending calculations', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false; // Assume no pending on error
    }
  }

  /**
   * Clean up completed jobs older than specified time
   */
  async cleanOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      await this.queue.clean(olderThanMs, 100, 'completed');
      await this.queue.clean(olderThanMs, 50, 'failed');

      serviceLogger.info('Cleaned old jobs', {
        olderThanMs,
        olderThanHours: olderThanMs / (60 * 60 * 1000)
      });
    } catch (error) {
      serviceLogger.error('Failed to clean old jobs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Export service instance
export const matrixQueueService = new MatrixQueueService(); 