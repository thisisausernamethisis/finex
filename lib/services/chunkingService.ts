import { logger } from '../logger';

// Create a service-specific logger
const chunkLogger = logger.child({ service: 'ChunkingService' });

/**
 * Chunking service for processing content into vector-searchable chunks
 * Implements intelligent text splitting with context preservation
 */
export class ChunkingService {
  private readonly maxChunkSize: number;
  private readonly overlapSize: number;
  private readonly minChunkSize: number;

  constructor(options?: {
    maxChunkSize?: number;
    overlapSize?: number;
    minChunkSize?: number;
  }) {
    this.maxChunkSize = options?.maxChunkSize || 512; // tokens, good for embeddings
    this.overlapSize = options?.overlapSize || 64;    // overlap between chunks
    this.minChunkSize = options?.minChunkSize || 100; // minimum useful chunk size
  }

  /**
   * Process a card's content into chunks for vector embedding
   */
  public async processCardContent(
    cardId: string,
    title: string,
    content: string,
    metadata?: ChunkMetadata
  ): Promise<ProcessedChunk[]> {
    chunkLogger.debug('Processing card content for chunking', { cardId, contentLength: content.length });

    try {
      // Preprocess content
      const preprocessedContent = this.preprocessContent(content);
      
      // Generate chunks with context
      const rawChunks = this.generateChunks(preprocessedContent);
      
      // Enhance chunks with metadata and context
      const processedChunks = rawChunks.map((chunk, index) => 
        this.enhanceChunk(chunk, index, {
          cardId,
          title,
          totalChunks: rawChunks.length,
          ...metadata
        })
      );

      chunkLogger.info('Successfully processed card content', {
        cardId,
        originalLength: content.length,
        chunksGenerated: processedChunks.length
      });

      return processedChunks;
    } catch (error) {
      chunkLogger.error('Failed to process card content', { cardId, error });
      throw new Error(`Chunking failed for card ${cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process theme content by aggregating all its cards
   */
  public async processThemeContent(
    themeId: string,
    cards: Array<{ id: string; title: string; content: string; importance?: number }>
  ): Promise<ProcessedChunk[]> {
    chunkLogger.debug('Processing theme content', { themeId, cardCount: cards.length });

    const allChunks: ProcessedChunk[] = [];
    
    for (const card of cards) {
      const cardChunks = await this.processCardContent(
        card.id,
        card.title,
        card.content,
        {
          themeId,
          importance: card.importance || 1,
          cardType: 'theme_card'
        }
      );
      allChunks.push(...cardChunks);
    }

    // Sort by importance and chunk quality score
    allChunks.sort((a, b) => {
      const importanceA = a.metadata.importance || 1;
      const importanceB = b.metadata.importance || 1;
      const scoreA = a.qualityScore || 0;
      const scoreB = b.qualityScore || 0;
      
      return (importanceB * scoreB) - (importanceA * scoreA);
    });

    chunkLogger.info('Processed theme content', {
      themeId,
      totalChunks: allChunks.length,
      averageQuality: allChunks.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / allChunks.length
    });

    return allChunks;
  }

  /**
   * Preprocess content for optimal chunking
   */
  private preprocessContent(content: string): string {
    // Remove excessive whitespace
    let processed = content.replace(/\s+/g, ' ').trim();
    
    // Normalize line breaks for better sentence detection
    processed = processed.replace(/\n\s*\n/g, '\n\n');
    
    // Ensure proper sentence endings
    processed = processed.replace(/([.!?])([A-Z])/g, '$1 $2');
    
    return processed;
  }

  /**
   * Generate chunks using intelligent text splitting
   */
  private generateChunks(content: string): string[] {
    if (content.length <= this.maxChunkSize) {
      return [content];
    }

    const chunks: string[] = [];
    const sentences = this.splitIntoSentences(content);
    
    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;
      
      // If adding this sentence would exceed max size, finalize current chunk
      if (currentLength + sentenceLength > this.maxChunkSize && currentChunk.length > this.minChunkSize) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        const overlap = this.extractOverlap(currentChunk);
        currentChunk = overlap + sentence;
        currentLength = overlap.length + sentenceLength;
      } else {
        currentChunk += sentence;
        currentLength += sentenceLength;
      }
    }

    // Add the final chunk if it meets minimum size
    if (currentChunk.trim().length >= this.minChunkSize) {
      chunks.push(currentChunk.trim());
    } else if (chunks.length > 0) {
      // Merge small final chunk with previous chunk
      chunks[chunks.length - 1] += ' ' + currentChunk.trim();
    } else {
      // Only chunk is too small, but we need to keep it
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split text into sentences for better chunk boundaries
   */
  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that handles common abbreviations
    const sentences = text
      .replace(/([.!?])(\s+)([A-Z])/g, '$1|||$3')
      .split('|||')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    return sentences;
  }

  /**
   * Extract overlap content from the end of a chunk
   */
  private extractOverlap(chunk: string): string {
    if (chunk.length <= this.overlapSize) {
      return chunk + ' ';
    }

    // Try to find a sentence boundary within the overlap region
    const overlapRegion = chunk.slice(-this.overlapSize * 2);
    const sentences = this.splitIntoSentences(overlapRegion);
    
    if (sentences.length > 1) {
      // Use the last complete sentence as overlap
      return sentences[sentences.length - 1] + ' ';
    }
    
    // Fall back to character-based overlap
    return chunk.slice(-this.overlapSize) + ' ';
  }

  /**
   * Enhance chunk with metadata and quality scoring
   */
  private enhanceChunk(
    content: string, 
    index: number, 
    metadata: ChunkMetadata & { cardId: string; title: string; totalChunks: number }
  ): ProcessedChunk {
    const qualityScore = this.calculateQualityScore(content);
    
    return {
      content,
      order: index,
      qualityScore,
      metadata: {
        ...metadata,
        contentLength: content.length,
        position: `${index + 1}/${metadata.totalChunks}`,
        keywords: this.extractKeywords(content),
        entityTypes: this.detectEntityTypes(content)
      }
    };
  }

  /**
   * Calculate a quality score for the chunk (0-1)
   */
  private calculateQualityScore(content: string): number {
    let score = 0.5; // Base score
    
    // Length scoring (prefer chunks that are reasonably sized)
    const lengthRatio = content.length / this.maxChunkSize;
    if (lengthRatio >= 0.3 && lengthRatio <= 0.9) {
      score += 0.2; // Good length
    }
    
    // Content richness scoring
    const sentences = this.splitIntoSentences(content);
    if (sentences.length >= 2) {
      score += 0.15; // Multiple sentences
    }
    
    // Keyword density scoring
    const keywords = this.extractKeywords(content);
    if (keywords.length >= 3) {
      score += 0.15; // Good keyword density
    }
    
    // Entity detection scoring
    const entities = this.detectEntityTypes(content);
    score += Math.min(entities.length * 0.05, 0.2); // Bonus for entities
    
    return Math.min(score, 1.0);
  }

  /**
   * Extract important keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequency
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Detect entity types in content (companies, technologies, etc.)
   */
  private detectEntityTypes(content: string): string[] {
    const entities: string[] = [];
    
    // Technology indicators
    const techTerms = [
      'ai', 'artificial intelligence', 'machine learning', 'neural network',
      'blockchain', 'quantum', 'robotics', 'automation', 'cloud computing',
      'cybersecurity', 'iot', 'internet of things', 'big data', 'analytics'
    ];
    
    // Financial indicators
    const financeTerms = [
      'revenue', 'profit', 'earnings', 'investment', 'funding', 'valuation',
      'market cap', 'ipo', 'acquisition', 'merger', 'dividend'
    ];
    
    // Risk indicators
    const riskTerms = [
      'risk', 'threat', 'vulnerability', 'compliance', 'regulation',
      'security', 'privacy', 'data protection', 'audit'
    ];
    
    const lowerContent = content.toLowerCase();
    
    if (techTerms.some(term => lowerContent.includes(term))) {
      entities.push('technology');
    }
    
    if (financeTerms.some(term => lowerContent.includes(term))) {
      entities.push('financial');
    }
    
    if (riskTerms.some(term => lowerContent.includes(term))) {
      entities.push('risk');
    }
    
    // Company name detection (simplified)
    if (/\b[A-Z][a-z]+\s+(Inc|Corp|Corporation|Ltd|Limited|LLC|Company)\b/.test(content)) {
      entities.push('company');
    }
    
    return entities;
  }
}

// Type definitions

export interface ProcessedChunk {
  content: string;
  order: number;
  qualityScore: number;
  metadata: ChunkMetadata & {
    contentLength: number;
    position: string;
    keywords: string[];
    entityTypes: string[];
  };
}

export interface ChunkMetadata {
  cardId?: string;
  themeId?: string;
  assetId?: string;
  scenarioId?: string;
  importance?: number;
  cardType?: 'theme_card' | 'evidence_card' | 'analysis_card';
  [key: string]: any;
}

// Export a default instance
export const chunkingService = new ChunkingService();

// Export helper functions for use in other services
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

export function optimizeChunkForEmbedding(chunk: ProcessedChunk): string {
  // Prepare chunk for embedding by adding context
  const { content, metadata } = chunk;
  const contextPrefix = metadata.cardId ? `[Card: ${metadata.cardId}] ` : '';
  const positionSuffix = metadata.position ? ` [Part ${metadata.position}]` : '';
  
  return `${contextPrefix}${content}${positionSuffix}`;
} 