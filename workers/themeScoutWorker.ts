import { Worker } from 'bullmq';
import prisma from '../lib/db';
import { OpenAI } from 'openai';
import Redis from 'ioredis';
import { logger } from '../lib/logger';
import { enforceQuota } from '../lib/middleware/enforceQuota';
import { themeScoutQueue } from './queues';

// Manual enum definition to match the database
enum SuggestionStatus {
  DRAFT = 'DRAFT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Initialize Redis client for BullMQ and caching
const redis = new Redis(process.env.REDIS_URL!);

// Create logger instance for theme-scout
const themeScoutLogger = logger.child({ component: 'ThemeScout' });

/**
 * Job payload for theme scouting
 */
interface ThemeScoutJob {
  assetId: string;
  focusKeywords?: string[];
  userId: string;
}

/**
 * Theme candidate with evidence and score
 */
interface CandidateTheme {
  title: string;
  evidence: string[];
  tfidfScore: number;
}

/**
 * Theme Scout Worker implementation
 * 
 * This worker scans assets and suggests relevant themes using a combination
 * of TF-IDF and GPT-4 ranking. It's triggered when new assets are created
 * or when manually requested.
 */
export const themeScoutWorker = new Worker<ThemeScoutJob>(
  'theme-scout',
  async (job) => {
    const { assetId, focusKeywords, userId } = job.data;
    themeScoutLogger.info(`Processing asset ${assetId}`);

    try {
      // Check quota before processing (estimate ~500 tokens for scanning plus 1000 for GPT)
      const estimatedTokens = 1500;
      const quotaCheck = await enforceQuota(
        { userId } as any,
        estimatedTokens
      );
      
      if (quotaCheck) {
        themeScoutLogger.warn(`Quota exceeded for user ${userId}`);
        throw new Error(`Quota exceeded`);
      }

      // Load asset and existing themes
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          themes: {
            include: {
              cards: {
                include: {
                  chunks: true
                }
              }
            }
          }
        }
      });

      if (!asset) {
        throw new Error(`Asset ${assetId} not found`);
      }

      // Extract all content from the asset and its chunks
      const assetContent = extractAssetContent(asset);

      // Get candidate themes from corpus
      const candidates = await findCandidateThemes(
        asset,
        assetContent,
        focusKeywords,
        asset.themes.map(t => t.name)
      );

      if (candidates.length === 0) {
        themeScoutLogger.info(`No candidate themes found for asset ${assetId}`);
        return { status: 'no_candidates' };
      }

      // Use GPT-4 to rank candidates
      const rankedThemes = await rankThemesWithGPT(
        asset.name,
        asset.description || '',
        candidates
      );

      // Filter by threshold and limit
      const filteredThemes = rankedThemes
        .filter(theme => theme.relevanceScore >= 0.25)
        .slice(0, 5);

      // Save suggestions - use $queryRaw since the Prisma client might not be regenerated yet
      const suggestions = await Promise.all(
        filteredThemes.map(theme =>
          // Use a generic approach until Prisma client is regenerated
          prisma.$queryRaw`
            INSERT INTO "SuggestedTheme" 
            ("id", "assetId", "name", "evidence", "relevanceScore", "status", "createdAt", "updatedAt") 
            VALUES 
            (gen_random_uuid(), ${assetId}, ${theme.title}, ${theme.evidence}, ${theme.relevanceScore}, 'DRAFT', NOW(), NOW())
            RETURNING *
          `
        )
      );

      themeScoutLogger.info(`Created ${suggestions.length} suggestions for asset ${assetId}`);
      
      // Track actual token usage - this is more accurate than our initial estimate
      const actualTokens = countTokens(JSON.stringify(candidates) + JSON.stringify(rankedThemes));
      if (actualTokens > estimatedTokens) {
        await enforceQuota(
          { userId } as any,
          actualTokens - estimatedTokens // Only charge the difference
        );
      }
      
      // Cast suggestions to any[] to work with the raw query result
      const typedSuggestions = suggestions as any[];
      
      return {
        status: 'success',
        suggestionsCount: typedSuggestions.length,
        suggestionIds: typedSuggestions.map(s => s.id || '')
      };
    } catch (error) {
      themeScoutLogger.error('Error processing asset:', error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3 // Process up to 3 jobs concurrently
  }
);

/**
 * Extract all text content from an asset and its chunks
 */
function extractAssetContent(asset: any): string {
  const chunks: string[] = [];
  
  // Add asset name and description
  chunks.push(asset.name);
  if (asset.description) {
    chunks.push(asset.description);
  }
  
  // Add content from all chunks
  for (const theme of asset.themes) {
    for (const card of theme.cards) {
      for (const chunk of card.chunks) {
        chunks.push(chunk.content);
      }
    }
  }
  
  return chunks.join('\n\n');
}

/**
 * Find candidate themes using TF-IDF algorithm
 * 
 * @param asset The asset to analyze
 * @param assetContent The combined text content from the asset
 * @param focusKeywords Optional keywords to prioritize
 * @param existingThemes Themes to exclude from results
 * @returns List of candidate themes with evidence and scores
 */
async function findCandidateThemes(
  asset: any,
  assetContent: string,
  focusKeywords?: string[],
  existingThemes: string[] = []
): Promise<CandidateTheme[]> {
  // Get theme corpus from cache or database
  const themeCorpus = await getThemeCorpus(asset.kind);
  
  // Filter out existing themes
  const candidateThemes = themeCorpus.filter(
    theme => !existingThemes.includes(theme.title)
  );

  // Calculate TF-IDF scores
  const tfidfScores = calculateTFIDF(assetContent, candidateThemes, focusKeywords);
  
  // Sort by score and take top candidates
  return tfidfScores
    .sort((a, b) => b.tfidfScore - a.tfidfScore)
    .slice(0, 20); // Top 20 for GPT ranking
}

/**
 * Get theme corpus based on asset kind
 * 
 * @param assetKind The kind of asset
 * @returns Array of themes with title and associated keywords
 */
async function getThemeCorpus(assetKind: string): Promise<Array<{title: string, keywords: string[]}>> {
  // Check if corpus is in Redis cache
  const cacheKey = `theme-corpus:${assetKind}`;
  const cachedCorpus = await redis.get(cacheKey);
  
  if (cachedCorpus) {
    return JSON.parse(cachedCorpus);
  }
  
  // If not in cache, fetch from database
  const themeTemplates = await prisma.themeTemplate.findMany({
    select: {
      name: true
    }
  });
  
  // Transform to expected format - note: keywords aren't in the database schema yet
  // This is a placeholder until the schema is updated
  const corpus = themeTemplates.map(template => ({
    title: template.name,
    keywords: [] // Default empty array since keywords aren't in the schema yet
  }));
  
  // Cache for 1 hour
  await redis.set(cacheKey, JSON.stringify(corpus), 'EX', 3600);
  
  return corpus;
}

/**
 * Calculate TF-IDF scores for candidate themes
 * 
 * @param text The document text to analyze
 * @param candidates The candidate themes
 * @param focusKeywords Optional priority keywords
 * @returns Candidates with TF-IDF scores and evidence
 */
function calculateTFIDF(
  text: string, 
  candidates: Array<{title: string, keywords: string[]}>,
  focusKeywords?: string[]
): CandidateTheme[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  // Calculate term frequency for document
  const termFreq: Record<string, number> = {};
  words.forEach(word => {
    termFreq[word] = (termFreq[word] || 0) + 1;
  });
  
  // Calculate document frequency for all keywords
  const allKeywords = candidates.flatMap(c => c.keywords);
  const docFreq: Record<string, number> = {};
  allKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    docFreq[keywordLower] = candidates.filter(
      c => c.keywords.some(k => k.toLowerCase().includes(keywordLower))
    ).length;
  });
  
  // Calculate TF-IDF for each candidate
  return candidates.map(candidate => {
    // Find evidence and calculate score
    const evidence: string[] = [];
    let score = 0;
    
    // Score based on keywords
    for (const keyword of candidate.keywords) {
      const keywordLower = keyword.toLowerCase();
      const termFrequency = termFreq[keywordLower] || 0;
      
      if (termFrequency > 0) {
        // Calculate IDF
        const docFrequency = docFreq[keywordLower] || 1;
        const idf = Math.log(candidates.length / docFrequency);
        
        // Calculate TF-IDF score
        const tfidf = termFrequency * idf;
        score += tfidf;
        
        // Apply boost for focus keywords
        if (focusKeywords?.some(fk => keywordLower.includes(fk.toLowerCase()))) {
          score *= 1.5;
        }
        
        // Find evidence context
        const keywordIndex = text.toLowerCase().indexOf(keywordLower);
        if (keywordIndex >= 0) {
          const start = Math.max(0, keywordIndex - 50);
          const end = Math.min(text.length, keywordIndex + keyword.length + 50);
          const context = text.slice(start, end);
          evidence.push(context);
        }
      }
    }
    
    // Also check title as potential match
    const titleLower = candidate.title.toLowerCase();
    if (text.toLowerCase().includes(titleLower)) {
      score += 2; // Higher weight for title match
      
      // Find evidence context for title
      const titleIndex = text.toLowerCase().indexOf(titleLower);
      if (titleIndex >= 0) {
        const start = Math.max(0, titleIndex - 50);
        const end = Math.min(text.length, titleIndex + candidate.title.length + 50);
        const context = text.slice(start, end);
        evidence.push(context);
      }
    }
    
    // Limit evidence to top 3 strongest matches
    const uniqueEvidence = [...new Set(evidence)].slice(0, 3);
    
    return {
      title: candidate.title,
      evidence: uniqueEvidence,
      tfidfScore: score
    };
  });
}

/**
 * Rank themes with GPT-4
 * 
 * @param assetName The name of the asset
 * @param assetDescription The description of the asset
 * @param candidates Candidate themes to rank
 * @returns Ranked themes with relevance scores
 */
async function rankThemesWithGPT(
  assetName: string,
  assetDescription: string,
  candidates: CandidateTheme[]
): Promise<Array<CandidateTheme & { relevanceScore: number }>> {
  const prompt = `
    You are analyzing themes for the asset "${assetName}".
    
    Asset description: ${assetDescription}
    
    Rank the following candidate themes by relevance (0.0 to 1.0):
    ${candidates.map((c, i) => `${i + 1}. ${c.title}`).join('\n')}
    
    Return a JSON array with scores, e.g.: [{"index": 1, "score": 0.85}, ...]
    Only include themes with score >= 0.25.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  try {
    const content = response.choices[0].message.content || '{"rankings": []}';
    const result = JSON.parse(content);
    const rankings = result.rankings || [];
    
    return rankings.map((r: any) => ({
      ...candidates[r.index - 1],
      relevanceScore: r.score
    }));
  } catch (error) {
    themeScoutLogger.error('Error parsing GPT-4 response:', error);
    // Fallback to TF-IDF scores if GPT parsing fails
    return candidates.map(c => ({
      ...c, 
      relevanceScore: Math.min(c.tfidfScore / 10, 0.95)
    }));
  }
}

/**
 * Estimates token count for a text string
 * This is a very rough estimate - for production you should use a proper tokenizer
 * @param text The text to estimate tokens for
 * @returns Estimated token count
 */
function countTokens(text: string): number {
  // Very rough estimate: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Add a job to the theme-scout queue
 * 
 * @param assetId The ID of the asset to scout themes for
 * @param userId The ID of the user who owns the asset
 * @param focusKeywords Optional keywords to prioritize
 * @returns The created job
 */
export async function queueThemeScoutJob(
  assetId: string,
  userId: string,
  focusKeywords?: string[]
) {
  return themeScoutQueue.add(
    `scout-themes:${assetId}`,
    { assetId, userId, focusKeywords },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  );
}
