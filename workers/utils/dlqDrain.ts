/**
 * Dead Letter Queue (DLQ) Drain Utility
 * 
 * Provides functionality to:
 * 1. Process failed jobs from worker queues
 * 2. Alert on high DLQ counts via Prometheus metrics
 * 3. Retry or archive failed jobs
 * 
 * This utility is used by workers to handle error conditions
 * and ensure unprocessable messages don't cause system failures.
 */

import { Queue, QueueEvents } from 'bullmq';
import { logger } from '../../lib/logger';
import { Counter, Gauge } from 'prom-client';
import { withSpan } from '../../lib/otel';

// Configure logger
const dlqLogger = logger.child({ component: 'DLQDrain' });

// Redis connection used by BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Prometheus metrics for DLQ monitoring
export const dlqSize = new Gauge({
  name: 'finex_dlq_size',
  help: 'Number of messages in each dead letter queue',
  labelNames: ['queue_name']
});

export const dlqProcessed = new Counter({
  name: 'finex_dlq_processed_total',
  help: 'Total number of messages processed from dead letter queues',
  labelNames: ['queue_name', 'outcome'] // outcome = 'retried', 'archived', 'failed'
});

/**
 * Interface for DLQ message metadata
 */
interface DLQMessageMetadata {
  originalQueue: string;
  failReason: string;
  failedAt: Date;
  attempts: number;
  originalJobId: string;
}

/**
 * Simplified Dead Letter Queue Manager
 * Handles creating, monitoring, and processing DLQs without QueueScheduler dependency
 */
export class DLQManager {
  private dlqName: string;
  private originalQueueName: string;
  private dlq: Queue;
  private dlqEvents: QueueEvents;
  
  /**
   * Create a new DLQ manager
   * 
   * @param queueName The original queue name
   */
  constructor(queueName: string) {
    this.originalQueueName = queueName;
    this.dlqName = `${queueName}-dlq`;
    
    // Create queue instances
    this.dlq = new Queue(this.dlqName, { connection: redisConnection });
    
    // Set up queue events for monitoring
    this.dlqEvents = new QueueEvents(this.dlqName, { connection: redisConnection });
    
    // Set up event handlers
    this.setupEventHandlers();
    
    dlqLogger.info(`Initialized DLQ manager for queue: ${queueName}`);
  }
  
  /**
   * Set up event handlers for monitoring
   */
  private setupEventHandlers(): void {
    // Update metrics on queue size changes
    this.dlqEvents.on('added', async () => {
      try {
        const count = await this.dlq.count();
        dlqSize.set({ queue_name: this.originalQueueName }, count);
        
        // Log DLQ size when it grows
        dlqLogger.info(`DLQ size for ${this.originalQueueName}: ${count}`);
      } catch (error) {
        dlqLogger.error('Error updating DLQ metrics', { error });
      }
    });
    
    this.dlqEvents.on('removed', async () => {
      try {
        const count = await this.dlq.count();
        dlqSize.set({ queue_name: this.originalQueueName }, count);
      } catch (error) {
        dlqLogger.error('Error updating DLQ metrics', { error });
      }
    });
  }
  
  /**
   * Send a failed job to the dead letter queue
   * 
   * @param jobId ID of the failed job
   * @param data Job data
   * @param failReason Reason for failure
   * @param attempts Number of attempts made
   */
  async sendToDLQ(
    jobId: string,
    data: any,
    failReason: string,
    attempts: number
  ): Promise<string> {
    return withSpan('dlq.send', async () => {
      // Create metadata for the DLQ job
      const metadata: DLQMessageMetadata = {
        originalQueue: this.originalQueueName,
        failReason,
        failedAt: new Date(),
        attempts,
        originalJobId: jobId
      };
      
      // Add job to DLQ with metadata
      const dlqJob = await this.dlq.add('failed', {
        data,
        metadata
      });
      
      dlqLogger.info(`Sent job to DLQ: ${this.dlqName}`, {
        jobId,
        dlqJobId: dlqJob.id,
        failReason
      });
      
      // Update metrics
      const count = await this.dlq.count();
      dlqSize.set({ queue_name: this.originalQueueName }, count);
      
      return dlqJob.id || '';  // Return empty string as fallback to avoid undefined
    });
  }
  
  /**
   * Process messages from the DLQ
   * 
   * @param processFn Optional function to process DLQ messages
   * @param batchSize Number of messages to process in one batch
   */
  async drainDLQ(
    processFn?: (job: any) => Promise<'retry' | 'archive' | 'leave'>,
    batchSize: number = 10
  ): Promise<{
    processed: number;
    retried: number;
    archived: number;
    failed: number;
  }> {
    return withSpan('dlq.drain', async () => {
      let processed = 0;
      let retried = 0;
      let archived = 0;
      let failed = 0;
      
      dlqLogger.info(`Starting DLQ drain for ${this.dlqName}`);
      
      // Get jobs from DLQ
      const jobs = await this.dlq.getJobs(['waiting', 'active', 'delayed'], 0, batchSize);
      
      if (jobs.length === 0) {
        dlqLogger.info(`No jobs in DLQ ${this.dlqName}`);
        return { processed, retried, archived, failed };
      }
      
      // Process each job
      for (const job of jobs) {
        try {
          processed++;
          
          // If custom processor provided, use it
          if (processFn) {
            const result = await processFn(job);
            
            switch (result) {
              case 'retry':
                await this.retryJob(job);
                retried++;
                break;
              case 'archive':
                await this.archiveJob(job);
                archived++;
                break;
              case 'leave':
                // Do nothing, leave in DLQ
                break;
            }
          } else {
            // Default: just log and archive
            dlqLogger.info(`Archiving job from DLQ ${this.dlqName}`, {
              jobId: job.id,
              data: job.data
            });
            
            await this.archiveJob(job);
            archived++;
          }
        } catch (error) {
          dlqLogger.error(`Error processing DLQ job ${job.id}`, {
            error: error instanceof Error ? error.message : String(error),
            jobId: job.id
          });
          failed++;
        }
      }
      
      // Update metrics
      dlqProcessed.inc({ queue_name: this.originalQueueName, outcome: 'retried' }, retried);
      dlqProcessed.inc({ queue_name: this.originalQueueName, outcome: 'archived' }, archived);
      dlqProcessed.inc({ queue_name: this.originalQueueName, outcome: 'failed' }, failed);
      
      dlqLogger.info(`Completed DLQ drain for ${this.dlqName}`, {
        processed,
        retried,
        archived,
        failed
      });
      
      return { processed, retried, archived, failed };
    });
  }
  
  /**
   * Retry a job from the DLQ by sending it back to the original queue
   * 
   * @param job The job to retry
   */
  private async retryJob(job: any): Promise<void> {
    const metadata = job.data.metadata || {};
    const originalQueue = metadata.originalQueue || '';
    const originalJobId = metadata.originalJobId || job.id || 'unknown';
    
    if (!originalQueue) {
      throw new Error('Cannot retry job: missing original queue info');
    }
    
    // Create a new job in the original queue
    const origQueue = new Queue(originalQueue, { connection: redisConnection });
    
    await origQueue.add(
      job.name || 'default',
      job.data.data || {},
      {
        jobId: `retry-${originalJobId}`,
        attempts: 3
      }
    );
    
    dlqLogger.info(`Retried job from DLQ`, {
      dlqJobId: job.id,
      originalQueue,
      originalJobId
    });
    
    // Remove from DLQ
    await job.remove();
  }
  
  /**
   * Archive a job from the DLQ
   * 
   * @param job The job to archive
   */
  private async archiveJob(job: any): Promise<void> {
    // In a real implementation, you might store this in a database
    // For now, we'll just log it and remove from the queue
    dlqLogger.info(`Archived job from DLQ`, {
      dlqJobId: job.id,
      jobData: job.data
    });
    
    // Remove from DLQ
    await job.remove();
  }
  
  /**
   * Get the current size of the DLQ
   */
  async getSize(): Promise<number> {
    return this.dlq.count();
  }
  
  /**
   * Close the DLQ and clean up resources
   */
  async close(): Promise<void> {
    await Promise.all([
      this.dlq.close(),
      this.dlqEvents.close()
    ]);
    
    dlqLogger.info(`Closed DLQ manager for queue: ${this.originalQueueName}`);
  }
}

/**
 * Factory function to create a DLQ manager
 * 
 * @param queueName The original queue name
 */
export function createDLQManager(queueName: string): DLQManager {
  return new DLQManager(queueName);
}
