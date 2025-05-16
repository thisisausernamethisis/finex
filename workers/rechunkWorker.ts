/**
 * Re-chunk worker process (T-301b)
 * 
 * This worker processes legacy chunks and creates ChunkV2 records with embeddings.
 * It can be triggered manually via the rechunk script or automatically with
 * RECHUNK_ON_WRITE=1 environment variable.
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import { QUEUES } from './queues';
import { Domain } from '../lib/types/domain';
// Mock embedding function - would use real embedding service in production
async function getEmbedding(text: string): Promise<number[]> {
  // In production this would call an embedding service like OpenAI
  // For now, create a simple mock embedding of fixed dimension
  return Array(384).fill(0).map(() => Math.random() - 0.5);
}

// Configure logger
const log = logger.child({ component: 'RECHUNK_WORKER' });

// Worker configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Database client
const prisma = new PrismaClient();

// Interface for job data
interface RechunkJobData {
  chunkId: string;
  content: string;
  domain: Domain;
  assetId: string;
  metadata?: any;
}

/**
 * Process a chunk and create a ChunkV2 record with embedding
 */
async function processChunk(job: Job<RechunkJobData>) {
  const { chunkId, content, domain, assetId, metadata } = job.data;
  
  try {
    log.info(`Processing chunk ${chunkId}`, { domain });
    
    // Get existing chunk to avoid duplication
    const existingChunkV2 = await prisma.chunkV2.findFirst({
      where: {
        legacyChunkId: chunkId,
      },
    });
    
    if (existingChunkV2) {
      log.info(`Chunk ${chunkId} already migrated as ChunkV2 ${existingChunkV2.id}`);
      return { success: true, chunkId: existingChunkV2.id };
    }
    
    // Get embedding for the chunk content
    const embedding = await getEmbedding(content);
    
    // Create new ChunkV2 record
    const newChunk = await prisma.chunkV2.create({
      data: {
        content,
        domain,
        assetId,
        embedding,
        legacyChunkId: chunkId,
        metadata: metadata || {
          migratedAt: new Date().toISOString(),
        },
      },
    });
    
    log.info(`Created ChunkV2 ${newChunk.id} from legacy chunk ${chunkId}`);
    return { success: true, chunkId: newChunk.id };
  } catch (error) {
    log.error(`Error processing chunk ${chunkId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Initialize the re-chunk worker
 */
export function initRechunkWorker() {
  log.info('Starting rechunk worker');
  
  const worker = new Worker(QUEUES.rechunk, processChunk, {
    connection,
    concurrency: 10,
  });
  
  worker.on('completed', (job) => {
    log.info(`Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, error) => {
    log.error(`Job ${job?.id} failed`, {
      error: error.message,
      stack: error.stack,
    });
  });
  
  return worker;
}

// Start worker if directly invoked
if (require.main === module) {
  initRechunkWorker();
}
