import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AssetRepository } from '../../../../lib/repositories/assetRepository';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { serverError, unauthorized, badRequest, notFound } from '../../../../lib/utils/http';
import { validateSchema } from '../../../../lib/utils/api';
import { Queue } from 'bullmq';

// Define TechnologyCategory enum locally until Prisma client is properly generated
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

// Create a route-specific logger
const logger = createChildLogger({ route: 'POST /api/assets/categorize' });

// Schema validation for categorization request
const categorizeAssetSchema = z.object({
  assetId: z.string().cuid(),
  forceRecategorize: z.boolean().optional().default(false),
  useBackground: z.boolean().optional().default(true) // Use background worker by default
});

// Create repository instance
const assetRepository = new AssetRepository();

// Redis connection for queue
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create tech categorization queue
const techCategorizationQueue = new Queue('tech-categorization', { connection: redisConnection });

/**
 * POST /api/assets/categorize
 * 
 * Categorizes an asset using AI analysis. Can run synchronously or queue for background processing.
 * Returns the updated asset with category, confidence, and insights, or job information for background processing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(categorizeAssetSchema, body, logger);
    
    if (!validation.success) {
      return validation.error;
    }
    
    const { assetId, forceRecategorize, useBackground } = validation.data;
    
    // Get the asset to categorize
    const asset = await assetRepository.getAssetById(assetId, user.id);
    
    if (!asset) {
      return notFound('Asset not found or access denied', logger);
    }
    
    // Check if asset already has a category and we're not forcing recategorization
    if (asset.category && !forceRecategorize) {
      logger.debug('Asset already categorized', { assetId, category: asset.category });
      return NextResponse.json({
        message: 'Asset already categorized',
        asset,
        skipped: true
      });
    }
    
    // Choose processing method
    if (useBackground) {
      // Queue job for background processing
      const job = await techCategorizationQueue.add(
        'categorize-asset',
        { assetId, forceRecategorize },
        {
          priority: 1, // Normal priority
          attempts: 3, // Retry up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      );
      
      logger.info('Asset categorization job queued', {
        assetId,
        jobId: job.id,
        useBackground: true
      });
      
      return NextResponse.json({
        message: 'Asset categorization job queued for background processing',
        jobId: job.id,
        assetId,
        queued: true
      });
      
    } else {
      // Process synchronously with fallback to rule-based
      logger.debug('Processing asset categorization synchronously', { assetId });
      
      try {
                 // Try AI categorization with timeout
         const categorization = await Promise.race([
           categorizeAssetWithAI(asset.name, asset.description),
           new Promise((_, reject) => 
             setTimeout(() => reject(new Error('AI categorization timeout')), 30000)
           )
         ]) as any;
        
        // Update the asset with categorization results
        const updatedAsset = await assetRepository.updateAsset(
          assetId,
          {
            category: categorization.category,
            categoryConfidence: categorization.confidence,
            categoryInsights: JSON.stringify(categorization.insights)
          },
          user.id
        );
        
        if (!updatedAsset) {
          return serverError(new Error('Failed to update asset with categorization'), logger);
        }
        
        logger.info('Asset categorized successfully (sync)', {
          assetId,
          category: categorization.category,
          confidence: categorization.confidence
        });
        
        return NextResponse.json({
          message: 'Asset categorized successfully',
          asset: updatedAsset,
          categorization: {
            category: categorization.category,
            confidence: categorization.confidence,
            reasoning: categorization.reasoning
          },
          method: 'synchronous'
        });
        
      } catch (error) {
        // Fallback to rule-based categorization
        logger.warn('AI categorization failed, falling back to rule-based', {
          assetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        const fallbackCategorization = await categorizeAssetWithRules(asset.name, asset.description);
        
        const updatedAsset = await assetRepository.updateAsset(
          assetId,
          {
            category: fallbackCategorization.category,
            categoryConfidence: fallbackCategorization.confidence,
            categoryInsights: JSON.stringify(fallbackCategorization.insights)
          },
          user.id
        );
        
        logger.info('Asset categorized with fallback method', {
          assetId,
          category: fallbackCategorization.category,
          confidence: fallbackCategorization.confidence
        });
        
        return NextResponse.json({
          message: 'Asset categorized using fallback method',
          asset: updatedAsset,
          categorization: {
            category: fallbackCategorization.category,
            confidence: fallbackCategorization.confidence,
            reasoning: fallbackCategorization.reasoning
          },
          method: 'fallback'
        });
      }
    }
    
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

/**
 * Rule-based asset categorization function (fallback)
 * Used when AI categorization is not available or fails
 */
async function categorizeAssetWithRules(
  name: string, 
  description?: string
): Promise<{
  category: TechnologyCategory;
  confidence: number;
  reasoning: string;
  insights: any;
}> {
  // Simple rule-based categorization for demo purposes
  // In production, this would use OpenAI/Anthropic for sophisticated analysis
  
  const text = `${name} ${description || ''}`.toLowerCase();
  
  let category: TechnologyCategory;
  let confidence: number;
  let reasoning: string;
  
  if (text.includes('nvidia') || text.includes('ai') || text.includes('artificial intelligence') || 
      text.includes('machine learning') || text.includes('neural') || text.includes('llm') ||
      text.includes('compute') || text.includes('gpu') || text.includes('openai') || 
      text.includes('anthropic') || text.includes('microsoft') || text.includes('google')) {
    category = TechnologyCategory.AI_COMPUTE;
    confidence = 0.85;
    reasoning = 'Asset shows strong indicators of AI/compute focus based on name and description analysis';
  } else if (text.includes('tesla') || text.includes('robot') || text.includes('autonomous') ||
             text.includes('self-driving') || text.includes('automation') || text.includes('physical ai') ||
             text.includes('manufacturing') || text.includes('logistics')) {
    category = TechnologyCategory.ROBOTICS_PHYSICAL_AI;
    confidence = 0.82;
    reasoning = 'Asset demonstrates robotics and physical AI characteristics';
  } else if (text.includes('quantum') || text.includes('qubit') || text.includes('ionq') ||
             text.includes('quantum computing') || text.includes('quantum advantage')) {
    category = TechnologyCategory.QUANTUM_COMPUTING;
    confidence = 0.90;
    reasoning = 'Asset clearly focused on quantum computing technology';
  } else if (text.includes('bio') || text.includes('health') || text.includes('medical') ||
             text.includes('pharmaceutical') || text.includes('drug') || text.includes('therapy')) {
    category = TechnologyCategory.BIOTECH_HEALTH;
    confidence = 0.75;
    reasoning = 'Asset appears to be in biotechnology or healthcare sector';
  } else if (text.includes('crypto') || text.includes('blockchain') || text.includes('fintech') ||
             text.includes('defi') || text.includes('bitcoin') || text.includes('ethereum')) {
    category = TechnologyCategory.FINTECH_CRYPTO;
    confidence = 0.78;
    reasoning = 'Asset shows fintech or cryptocurrency focus';
  } else if (text.includes('solar') || text.includes('energy') || text.includes('clean') ||
             text.includes('renewable') || text.includes('battery') || text.includes('electric')) {
    category = TechnologyCategory.ENERGY_CLEANTECH;
    confidence = 0.72;
    reasoning = 'Asset demonstrates clean energy or energy technology focus';
  } else if (text.includes('space') || text.includes('satellite') || text.includes('defense') ||
             text.includes('aerospace') || text.includes('spacex') || text.includes('rocket')) {
    category = TechnologyCategory.SPACE_DEFENSE;
    confidence = 0.80;
    reasoning = 'Asset appears to be in space or defense technology sector';
  } else {
    category = TechnologyCategory.TRADITIONAL_TECH;
    confidence = 0.60;
    reasoning = 'Asset does not show clear indicators of emerging technology focus';
  }
  
  const insights = {
    primary_indicators: extractKeywords(text),
    technology_signals: analyzeTechnologySignals(text),
    market_category: category,
    confidence_factors: generateConfidenceFactors(text, category),
    recommendations: generateRecommendations(category, confidence)
  };
  
  return {
    category,
    confidence,
    reasoning,
    insights
  };
}

function extractKeywords(text: string): string[] {
  const techKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'neural', 'gpu', 'compute',
    'robot', 'autonomous', 'automation', 'physical ai',
    'quantum', 'qubit', 'quantum computing',
    'bio', 'health', 'medical', 'pharmaceutical',
    'crypto', 'blockchain', 'fintech', 'defi',
    'solar', 'energy', 'clean', 'renewable', 'battery',
    'space', 'satellite', 'defense', 'aerospace'
  ];
  
  return techKeywords.filter(keyword => text.includes(keyword));
}

function analyzeTechnologySignals(text: string): {
  emerging_tech: boolean;
  innovation_indicators: string[];
  market_maturity: string;
} {
  const emergingTechTerms = ['ai', 'quantum', 'robot', 'autonomous', 'blockchain'];
  const innovationTerms = ['breakthrough', 'revolutionary', 'next-generation', 'cutting-edge'];
  
  const hasEmergingTech = emergingTechTerms.some(term => text.includes(term));
  const foundInnovationTerms = innovationTerms.filter(term => text.includes(term));
  
  let maturity = 'mature';
  if (hasEmergingTech) maturity = 'emerging';
  if (foundInnovationTerms.length > 0) maturity = 'early-stage';
  
  return {
    emerging_tech: hasEmergingTech,
    innovation_indicators: foundInnovationTerms,
    market_maturity: maturity
  };
}

function generateConfidenceFactors(text: string, category: TechnologyCategory): string[] {
  const factors = [];
  
  if (text.includes('leading') || text.includes('market leader')) {
    factors.push('Market leadership indicators');
  }
  
  if (text.includes('revenue') || text.includes('billion') || text.includes('profitable')) {
    factors.push('Financial strength indicators');
  }
  
  if (text.includes('research') || text.includes('development') || text.includes('innovation')) {
    factors.push('R&D and innovation focus');
  }
  
  // Category-specific factors
  switch (category) {
    case TechnologyCategory.AI_COMPUTE:
      if (text.includes('data center') || text.includes('training') || text.includes('inference')) {
        factors.push('AI infrastructure indicators');
      }
      break;
    case TechnologyCategory.ROBOTICS_PHYSICAL_AI:
      if (text.includes('manufacturing') || text.includes('logistics') || text.includes('automation')) {
        factors.push('Industrial application indicators');
      }
      break;
  }
  
  return factors;
}

function generateRecommendations(category: TechnologyCategory, confidence: number): string[] {
  const recommendations = [];
  
  if (confidence < 0.7) {
    recommendations.push('Consider manual review due to lower confidence score');
  }
  
  if (confidence > 0.9) {
    recommendations.push('High confidence categorization - suitable for automated processing');
  }
  
  // Category-specific recommendations
  switch (category) {
    case TechnologyCategory.AI_COMPUTE:
      recommendations.push('Monitor AI regulation developments');
      recommendations.push('Track compute cost trends and efficiency improvements');
      break;
    case TechnologyCategory.ROBOTICS_PHYSICAL_AI:
      recommendations.push('Assess regulatory environment for autonomous systems');
      recommendations.push('Monitor manufacturing automation adoption rates');
      break;
    case TechnologyCategory.QUANTUM_COMPUTING:
      recommendations.push('Track quantum supremacy milestones');
      recommendations.push('Monitor government quantum initiatives');
      break;
  }
  
  return recommendations;
}

/**
 * AI-powered asset categorization function
 * Simplified version of the worker logic for synchronous requests
 */
async function categorizeAssetWithAI(
  name: string, 
  description?: string
): Promise<{
  category: TechnologyCategory;
  confidence: number;
  reasoning: string;
  insights: any;
}> {
  // For synchronous requests, we'll use a simplified AI approach
  // The full context assembly is too complex for sync requests
  
  const prompt = `
    You are a technology analysis AI. Categorize this asset into one of these categories:
    
    CATEGORIES:
    - AI_COMPUTE: AI/ML infrastructure, compute platforms, GPU manufacturers
    - ROBOTICS_PHYSICAL_AI: Robotics, autonomous vehicles, physical AI
    - QUANTUM_COMPUTING: Quantum computing hardware/software
    - BIOTECH_HEALTH: Biotechnology, pharmaceuticals, medical devices
    - FINTECH_CRYPTO: Financial technology, cryptocurrency, blockchain
    - ENERGY_CLEANTECH: Clean energy, solar, batteries, green technology
    - SPACE_DEFENSE: Space technology, satellites, aerospace, defense
    - TRADITIONAL_TECH: Traditional software companies
    - OTHER: Companies that don't fit clear categories
    
    ASSET: ${name}
    DESCRIPTION: ${description || 'No description provided'}
    
    Respond with JSON:
    {
      "category": "CATEGORY_NAME",
      "confidence": 0.85,
      "reasoning": "Brief explanation",
      "insights": {
        "primary_focus": "Technology area",
        "market_position": "Market assessment"
      }
    }
  `;
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a technology categorization expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      category: validateTechnologyCategorySimple(result.category),
      confidence: Math.max(0, Math.min(1, parseFloat(result.confidence) || 0.5)),
      reasoning: result.reasoning || 'AI categorization completed',
      insights: result.insights || {}
    };
    
  } catch (error) {
    throw new Error(`AI categorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateTechnologyCategorySimple(category: string): TechnologyCategory {
  const normalizedCategory = category?.toUpperCase().replace(/[^A-Z_]/g, '');
  
  if (Object.values(TechnologyCategory).includes(normalizedCategory as TechnologyCategory)) {
    return normalizedCategory as TechnologyCategory;
  }
  
  // Simple fallback mapping
  if (normalizedCategory.includes('AI') || normalizedCategory.includes('COMPUTE')) {
    return TechnologyCategory.AI_COMPUTE;
  }
  if (normalizedCategory.includes('ROBOT') || normalizedCategory.includes('PHYSICAL')) {
    return TechnologyCategory.ROBOTICS_PHYSICAL_AI;
  }
  if (normalizedCategory.includes('QUANTUM')) {
    return TechnologyCategory.QUANTUM_COMPUTING;
  }
  
  return TechnologyCategory.OTHER;
} 