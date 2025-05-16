/**
 * Re-chunk runner CLI (T-301b)
 * 
 * This script processes legacy chunks and creates ChunkV2 records with embeddings.
 * It can run in dry-run mode to validate the process before making changes.
 * 
 * Usage:
 *   pnpm ts-node scripts/rechunk/start.ts           # Process all chunks
 *   pnpm ts-node scripts/rechunk/start.ts --dry-run # Show what would be processed without making changes
 *   pnpm ts-node scripts/rechunk/start.ts --limit 100 # Only process 100 chunks
 */

import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { logger } from '../../lib/logger';
import { QUEUES } from '../../workers/queues';
import { program } from 'commander';
import { Domain } from '../../lib/types/domain';

// Configure logger
const log = logger.child({ component: 'RECHUNK_RUNNER' });

// Parse command line options
program
  .option('--dry-run', 'Show what would be processed without making changes')
  .option('--limit <number>', 'Maximum number of chunks to process', parseInt)
  .parse(process.argv);

const options = program.opts();
const DRY_RUN = options.dryRun || false;
const LIMIT = options.limit || undefined;

// Queue configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost', 
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Database client
const prisma = new PrismaClient();

// Processing batch size
const BATCH_SIZE = 200;

/**
 * Main function to start the re-chunking process
 */
async function main() {
  try {
    log.info('Starting re-chunk process', { dryRun: DRY_RUN, limit: LIMIT });
    
    // Count legacy chunks that need processing
    const totalChunks = await prisma.chunk.count({
      where: {
        // Include any filters if needed
      },
    });
    
    // Apply limit if specified
    const chunksToProcess = LIMIT ? Math.min(totalChunks, LIMIT) : totalChunks;
    
    log.info(`Found ${totalChunks} legacy chunks, will process ${chunksToProcess} chunks`);
    
    if (chunksToProcess === 0) {
      log.info('No chunks to process, exiting');
      return;
    }
    
    // Initialize queue if not in dry-run mode
    let queue;
    if (!DRY_RUN) {
      queue = new Queue(QUEUES.rechunk, { connection });
      log.info('Connected to re-chunk queue');
    }
    
    // Process chunks in batches
    let processed = 0;
    let totalQueued = 0;
    
    while (processed < chunksToProcess) {
      const batchSize = Math.min(BATCH_SIZE, chunksToProcess - processed);
      
      log.info(`Processing batch of ${batchSize} chunks (${processed + 1}-${processed + batchSize} of ${chunksToProcess})`);
      
      // Get batch of chunks to process
      const chunks = await prisma.chunk.findMany({
        select: {
          id: true,
          content: true,
          card: {
            select: {
              theme: {
                select: {
                  assetId: true
                }
              }
            }
          },
          domain: true
        },
        take: batchSize,
        skip: processed,
      });
      
      // Enqueue or simulate enqueueing each chunk
      for (const chunk of chunks) {
        // Extract assetId from the nested relationship
        const assetId = chunk.card?.theme?.assetId || 'unknown';
        
        if (DRY_RUN) {
          log.info(`[DRY RUN] Would enqueue chunk ${chunk.id}`, {
            assetId,
            domain: chunk.domain || Domain.FINANCE, // Default to FINANCE if not set
            contentLength: chunk.content.length,
          });
        } else {
          // Add job to the queue
          await queue!.add(`rechunk-${chunk.id}`, {
            chunkId: chunk.id,
            content: chunk.content,
            assetId,
            domain: chunk.domain || Domain.FINANCE, // Default to FINANCE if not set
          });
          
          totalQueued++;
        }
      }
      
      processed += chunks.length;
      log.info(`Progress: ${processed}/${chunksToProcess} chunks (${Math.round(processed / chunksToProcess * 100)}%)`);
      
      // Simulate processing delay in dry-run mode
      if (DRY_RUN) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Close the queue connection
    if (!DRY_RUN && queue) {
      await queue.close();
    }
    
    log.info(`Re-chunk process completed. ${DRY_RUN ? 'Would have queued' : 'Queued'} ${totalQueued} chunks for processing`);
    
  } catch (error) {
    log.error('Error in re-chunk process', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    log.info('Re-chunk script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    log.error('Fatal error in re-chunk script', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  });
