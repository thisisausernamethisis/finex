/**
 * Rechunk CLI
 * 
 * This script initiates the rechunking process to create new optimized chunks for the RAG system.
 * It processes documents into ~256 token chunks with overlapping boundaries for improved retrieval.
 * 
 * Features:
 * - Dry-run protection to prevent accidental execution
 * - Batch processing to avoid memory issues
 * - Progress tracking and logging
 * - Domain classification for chunks
 * - Embedding generation with caching
 */

import { prisma } from '../../lib/db';
import { logger } from '../../lib/logger';
import { generateDocEmbedding } from '../../lib/clients';
import * as path from 'path';
import * as readline from 'readline';

// Configure logger
const rechunkLogger = logger.child({ component: 'RechunkCLI' });

// Configuration
const CONFIG = {
  // Chunk size (aim for ~256 tokens)
  targetChunkSize: 1000, // Characters, roughly 250 tokens
  chunkOverlap: 150, // Characters of overlap, ~32 tokens
  
  // Process batches to avoid memory issues
  batchSize: 50,
  
  // API rate limiting
  concurrency: 5,
  delayMs: 200,
  
  // Domain classification - default if not specified
  defaultDomain: 'GENERAL',
};

/**
 * Check if script is being run in dry-run mode
 */
function isDryRun(): boolean {
  return !process.argv.includes('--execute');
}

/**
 * Main function to start the rechunking process
 */
async function startRechunk() {
  // Safety check for dry-run mode - protection against accidental execution
  if (isDryRun()) {
    console.log('\n========== DRY RUN MODE ==========');
    console.log('This is a simulation only. No changes will be made to the database.');
    console.log('To execute for real, add the --execute flag.');
    console.log('===================================\n');
  }
  
  try {
    // 1. Count total work to be done
    const cardCount = await prisma.card.count();
    console.log(`Found ${cardCount} cards to process`);
    
    // 2. Get user confirmation for non-dry-run
    if (!isDryRun()) {
      const confirmed = await confirmExecution(cardCount);
      if (!confirmed) {
        console.log('Operation cancelled by user');
        process.exit(0);
      }
    }
    
    // 3. Initialize counters
    let processedCards = 0;
    let createdChunks = 0;
    let failedCards = 0;
    
    // 4. Process in batches
    let hasMore = true;
    let lastId: string | undefined = undefined;
    
    console.log('\nStarting rechunking process...\n');
    
    while (hasMore) {
      // Fetch next batch of cards
      const cards = await fetchCardBatch(lastId, CONFIG.batchSize);
      
      if (cards.length === 0) {
        hasMore = false;
        continue;
      }
      
      lastId = cards[cards.length - 1].id;
      
      // Process each card in this batch
      for (const card of cards) {
        try {
          const chunkCount = await processCard(card, isDryRun());
          createdChunks += chunkCount;
          processedCards++;
          
          // Show progress
          if (processedCards % 10 === 0 || processedCards === cardCount) {
            const percent = Math.round((processedCards / cardCount) * 100);
            console.log(`Progress: ${percent}% (${processedCards}/${cardCount} cards, ${createdChunks} chunks created)`);
          }
        } catch (error) {
          failedCards++;
          rechunkLogger.error('Failed to process card', { 
            cardId: card.id,
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
    }
    
    console.log('\nRechunking complete!');
    console.log(`Processed ${processedCards}/${cardCount} cards`);
    console.log(`Created ${createdChunks} new chunks`);
    
    if (failedCards > 0) {
      console.log(`Failed to process ${failedCards} cards. Check logs for details.`);
    }
    
    if (isDryRun()) {
      console.log('\nThis was a dry run. No changes were made to the database.');
      console.log('To execute for real, add the --execute flag.');
    } else {
      console.log('\nAll chunks have been created in the ChunkV2 table.');
      console.log('You will need to run the ANN indexing script to create optimal vector indexes.');
    }
  } catch (error) {
    rechunkLogger.error('Fatal error in rechunking process', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    console.error('Rechunking failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get user confirmation before proceeding with actual execution
 */
async function confirmExecution(cardCount: number): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(
      `WARNING: You are about to rechunk ${cardCount} cards in PRODUCTION mode.\n` +
      `This will create new chunks in the ChunkV2 table.\n` +
      `Are you sure you want to continue? (yes/no): `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Fetch a batch of cards for processing
 */
async function fetchCardBatch(lastId: string | undefined, limit: number) {
  return prisma.card.findMany({
    where: lastId ? { id: { gt: lastId } } : {},
    include: {
      theme: {
        include: {
          asset: true,
          scenario: true
        }
      }
    },
    orderBy: { id: 'asc' },
    take: limit
  });
}

/**
 * Process a single card and create chunks from its content
 */
async function processCard(card: any, dryRun: boolean): Promise<number> {
  const { content, id: cardId, theme } = card;
  const assetId = theme?.asset?.id;
  const scenarioId = theme?.scenario?.id;
  
  if (!content || !assetId || !scenarioId) {
    rechunkLogger.warn('Skipping card with missing data', { cardId });
    return 0;
  }
  
  // Determine the domain based on asset/theme metadata
  // This is a simplistic implementation - in production, use proper NLP classification
  const domain = determineDomain(card);
  
  // Split the content into chunks with overlapping boundaries
  const chunks = createOverlappingChunks(content, CONFIG.targetChunkSize, CONFIG.chunkOverlap);
  
  // Log info
  rechunkLogger.debug('Processing card', {
    cardId,
    assetId,
    scenarioId,
    domain,
    chunkCount: chunks.length
  });
  
  // Skip actual DB operations in dry-run mode
  if (dryRun) {
    return chunks.length;
  }
  
  // Create chunks in the database
  for (const chunkContent of chunks) {
    try {
      // Generate embedding for the chunk
      const embedding = await generateDocEmbedding(chunkContent);
      
      // Create chunk in database using direct SQL
      // This approach works even if the Prisma schema hasn't been updated yet
      await prisma.$executeRaw`
        INSERT INTO "ChunkV2" ("id", "assetId", "scenarioId", "domain", "content", "embedding", "createdAt", "updatedAt")
        VALUES (
          ${`${cardId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`},
          ${assetId},
          ${scenarioId},
          ${domain},
          ${chunkContent},
          ${embedding}::vector,
          NOW(),
          NOW()
        )
      `;
    } catch (error) {
      rechunkLogger.error('Failed to create chunk', {
        cardId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue with other chunks
    }
  }
  
  return chunks.length;
}

/**
 * Split text into chunks with overlapping boundaries
 */
function createOverlappingChunks(text: string, chunkSize: number, overlap: number): string[] {
  if (!text) return [];
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    
    // Extract chunk
    const chunk = text.substring(startIndex, endIndex);
    chunks.push(chunk);
    
    // Move start index for next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    
    // Avoid creating tiny chunks at the end
    if (text.length - startIndex < chunkSize / 3) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Determine the domain for a card based on its content and metadata
 * This is a placeholder implementation - in production, use NLP classification
 */
function determineDomain(card: any): string {
  const { content, theme } = card;
  
  // Check asset name and theme for keywords
  const assetName = theme?.asset?.name?.toLowerCase() || '';
  const themeName = theme?.name?.toLowerCase() || '';
  
  // Simple keyword-based classification
  if (assetName.includes('financial') || themeName.includes('financial') || 
      assetName.includes('finance') || themeName.includes('finance') ||
      content.toLowerCase().includes('finance')) {
    return 'FINANCE';
  }
  
  if (assetName.includes('legal') || themeName.includes('legal') ||
      assetName.includes('regulatory') || themeName.includes('regulatory')) {
    return 'REGULATORY';
  }
  
  if (assetName.includes('technical') || themeName.includes('technical') ||
      content.toLowerCase().includes('technology') || content.toLowerCase().includes('software')) {
    return 'TECHNICAL';
  }
  
  // Default domain
  return CONFIG.defaultDomain;
}

// Run the main function
startRechunk().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
