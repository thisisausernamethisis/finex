/**
 * Worker for reindexing chunks with new embeddings
 * Part of T-301b: Re-chunk & Re-embed
 * 
 * Processes chunk embedding jobs from the chunk-reindex queue
 * Generates embeddings for chunks and saves them to the database
 */

import { Worker, Job, QueueEvents } from 'bullmq';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { generateDocEmbedding } from '../lib/clients';
import { jobsProcessed, jobsFailed, jobsActive } from '../lib/metrics';

// Logger for this worker
const workerLogger = logger.child({ component: 'ReindexWorker', queue: 'chunk-reindex' });

// Redis connection for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Queue name
const QUEUE_NAME = 'chunk-reindex';

// Worker function to process embedding generation jobs
async function processChunkJob(job: Job): Promise<void> {
  const { chunkId, content } = job.data;
  
  workerLogger.debug('Processing chunk reindex job', { 
    jobId: job.id,
    chunkId
  });
  
  if (!chunkId || !content) {
    throw new Error('Invalid job data: missing required fields');
  }
  
  try {
    // Generate embedding using the vector client
    const embedding = await generateDocEmbedding(content);
    
    // Save the embedding to the database
    await prisma.$executeRaw`
      UPDATE "Chunk"
      SET embedding = ${embedding}::vector
      WHERE id = ${chunkId}
    `;
    
    workerLogger.debug('Successfully reindexed chunk', { 
      chunkId,
      vectorSize: embedding.length
    });
    
    return;
  } catch (error) {
    workerLogger.error('Failed to reindex chunk', {
      chunkId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
}

// Start the worker
export function startReindexWorker(): Worker {
  workerLogger.info('Starting chunk reindex worker');
  
  // Create the worker
  const worker = new Worker(
    QUEUE_NAME, 
    processChunkJob,
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 20, // Max 20 jobs per
        duration: 1000 // per second (rate limiting)
      },
      removeOnComplete: { count: 1000 }, // Keep last 1000 completed jobs
      removeOnFail: { count: 500 } // Keep last 500 failed jobs
    }
  );
  
  // Listen for events
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection });
  queueEvents.setMaxListeners(0); // Prevent MaxListenersExceededWarning
  
  // Log worker events
  worker.on('completed', (job) => {
    workerLogger.debug('Chunk reindex job completed', { jobId: job.id });
    jobsProcessed.inc({ type: 'chunk-reindex' });
  });
  
  worker.on('failed', (job, err) => {
    workerLogger.error('Chunk reindex job failed', { 
      jobId: job?.id, 
      error: err.message,
      stack: err.stack
    });
    
    jobsFailed.inc({ 
      type: 'chunk-reindex',
      error_type: err.name || 'UnknownError'  
    });
  });
  
  worker.on('error', (err) => {
    workerLogger.error('Reindex worker error', { 
      error: err.message,
      stack: err.stack
    });
  });
  
  worker.on('active', () => {
    jobsActive.set({ queue: 'chunk-reindex' }, 1);
  });
  
  return worker;
}

// Add a function to check for and process any existing chunks with null embeddings
export async function reprocessMissingEmbeddings(): Promise<number> {
  workerLogger.info('Checking for chunks with missing embeddings');
  
  try {
    // Get chunks with null embeddings
    const chunksWithoutEmbeddings = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
    }>>`
      SELECT id, content 
      FROM "Chunk" 
      WHERE embedding IS NULL
    `;
    
    const chunkCount = chunksWithoutEmbeddings.length;
    workerLogger.info(`Found ${chunkCount} chunks with missing embeddings`);
    
    if (chunkCount === 0) {
      return 0;
    }
    
    // Create a queue instance for adding jobs
    const { Queue } = await import('bullmq');
    const queue = new Queue(QUEUE_NAME, { connection: redisConnection });
    
    // Add jobs for each chunk
    for (const chunk of chunksWithoutEmbeddings) {
      await queue.add('embed-chunk', {
        chunkId: chunk.id,
        content: chunk.content
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
    }
    
    workerLogger.info(`Enqueued ${chunkCount} chunks for reprocessing`);
    return chunkCount;
  } catch (error) {
    workerLogger.error('Failed to reprocess missing embeddings', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// If run directly, start the worker
if (require.main === module) {
  startReindexWorker();
  
  // Check for any chunks with missing embeddings and reprocess them
  reprocessMissingEmbeddings()
    .then((count) => {
      workerLogger.info(`Reprocessing ${count} chunks with missing embeddings`);
    })
    .catch((error) => {
      workerLogger.error('Failed to start reprocessing', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    workerLogger.info('Received SIGTERM, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    workerLogger.info('Received SIGINT, shutting down gracefully');
    process.exit(0);
  });
}
