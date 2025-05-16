/**
 * RAGAS Evaluation Utilities
 * 
 * Tools for calculating Retrieval Augmented Generation Assessment Scores
 * to evaluate the quality of RAG results.
 */

import OpenAI from 'openai';
import { logger } from '../logger';

// Logger for RAGAS operations
const ragasLogger = logger.child({ component: 'RAGAS' });

// The minimum RAGAS score considered acceptable for the system
export const RAGAS_THRESHOLD = 0.80;

// OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Gets or initializes the OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  return openaiClient;
}

/**
 * Calculates faithfulness score - how accurate is the answer relative to context
 * 
 * @param question Original user question
 * @param answer Generated answer
 * @param context Retrieved context used for generation
 * @returns Score from 0 to 1 (1 being perfect)
 */
async function calculateFaithfulness(
  question: string,
  answer: string,
  context: Array<{ id: string; content: string; score: number }>
): Promise<number> {
  try {
    const client = getOpenAIClient();
    const contextText = context.map(item => item.content).join('\n\n');
    
    const prompt = `
You are evaluating the faithfulness of an AI-generated answer based on the provided context.
Faithfulness measures whether the answer contains only information that is present in or can be directly inferred from the context.

Question: ${question}
Answer: ${answer}

Context:
${contextText}

Rate the faithfulness of the answer on a scale from 0 to 1, where:
- 1: Perfectly faithful - all information in the answer is supported by the context
- 0.75: Mostly faithful - minor details in the answer might not be explicitly supported
- 0.5: Partially faithful - some significant claims in the answer aren't supported
- 0.25: Mostly unfaithful - most claims aren't supported by the context
- 0: Completely unfaithful - answer contradicts or has no basis in the context

Output your evaluation as a JSON object with a single "score" field, like: {"score": 0.75}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      ragasLogger.warn('Empty response from OpenAI for faithfulness calculation');
      return 0.7; // Default fallback
    }
    
    try {
      const result = JSON.parse(content);
      return result.score;
    } catch (parseError) {
      ragasLogger.error('Failed to parse OpenAI response for faithfulness', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        content
      });
      return 0.7; // Default fallback
    }
  } catch (error) {
    ragasLogger.error('Error calculating faithfulness score', {
      error: error instanceof Error ? error.message : String(error)
    });
    return 0.7; // Default fallback
  }
}

/**
 * Calculates context relevance score - how well the retrieved documents match the question
 * 
 * @param question Original user question
 * @param context Retrieved context used for generation
 * @returns Score from 0 to 1 (1 being perfect)
 */
async function calculateContextRelevance(
  question: string,
  context: Array<{ id: string; content: string; score: number }>
): Promise<number> {
  try {
    const client = getOpenAIClient();
    const contextText = context.map(item => item.content).join('\n\n');
    
    const prompt = `
You are evaluating the relevance of retrieved context to a given question.
Context relevance measures how well the retrieved passages address the specific information needs in the question.

Question: ${question}

Retrieved Context:
${contextText}

Rate the context relevance on a scale from 0 to 1, where:
- 1: Perfectly relevant - context directly addresses the question with comprehensive information
- 0.75: Highly relevant - context contains most information needed to answer the question
- 0.5: Moderately relevant - context is related to the question but missing some key aspects
- 0.25: Slightly relevant - context is tangentially related but largely misses the point
- 0: Not relevant - context has no relation to the question

Output your evaluation as a JSON object with a single "score" field, like: {"score": 0.75}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      ragasLogger.warn('Empty response from OpenAI for context relevance calculation');
      return 0.7; // Default fallback
    }
    
    try {
      const result = JSON.parse(content);
      return result.score;
    } catch (parseError) {
      ragasLogger.error('Failed to parse OpenAI response for context relevance', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        content
      });
      return 0.7; // Default fallback
    }
  } catch (error) {
    ragasLogger.error('Error calculating context relevance score', {
      error: error instanceof Error ? error.message : String(error)
    });
    return 0.7; // Default fallback
  }
}

/**
 * Calculates answer relevance score - how well the answer addresses the question
 * 
 * @param question Original user question
 * @param answer Generated answer
 * @returns Score from 0 to 1 (1 being perfect)
 */
async function calculateAnswerRelevance(
  question: string,
  answer: string
): Promise<number> {
  try {
    const client = getOpenAIClient();
    
    const prompt = `
You are evaluating how well an AI-generated answer addresses a user's question.
Answer relevance measures whether an answer directly responds to what was asked.

Question: ${question}
Answer: ${answer}

Rate the answer relevance on a scale from 0 to 1, where:
- 1: Perfect answer - directly and completely addresses the question
- 0.75: Good answer - addresses the main points of the question
- 0.5: Partial answer - addresses some aspects but misses others
- 0.25: Poor answer - barely addresses the question
- 0: Not an answer - completely fails to address the question

Output your evaluation as a JSON object with a single "score" field, like: {"score": 0.75}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      ragasLogger.warn('Empty response from OpenAI for answer relevance calculation');
      return 0.7; // Default fallback
    }
    
    try {
      const result = JSON.parse(content);
      return result.score;
    } catch (parseError) {
      ragasLogger.error('Failed to parse OpenAI response for answer relevance', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        content
      });
      return 0.7; // Default fallback
    }
  } catch (error) {
    ragasLogger.error('Error calculating answer relevance score', {
      error: error instanceof Error ? error.message : String(error)
    });
    return 0.7; // Default fallback
  }
}

/**
 * Calculates aggregated RAGAS score from multiple metrics
 * 
 * @param question Original user question
 * @param answer Generated answer
 * @param context Retrieved context used for generation
 * @returns Score from 0 to 1 (1 being perfect)
 */
export async function calculateRAGASScore(
  question: string,
  answer: string,
  context: Array<{ id: string; content: string; score: number }>
): Promise<number> {
  if (!context || context.length === 0) {
    ragasLogger.warn('No context provided for RAGAS calculation');
    return 0.5; // Default score for empty context
  }
  
  try {
    // Calculate component scores
    const [faithfulnessScore, contextRelevanceScore, answerRelevanceScore] = await Promise.all([
      calculateFaithfulness(question, answer, context),
      calculateContextRelevance(question, context),
      calculateAnswerRelevance(question, answer)
    ]);
    
    // Apply weights - faithfulness is most critical
    const weightedScore = (
      faithfulnessScore * 0.5 +
      contextRelevanceScore * 0.3 +
      answerRelevanceScore * 0.2
    );
    
    // Log the results
    ragasLogger.info('RAGAS calculation complete', {
      faithfulness: faithfulnessScore,
      contextRelevance: contextRelevanceScore,
      answerRelevance: answerRelevanceScore,
      overall: weightedScore
    });
    
    return weightedScore;
  } catch (error) {
    ragasLogger.error('Error calculating RAGAS score', {
      error: error instanceof Error ? error.message : String(error)
    });
    return 0.7; // Default fallback
  }
}
