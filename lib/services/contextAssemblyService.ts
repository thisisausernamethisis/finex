import { prisma } from '../db';
import { logger } from '../logger';
import { hybridSearch } from './searchService';

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'ContextAssemblyService' });

/**
 * Assembles a context string for matrix analysis from asset and scenario data
 * This includes asset details, scenario details, and relevant evidence from cards and chunks
 * 
 * @param assetId The ID of the asset
 * @param scenarioId The ID of the scenario
 * @param tokenLimit The approximate maximum number of tokens to include (based on character count)
 * @returns A formatted context string ready for AI processing
 */
export async function assembleMatrixContext(
  assetId: string,
  scenarioId: string,
  tokenLimit: number = 8000
): Promise<string> {
  serviceLogger.debug('Assembling matrix context', { assetId, scenarioId, tokenLimit });
  
  try {
    // Fetch asset and scenario data
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
    
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
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
    
    if (!asset || !scenario) {
      throw new Error(`Asset or scenario not found: assetId=${assetId}, scenarioId=${scenarioId}`);
    }
    
    // Start building the context string
    let context = `# ASSET: ${asset.name}\n\n`;
    context += `${asset.description || 'No description available.'}\n\n`;
    
    context += `# SCENARIO: ${scenario.name}\n\n`;
    context += `${scenario.description || 'No description available.'}\n\n`;
    
    // Perform a hybrid search to find the most relevant content for this pair
    const relevantItems = await hybridSearch({
      query: `${asset.name} ${scenario.name}`,
      assetId,
      scenarioId,
      limit: 50  // Get a good number of results to work with
    });
    
    // Keep track of characters/tokens added
    let currentSize = context.length;
    const charPerToken = 4;  // Rough estimate: 1 token ≈ 4 chars in English
    const charLimit = tokenLimit * charPerToken;
    
    context += `# RELEVANT EVIDENCE\n\n`;
    
    // Track included cards to avoid duplication
    const includedCardIds = new Set<string>();
    
    // First add asset-related themes and cards
    if (asset.themes?.length) {
      for (const theme of asset.themes) {
        // Check if we're approaching the token limit
        if (currentSize >= charLimit * 0.9) break;
        
        context += `## ASSET THEME: ${theme.name}\n`;
        if (theme.description) {
          context += `${theme.description}\n\n`;
        }
        
        // Add cards for this theme
        for (const card of theme.cards || []) {
          // Skip if we've already included this card or if we're approaching the token limit
          if (includedCardIds.has(card.id) || currentSize >= charLimit * 0.9) continue;
          
          context += `### CARD ${card.id}: ${card.title}\n`;
          context += `${card.content}\n\n`;
          
          includedCardIds.add(card.id);
          currentSize += card.title.length + card.content.length;
        }
      }
    }
    
    // Then add scenario-related themes and cards
    if (scenario.themes?.length) {
      for (const theme of scenario.themes) {
        // Check if we're approaching the token limit
        if (currentSize >= charLimit * 0.9) break;
        
        context += `## SCENARIO THEME: ${theme.name}\n`;
        if (theme.description) {
          context += `${theme.description}\n\n`;
        }
        
        // Add cards for this theme
        for (const card of theme.cards || []) {
          // Skip if we've already included this card or if we're approaching the token limit
          if (includedCardIds.has(card.id) || currentSize >= charLimit * 0.9) continue;
          
          context += `### CARD ${card.id}: ${card.title}\n`;
          context += `${card.content}\n\n`;
          
          includedCardIds.add(card.id);
          currentSize += card.title.length + card.content.length;
        }
      }
    }
    
    // Finally, add any relevant cards found by search that weren't already included
    if (relevantItems.length) {
      context += `## SEARCH RESULTS\n\n`;
      
      for (const item of relevantItems) {
        // If we've already included this card or we're over the token limit, skip
        if (includedCardIds.has(item.id) || currentSize >= charLimit) continue;
        
        // Fetch the card details
        const card = await prisma.card.findUnique({
          where: { id: item.id },
          include: { chunks: true }
        });
        
        if (!card) continue;
        
        context += `### CARD ${card.id}: ${card.title} (Score: ${item.score.toFixed(2)})\n`;
        context += `${card.content}\n\n`;
        
        includedCardIds.add(card.id);
        currentSize += card.title.length + card.content.length;
      }
    }
    
    serviceLogger.info('Context assembly complete', {
      assetId,
      scenarioId,
      contextLength: context.length,
      includedCards: includedCardIds.size
    });
    
    return context;
  } catch (error) {
    serviceLogger.error('Error assembling matrix context', {
      error: error instanceof Error ? error.message : 'Unknown error',
      assetId,
      scenarioId
    });
    throw new Error(`Failed to assemble matrix context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
