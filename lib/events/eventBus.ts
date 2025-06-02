// @ts-nocheck
/**
 * Event Bus Standardization (T-413)
 * 
 * This module provides a standardized event bus for domain events
 * using Redis Streams for reliable event distribution.
 */

import Redis from 'ioredis';
import { Queue, QueueEvents } from 'bullmq';
import { logger } from '../logger';

// Configure Redis connection
const redis = new Redis(process.env.REDIS_URL!);

// Configure logger
const eventLogger = logger.child({ component: 'EventBus' });

/**
 * Domain events supported by the system
 */
export enum DomainEvent {
  ASSET_CREATED = 'asset.created',
  ASSET_UPDATED = 'asset.updated',
  ASSET_DELETED = 'asset.deleted',
  THEME_CREATED = 'theme.created',
  FEEDBACK_RECEIVED = 'feedback.received',
  QUOTA_WARNING = 'quota.warning',
  QUALITY_DRIFT = 'quality.drift',
  SECURITY_ALERT = 'security.alert'
}

/**
 * Standard event payload structure
 */
interface EventPayload {
  userId: string;
  timestamp: Date;
  data: any;
}

/**
 * Event Bus for publishing and subscribing to domain events
 */
class EventBus {
  private queues: Map<string, Queue> = new Map();
  
  /**
   * Publish a domain event
   * 
   * @param event Domain event type
   * @param payload Event data payload
   */
  async publish(event: DomainEvent, payload: EventPayload): Promise<void> {
    const streamKey = `events:${event}`;
    
    try {
      // Publish to Redis Stream
      await redis.xadd(
        streamKey,
        '*',
        'userId', payload.userId,
        'timestamp', payload.timestamp.toISOString(),
        'data', JSON.stringify(payload.data)
      );

      // Also enqueue for specific workers
      await this.enqueueForWorkers(event, payload);
      
      eventLogger.info(`Published ${event}`, { userId: payload.userId });
    } catch (error) {
      eventLogger.error(`Error publishing ${event}:`, error);
      throw error;
    }
  }

  /**
   * Enqueue events for specific worker processing
   * 
   * @param event Domain event type
   * @param payload Event data payload
   */
  private async enqueueForWorkers(event: DomainEvent, payload: EventPayload) {
    const workerMappings: Record<DomainEvent, string[]> = {
      [DomainEvent.ASSET_CREATED]: ['summariser', 'theme-scout'],
      [DomainEvent.ASSET_UPDATED]: ['summariser', 'embed-refresh'],
      [DomainEvent.ASSET_DELETED]: [],
      [DomainEvent.THEME_CREATED]: ['theme-scout'],
      [DomainEvent.FEEDBACK_RECEIVED]: ['feedback-trainer'],
      [DomainEvent.QUOTA_WARNING]: ['notification'],
      [DomainEvent.QUALITY_DRIFT]: ['drift-monitor']
    };

    const workers = workerMappings[event] || [];
    
    for (const workerName of workers) {
      const queue = this.getQueue(workerName);
      await queue.add(event, payload, {
        removeOnComplete: true,
        removeOnFail: false
      });
    }
  }

  /**
   * Get or create a BullMQ queue for a worker
   * 
   * @param name Queue/worker name
   * @returns BullMQ queue instance
   */
  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: redis }));
    }
    return this.queues.get(name)!;
  }

  /**
   * Subscribe to a domain event
   * 
   * @param event Domain event type
   * @param handler Callback function to handle events
   */
  async subscribe(
    event: DomainEvent,
    handler: (payload: EventPayload) => Promise<void>
  ): Promise<void> {
    const streamKey = `events:${event}`;
    const consumerGroup = `${event}-consumers`;
    const consumerId = `consumer-${process.pid}`;

    // Create consumer group if it doesn't exist
    try {
      await redis.xgroup('CREATE', streamKey, consumerGroup, '0', 'MKSTREAM');
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) throw err;
    }

    // Start consuming
    setInterval(async () => {
      try {
        const messages = await redis.xreadgroup(
          'GROUP', consumerGroup, consumerId,
          'COUNT', '10',
          'BLOCK', '1000',
          'STREAMS', streamKey, '>'
        );

        if (messages && messages.length > 0) {
          for (const [stream, streamMessages] of messages) {
            for (const [id, fields] of streamMessages) {
              const payload: EventPayload = {
                userId: fields[1],
                timestamp: new Date(fields[3]),
                data: JSON.parse(fields[5])
              };

              await handler(payload);
              await redis.xack(streamKey, consumerGroup, id);
            }
          }
        }
      } catch (error) {
        eventLogger.error(`Error consuming ${event}:`, error);
      }
    }, 1000);
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * Helper function to emit asset created event
 * 
 * @param assetId Asset ID
 * @param userId User ID
 */
export async function emitAssetCreated(assetId: string, userId: string) {
  await eventBus.publish(DomainEvent.ASSET_CREATED, {
    userId,
    timestamp: new Date(),
    data: { assetId }
  });
}

/**
 * Helper function to emit quota warning event
 * 
 * @param userId User ID
 * @param usagePercent Usage percentage
 * @param plan Subscription plan
 */
export async function emitQuotaWarning(
  userId: string, 
  usagePercent: number,
  plan: string
) {
  await eventBus.publish(DomainEvent.QUOTA_WARNING, {
    userId,
    timestamp: new Date(),
    data: { 
      usagePercent,
      plan,
      isGracePeriod: usagePercent > 100
    }
  });
}

/**
 * Helper function to emit quality drift event
 * 
 * @param ragasScore RAGAS quality score
 * @param alpha Retrieval alpha value
 */
export async function emitQualityDrift(ragasScore: number, alpha: number) {
  await eventBus.publish(DomainEvent.QUALITY_DRIFT, {
    userId: 'system',
    timestamp: new Date(),
    data: { ragasScore, alpha }
  });
}
