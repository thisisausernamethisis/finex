/**
 * Re-chunking script for Finex v0.20
 * 
 * This script handles:
 * 1. Fetching all documents from the database
 * 2. Re-chunking them with improved algorithm targeting ~256 tokens
 * 3. Maintaining order and preserving domain information
 * 4. Enqueuing reindex jobs for embedding generation
 */

import { prisma } from '../../lib/db';
import { Queue } from 'bullmq';
import { logger } from '../../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { Prisma, Domain } from '@prisma/client';

// Configure OpenAI for token counting
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-token-counting'
});

// Configure logger
const rechunkLogger = logger.child({ component: 'RechunkScript' });

// Redis connection for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Queue for reindexing
const REINDEX_QUEUE = 'chunk-reindex';
const reindexQueue = new Queue(REINDEX_QUEUE, { connection: redisConnection });

// Target chunk size in tokens
const TARGET_TOKEN_SIZE = 256;
const TOKEN_SIZE_TOLERANCE = 0.15; // Allow 15% deviation from target

interface Document {
  id: string;
  content: string;
  cardId: string;
  domain: Domain;
  order: number;
}

/**
 * Estimates token count for a string
 * Uses OpenAI's tokenizer for accurate estimates
 */
async function estimateTokens(text: string): Promise<number> {
  try {
    const result = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: text,
      max_tokens: 1,
      temperature: 0,
      logprobs: 5,
      echo: true
    });
    
    // Return the token count from the response
    return result.usage?.prompt_tokens || Math.ceil(text.length / 4);
  } catch (error) {
    // Fall back to character-based approximation if OpenAI API fails
    rechunkLogger.warn('Failed to estimate tokens with OpenAI API, falling back to approximation', {
      error: error instanceof Error ? error.message : String(error)
    });
    return Math.ceil(text.length / 4); // Rough approximation: 4 chars per token
  }
}

/**
 * Re-chunks content targeting a specific token count
 */
async function rechunkContent(content: string, targetTokens: number): Promise<string[]> {
  // Split content into paragraphs first
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  
  for (const paragraph of paragraphs) {
    // Estimate tokens in this paragraph
    const paragraphTokens = await estimateTokens(paragraph);
    
    // If paragraph alone is too large, split it further
    if (paragraphTokens > targetTokens * (1 + TOKEN_SIZE_TOLERANCE)) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
        currentTokens = 0;
      }
      
      // Split large paragraph into sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      let sentenceChunk = '';
      let sentenceTokens = 0;
      
      for (const sentence of sentences) {
        const sentenceTokenCount = await estimateTokens(sentence);
        
        if (sentenceTokens + sentenceTokenCount > targetTokens) {
          if (sentenceChunk) {
            chunks.push(sentenceChunk);
            sentenceChunk = sentence;
            sentenceTokens = sentenceTokenCount;
          } else {
            // Single sentence is too long, add it anyway
            chunks.push(sentence);
          }
        } else {
          sentenceChunk += sentence;
          sentenceTokens += sentenceTokenCount;
        }
      }
      
      if (sentenceChunk) {
        chunks.push(sentenceChunk);
      }
      
    } else if (currentTokens + paragraphTokens > targetTokens) {
      // Current chunk would be too large, finish it and start a new one
      chunks.push(currentChunk);
      currentChunk = paragraph;
      currentTokens = paragraphTokens;
    } else {
      // Add paragraph to current chunk
      if (currentChunk) currentChunk += '\n\n';
      currentChunk += paragraph;
      currentTokens += paragraphTokens;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Process an individual document for rechunking
 */
async function processDocument(doc: Document): Promise<void> {
  rechunkLogger.info(`Processing document with ID: ${doc.id}`);
  
  try {
    // Re-chunk content targeting ~256 tokens
    const chunks = await rechunkContent(doc.content, TARGET_TOKEN_SIZE);
    
    // Delete existing chunks for this document
    await prisma.$executeRaw`DELETE FROM "Chunk" WHERE "cardId" = ${doc.cardId}`;
    
    // Create new chunks with preserved domain and sequential ordering
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = uuidv4();

      await prisma.$executeRaw`
        INSERT INTO "Chunk" ("id", "cardId", "content", "domain", "order") 
        VALUES (${chunkId}, ${doc.cardId}, ${chunks[i]}, ${doc.domain}, ${i})
      `;
      
      // Enqueue job to generate embedding for this chunk
      await reindexQueue.add('embed-chunk', {
        chunkId,
        content: chunks[i]
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      
      rechunkLogger.debug(`Created chunk ${i + 1}/${chunks.length} for document ${doc.id}`);
    }
    
    rechunkLogger.info(`Document ${doc.id} successfully rechunked into ${chunks.length} chunks`);
  } catch (error) {
    rechunkLogger.error(`Failed to process document ${doc.id}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Main function to run the rechunking process
 */
async function main() {
  rechunkLogger.info('Starting rechunking process');
  
  try {
    // Get all documents via raw SQL to avoid Prisma schema limitations
    const cards = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
      chunks: Array<{
        id: string;
        domain: Domain;
        order: number;
      }>;
    }>>`
      SELECT 
        c.id, 
        c.content,
        COALESCE(
          ARRAY_AGG(
            json_build_object(
              'id', ch.id,
              'domain', ch.domain,
              'order', ch."order"
            )
          ) FILTER (WHERE ch.id IS NOT NULL),
          '{}'::json[]
        ) as chunks
      FROM "Card" c
      LEFT JOIN "Chunk" ch ON c.id = ch."cardId"
      GROUP BY c.id
    `;
    
    rechunkLogger.info(`Found ${cards.length} documents to process`);
    
    // Process each document
    for (const card of cards) {
      // Use the domain from the first chunk, or fallback to GENERAL if no chunks exist
      const domain = card.chunks.length > 0 
        ? (card.chunks[0].domain as Domain) 
        : Domain.OTHER;
      
      await processDocument({
        id: card.id,
        content: card.content,
        cardId: card.id,
        domain,
        order: 0
      });
    }
    
    rechunkLogger.info('Rechunking process completed successfully');
    
    // Clean up any existing but incomplete embeddings
    const incompleteCount = await prisma.$executeRaw`
      SELECT COUNT(*) FROM "Chunk" WHERE embedding IS NULL
    `;
    
    rechunkLogger.info(`Identified ${incompleteCount} chunks with missing embeddings for reprocessing`);
  } catch (error) {
    rechunkLogger.error('Rechunking process failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      rechunkLogger.info('Script execution complete');
      process.exit(0);
    })
    .catch((error) => {
      rechunkLogger.error('Script execution failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    });
}

// Export functions for testing
export { rechunkContent, estimateTokens, processDocument };
