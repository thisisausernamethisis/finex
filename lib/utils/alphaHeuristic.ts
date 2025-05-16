import OpenAI from 'openai';
import { logger } from '../logger';
import {
  alphaCacheSize,
  alphaCacheHits,
  alphaCacheMisses,
} from '../metrics';

const alphaLogger = logger.child({ component: 'AlphaHeuristic' });

// Allow ops to tune via env, but fall back to legacy values
const MAX_CACHE_SIZE = parseInt(process.env.ALPHA_CACHE_MAX ?? '50', 10);
const TTL_MS          = parseInt(process.env.ALPHA_CACHE_TTL_MS ?? '300000', 10); // 5 min

export const alphaCache = new Map<string, { alpha: number; ts: number }>();

/**
 * Get cached alpha value if available and within TTL
 * @param query Search query
 * @returns Alpha value if found and valid, undefined otherwise
 */
export function getCachedAlpha(query: string): number | undefined {
  const cacheKey = query.toLowerCase();
  const hit = alphaCache.get(cacheKey);
  // Hit + fresh?
  if (hit && Date.now() - hit.ts < TTL_MS) {
    alphaCacheHits.inc();
    /* refresh LRU order */
    alphaCache.delete(cacheKey);
    alphaCache.set(cacheKey, hit);
    return hit.alpha;
  }
  alphaCacheMisses.inc();
}

type Hit = { id: string; score: number };

/**
 * Interface for alpha scoring options
 */
export interface AlphaOptions {
  query?: string;            // The search query text
  domain?: string;           // Single domain (for backward compatibility)
  domains?: string[];        // Multiple domains array
  alpha?: number;            // Explicit alpha override
  useGPT?: boolean;          // Whether to use GPT for scoring (default: follows env var)
}

/**
 * Merges vector and keyword search results with dynamic alpha weighting
 * 
 * @param vec Vector search results
 * @param kw Keyword/BM25 search results
 * @param options Scoring options including domain and explicit alpha
 * @returns Promise resolving to merged results sorted by score
 */
export async function scoreMerge(
  vec: Hit[],
  kw: Hit[],
  { domain, alpha, query }: { domain?: string; alpha?: number; query?: string }
) {
  // Use explicit alpha if provided, otherwise compute dynamically
  const α = alpha !== undefined ? alpha : await pickAlpha(query, domain ? [domain] : undefined);
  const byId = new Map<string, number>();

  for (const h of vec) byId.set(h.id, (byId.get(h.id) ?? 0) + α * h.score);
  for (const h of kw)  byId.set(h.id, (byId.get(h.id) ?? 0) + (1 - α) * h.score);

  return Array.from(byId.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

// OpenAI client for GPT-based alpha calculation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Feature flag for GPT-based alpha
const useGPT = process.env.DYNAMIC_ALPHA_GPT === 'true';

/**
 * Compatibility wrapper for dynamic alpha calculation
 * Provides backward compatibility with existing code
 * 
 * @param query The search query
 * @param domain String domain or array of domains
 * @returns Promise resolving to alpha value between 0-1
 */
export async function pickAlpha(
  query?: string,
  domain?: string | string[]
): Promise<number> {
  // Early return for empty query
  if (!query) return 0.5;
  
  // Check cache first
  try {
    const cached = getCachedAlpha(query);
    if (cached !== undefined) {
      return cached;
    }
  } catch (e) {
    // Ignore cache errors
    alphaLogger.debug('Cache lookup failed', { error: String(e) });
  }
  
  // Cache miss - calculate alpha
  const alpha = await calculateAlpha(query, { domain });
  
  /* Store in cache & evict oldest */
  try {
    const cacheKey = query.toLowerCase();
    alphaCache.set(cacheKey, { alpha, ts: Date.now() });
    if (alphaCache.size > MAX_CACHE_SIZE) {
      const oldest = alphaCache.keys().next().value;
      oldest && alphaCache.delete(oldest);
    }
    alphaCacheSize.set(alphaCache.size);
  } catch (e) {
    // Ignore cache errors
    alphaLogger.debug('Cache store failed', { error: String(e) });
  }
  
  return alpha;
}

/**
 * Calculate optimal alpha value using either GPT or heuristics
 * 
 * @param query The search query
 * @param options Optional parameters including domain
 * @returns Promise resolving to alpha value between 0-1
 */
export async function calculateAlpha(
  query: string,
  options: {
    domain?: string | string[];
    useGPT?: boolean;
  } = {}
): Promise<number> {
  if (!query) return 0.5; // Default for empty queries
  
  // Extract parameters
  const domains = extractDomains(options.domain);
  const useGptForQuery = options.useGPT ?? process.env.DYNAMIC_ALPHA_GPT === 'true';
  
  // Basic query analysis for complexity determination
  const queryStat = analyzeQuery(query);
  
  // If GPT advisor enabled, use it for complex queries
  if (useGptForQuery && queryStat.complexity > 0.7) {
    try {
      return await gptBasedAlpha(query, domains);
    } catch (error) {
      alphaLogger.warn('GPT alpha calculation failed, using heuristic', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Fall back to heuristic on error
    }
  }
  
  // Use heuristic approach
  return calculateHeuristicAlpha(query, domains);
}

/**
 * Extract domains from various input formats
 */
function extractDomains(domain?: string | string[]): string[] | undefined {
  if (!domain) return undefined;
  return Array.isArray(domain) ? domain : [domain];
}

/**
 * Calculate alpha based on query heuristics and domain context
 * 
 * @param query The search query text
 * @param domains Optional array of domains for context
 * @returns Number between 0.2 and 0.8 representing optimal alpha
 */
export function calculateHeuristicAlpha(
  query?: string,
  domains?: string[]
): number {
  if (!query) return 0.5; // Default for empty queries
  
  // Get query characteristics
  const queryStat = analyzeQuery(query);
  
  // Domain-specific alpha adjustments
  let domainAdjustment = 0;
  if (domains?.length) {
    if (domains.some(d => d === 'financial' || d === 'economics' || d === 'FINANCE')) {
      domainAdjustment = 0.1; // Higher vector weight for financial domains
    } else if (domains.some(d => d === 'news' || d === 'current_events')) {
      domainAdjustment = -0.1; // Lower vector weight for news domains
    } else if (domains.some(d => d === 'TECHNICAL' || d === 'REGULATORY')) {
      domainAdjustment = -0.05; // Slightly lower vector weight for technical domains
    }
  }
  
  // Check for quoted phrases and special operators
  const hasQuotes = query.includes('"') || query.includes("'");
  const hasOperators = /[+\-]/.test(query);
  
  // Adjust for special syntax common in keyword searches
  const syntaxAdjustment = (hasQuotes ? -0.1 : 0) + (hasOperators ? -0.05 : 0);
  
  // Check if query is a question
  const isQuestion = /\?$|^(what|how|when|where|why|who|which)/i.test(query);
  const questionAdjustment = isQuestion ? 0.05 : 0;
  
  // Base calculation from query characteristics
  const baseAlpha = 0.5 + 
    (queryStat.conceptual * 0.2) - 
    (queryStat.keywords * 0.15) +
    (queryStat.complexity * 0.1) +
    domainAdjustment +
    syntaxAdjustment +
    questionAdjustment;
  
  // Clamp to valid range (narrower than calculateAlpha's 0.1-0.9)
  return Math.max(0.2, Math.min(0.8, baseAlpha));
}

/**
 * Analyze query characteristics for heuristic alpha calculation
 */
function analyzeQuery(query: string) {
  const keywords = [
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 
    'define', 'find', 'list', 'show', 'tell', 'explain'
  ];
  
  const conceptualTerms = [
    'concept', 'theory', 'framework', 'approach', 'methodology', 'paradigm', 
    'philosophy', 'strategy', 'analysis', 'understand', 'relationship', 
    'impact', 'effect', 'influence', 'implication'
  ];
  
  // Normalize and tokenize query
  const tokens = query.toLowerCase().split(/\s+/);
  
  // Calculate metrics
  const keywordCount = tokens.filter(t => keywords.includes(t)).length;
  const conceptualCount = tokens.filter(t => conceptualTerms.includes(t)).length;
  
  // Normalized scores
  const keywordScore = tokens.length ? keywordCount / tokens.length : 0;
  const conceptualScore = tokens.length ? conceptualCount / tokens.length : 0;
  
  // Complexity heuristic (average word length can be a proxy for complexity)
  const avgWordLength = tokens.length ? tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length : 0;
  const complexity = Math.min(1, Math.max(0, (avgWordLength - 3) / 5));
  
  return {
    keywords: keywordScore,
    conceptual: conceptualScore,
    complexity
  };
}

/**
 * Use GPT to determine optimal alpha for complex queries
 */
async function gptBasedAlpha(query: string, domains?: string[]): Promise<number> {
  const prompt = `
    As a search system optimizer, determine the optimal balance between 
    semantic (vector) search and keyword (BM25) search for this query:

    Query: ${query}
    ${domains?.length ? `Domains: ${domains.join(', ')}` : ''}

    The alpha parameter determines this balance:
    - Higher alpha (0.7-0.9): Prioritize semantic understanding and conceptual matching
    - Balanced alpha (0.4-0.6): Equal weight to both semantic and keyword matching
    - Lower alpha (0.1-0.3): Prioritize keyword matching and exact terms

    Based on the query characteristics, respond with a single decimal value between 0.1 and 0.9.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a search optimization assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 5
    });

    // Extract the alpha value from response
    const alphaText = completion.choices[0]?.message?.content?.trim() || '0.5';
    const alpha = parseFloat(alphaText);
    
    // Validate and clamp the result
    if (isNaN(alpha)) return 0.5;
    return Math.max(0.1, Math.min(0.9, alpha));
  } catch (error) {
    alphaLogger.error('GPT alpha calculation error', { 
      error: error instanceof Error ? error.message : String(error),
      query
    });
    throw error;
  }
}
