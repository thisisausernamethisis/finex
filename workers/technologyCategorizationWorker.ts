import { Worker, Job, QueueEvents } from 'bullmq';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { contextAssemblyService } from '../lib/services/contextAssemblyService';
import { jobsProcessed, jobsFailed, jobsActive } from '../lib/metrics';
import { emitJobEvent } from '../lib/events/eventEmitter';

// Define TechnologyCategory enum locally
enum TechnologyCategory {
  AI_COMPUTE = 'AI_COMPUTE',
  ROBOTICS_PHYSICAL_AI = 'ROBOTICS_PHYSICAL_AI',
  QUANTUM_COMPUTING = 'QUANTUM_COMPUTING',
  TRADITIONAL_TECH = 'TRADITIONAL_TECH',
  BIOTECH_HEALTH = 'BIOTECH_HEALTH',
  FINTECH_CRYPTO = 'FINTECH_CRYPTO',
  ENERGY_CLEANTECH = 'ENERGY_CLEANTECH',
  SPACE_DEFENSE = 'SPACE_DEFENSE',
  OTHER = 'OTHER'
}

// Logger for this worker
const workerLogger = logger.child({ component: 'TechnologyCategorizationWorker', queue: 'tech-categorization' });

// Redis connection options for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// OpenAI API constants
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

// Queue name
const QUEUE_NAME = 'tech-categorization';

// Job data interface
interface CategorizationJobData {
  assetId: string;
  forceRecategorize?: boolean;
}

// Worker function to start processing jobs
export function startTechnologyCategorizationWorker() {
  workerLogger.info('Starting technology categorization worker');
  
  // Create worker
  const worker = new Worker<CategorizationJobData>(
    QUEUE_NAME,
    async (job: Job<CategorizationJobData>) => processCategorizationJob(job),
    {
      connection: redisConnection,
      concurrency: 3, // Process up to 3 categorization jobs at once
      removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
      removeOnFail: { count: 100 } // Keep last 100 failed jobs
    }
  );
  
  // Listen for events
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection });
  queueEvents.setMaxListeners(0); // Prevent MaxListenersExceededWarning
  
  // Log worker events and emit application events
  worker.on('completed', (job) => {
    workerLogger.info('Technology categorization job completed', { jobId: job.id });
    jobsProcessed.inc({ type: 'tech-categorization' });
    
    // Emit job completed event
    emitJobEvent({
      type: 'tech-categorization',
      jobId: job.id || 'unknown',
      status: 'completed',
      timestamp: new Date().toISOString()
    });
  });
  
  worker.on('failed', (job, error) => {
    workerLogger.error('Technology categorization job failed', { 
      jobId: job?.id,
      error: error.message
    });
    jobsFailed.inc({ type: 'tech-categorization' });
    
    // Emit job failed event
    emitJobEvent({
      type: 'tech-categorization',
      jobId: job?.id || 'unknown',
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  });
  
  worker.on('active', (job) => {
    workerLogger.debug('Technology categorization job started', { jobId: job.id });
    jobsActive.inc({ queue: 'tech-categorization' });
  });
  
  // Note: 'waiting' event is not available in BullMQ Worker, only in Queue
  
  return worker;
}

// Process an individual technology categorization job
export async function processCategorizationJob(job: Job<CategorizationJobData>) {
  const { assetId, forceRecategorize = false } = job.data;
  
  workerLogger.info('Processing technology categorization job', { 
    jobId: job.id,
    assetId,
    forceRecategorize
  });
  
  // Emit job started event
  emitJobEvent({
    type: 'tech-categorization',
    jobId: job.id ?? `categorization:${assetId}`,
    status: 'started',
    timestamp: new Date().toISOString(),
    data: { assetId, forceRecategorize }
  });
  
  try {
    // Get the asset to categorize
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
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    // Check if asset already has a category and we're not forcing recategorization
    if (asset.category && !forceRecategorize) {
      workerLogger.info('Asset already categorized, skipping', { 
        assetId, 
        category: asset.category 
      });
      return {
        skipped: true,
        reason: 'Already categorized',
        existingCategory: asset.category
      };
    }
    
    // 1. Assemble context from asset themes/cards/chunks
    const context = await assembleAssetContextForCategorization(assetId, 5000); // 5K token limit for categorization
    
    // 2. Call AI for categorization + insights
    const categorization = await analyzeAssetTechnology(asset, context);
    
    // 3. Update asset with category + insights
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        category: categorization.category,
        categoryConfidence: categorization.confidence,
        categoryInsights: JSON.stringify(categorization.insights)
      }
    });
    
    workerLogger.info('Asset categorized successfully', {
      assetId,
      category: categorization.category,
      confidence: categorization.confidence
    });
    
    // Emit job completed event with result
    emitJobEvent({
      type: 'tech-categorization',
      jobId: job.id ?? `categorization:${assetId}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: { 
        assetId,
        category: categorization.category,
        confidence: categorization.confidence
      }
    });
    
    return {
      success: true,
      assetId,
      category: categorization.category,
      confidence: categorization.confidence,
      insights: categorization.insights
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    workerLogger.error('Technology categorization job failed', {
      assetId,
      error: errorMessage
    });
    
    // Emit job failed event
    emitJobEvent({
      type: 'tech-categorization',
      jobId: job.id ?? `categorization:${assetId}`,
      status: 'failed',
      timestamp: new Date().toISOString(),
      data: { 
        assetId,
        error: errorMessage
      }
    });
    
    // Re-throw to let BullMQ handle the failure
    throw error;
  }
}

// Assemble context specifically for asset categorization
async function assembleAssetContextForCategorization(assetId: string, tokenLimit: number): Promise<string> {
  try {
    // Get asset with all related data
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
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    let context = `Asset Name: ${asset.name}\n`;
    if (asset.description) {
      context += `Description: ${asset.description}\n`;
    }
    
    context += `\nThemes and Analysis:\n`;
    
    // Add theme and card content
    for (const theme of asset.themes) {
      context += `\nTheme: ${theme.name}\n`;
      if (theme.description) {
        context += `Theme Description: ${theme.description}\n`;
      }
      
      for (const card of theme.cards) {
        context += `  Card: ${card.title}\n`;
        if (card.content) {
          context += `  Content: ${card.content}\n`;
        }
        
        // Add relevant chunks
        for (const chunk of card.chunks) {
          if (chunk.content && chunk.content.length > 50) { // Only meaningful chunks
            context += `    Chunk: ${chunk.content.substring(0, 500)}...\n`;
          }
        }
      }
    }
    
    // Truncate to token limit (rough approximation: 1 token ≈ 4 characters)
    const charLimit = tokenLimit * 4;
    if (context.length > charLimit) {
      context = context.substring(0, charLimit) + '\n... [truncated]';
    }
    
    return context;
    
  } catch (error) {
    workerLogger.error('Failed to assemble asset context', {
      assetId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Call OpenAI to analyze the asset's technology category
async function analyzeAssetTechnology(
  asset: any,
  context: string
): Promise<{
  category: TechnologyCategory;
  confidence: number;
  reasoning: string;
  insights: any;
}> {
  workerLogger.debug('Calling AI for technology categorization', { assetId: asset.id });
  
  const prompt = `
    You are a technology analysis AI specializing in categorizing assets by their core technology focus.
    
    Your task is to analyze an asset and categorize it into one of these technology categories:
    
    TECHNOLOGY CATEGORIES:
    - AI_COMPUTE: AI/ML infrastructure, compute platforms, GPU manufacturers, AI model companies
    - ROBOTICS_PHYSICAL_AI: Robotics, autonomous vehicles, physical AI, manufacturing automation
    - QUANTUM_COMPUTING: Quantum computing hardware/software, quantum research companies
    - BIOTECH_HEALTH: Biotechnology, pharmaceuticals, medical devices, health AI
    - FINTECH_CRYPTO: Financial technology, cryptocurrency, blockchain, digital finance
    - ENERGY_CLEANTECH: Clean energy, solar, batteries, energy storage, green technology
    - SPACE_DEFENSE: Space technology, satellites, aerospace, defense technology
    - TRADITIONAL_TECH: Traditional software, established tech companies without emerging focus
    - OTHER: Companies that don't fit clear technology categories
    
    ASSET INFORMATION:
    ${context}
    
    Based on this information, provide:
    1. The most appropriate technology category
    2. Confidence score (0.0 to 1.0) based on evidence strength
    3. Clear reasoning for the categorization
    4. Detailed insights about the asset's technology positioning
    
    IMPORTANT: 
    - Focus on the company's CORE technology business, not secondary activities
    - Consider future potential and technology focus, not just current revenue
    - Be specific about what technology indicators led to your decision
    - Higher confidence (>0.8) for clear technology leaders, lower for diversified companies
    
    Format your response as valid JSON with this structure:
    {
      "category": "CATEGORY_NAME",
      "confidence": 0.85,
      "reasoning": "Detailed explanation of categorization logic",
      "insights": {
        "primary_technology_focus": "Main technology area description",
        "technology_maturity": "emerging|developing|established",
        "competitive_position": "Description of market position",
        "disruption_exposure": "How exposed to technology disruption",
        "revenue_breakdown": "Estimated % from core technology vs other",
        "future_potential": "Assessment of technology trajectory",
        "key_technologies": ["list", "of", "key", "technologies"],
        "market_signals": ["indicators", "of", "technology", "leadership"]
      }
    }
  `;
  
  try {
    // Check if API key is set
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    // Prepare the request payload
    const payload = {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'You are a technology analysis expert that provides accurate, evidence-based asset categorizations.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more consistent categorization
      response_format: { type: 'json_object' }
    };
    
    // Make the API request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    const responseContent = responseData.choices[0]?.message?.content || '';
    
    if (!responseContent) {
      throw new Error('Empty response from OpenAI API');
    }
    
    // Parse response
    const parsedResponse = JSON.parse(responseContent);
    
    // Validate and normalize the category
    const category = validateTechnologyCategory(parsedResponse.category);
    const confidence = Math.max(0, Math.min(1, parseFloat(parsedResponse.confidence) || 0.5));
    
    return {
      category,
      confidence,
      reasoning: parsedResponse.reasoning || 'AI categorization completed',
      insights: parsedResponse.insights || {}
    };
    
  } catch (error) {
    workerLogger.error('Error calling OpenAI API for categorization', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      assetId: asset.id
    });
    throw new Error('Failed to categorize asset with AI: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Validate and normalize technology category
function validateTechnologyCategory(category: string): TechnologyCategory {
  const normalizedCategory = category?.toUpperCase().replace(/[^A-Z_]/g, '');
  
  // Check if it's a valid enum value
  if (Object.values(TechnologyCategory).includes(normalizedCategory as TechnologyCategory)) {
    return normalizedCategory as TechnologyCategory;
  }
  
  // Fallback mapping for common variations
  const categoryMappings: Record<string, TechnologyCategory> = {
    'AI': TechnologyCategory.AI_COMPUTE,
    'ARTIFICIAL_INTELLIGENCE': TechnologyCategory.AI_COMPUTE,
    'MACHINE_LEARNING': TechnologyCategory.AI_COMPUTE,
    'ROBOTICS': TechnologyCategory.ROBOTICS_PHYSICAL_AI,
    'QUANTUM': TechnologyCategory.QUANTUM_COMPUTING,
    'BIOTECH': TechnologyCategory.BIOTECH_HEALTH,
    'HEALTHCARE': TechnologyCategory.BIOTECH_HEALTH,
    'FINTECH': TechnologyCategory.FINTECH_CRYPTO,
    'CRYPTO': TechnologyCategory.FINTECH_CRYPTO,
    'ENERGY': TechnologyCategory.ENERGY_CLEANTECH,
    'CLEANTECH': TechnologyCategory.ENERGY_CLEANTECH,
    'SPACE': TechnologyCategory.SPACE_DEFENSE,
    'DEFENSE': TechnologyCategory.SPACE_DEFENSE,
    'TRADITIONAL': TechnologyCategory.TRADITIONAL_TECH
  };
  
  for (const [key, value] of Object.entries(categoryMappings)) {
    if (normalizedCategory.includes(key)) {
      return value;
    }
  }
  
  // Default fallback
  return TechnologyCategory.OTHER;
} 