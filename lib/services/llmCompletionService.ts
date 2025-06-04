import { logger } from '../logger';
import { PromptTemplate } from './promptTemplateService';

// Create a service-specific logger
const llmLogger = logger.child({ service: 'LLMCompletionService' });

/**
 * LLM Completion Service - Handles interactions with Large Language Models
 * Provides structured calls to OpenAI, Claude, and other LLM providers
 */
export class LLMCompletionService {
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;
  private readonly maxRetries: number;

  constructor(options?: {
    defaultModel?: string;
    defaultTemperature?: number;
    maxRetries?: number;
  }) {
    this.defaultModel = options?.defaultModel || 'gpt-4o';
    this.defaultTemperature = options?.defaultTemperature || 0.3;
    this.maxRetries = options?.maxRetries || 3;
  }

  /**
   * Complete a prompt using OpenAI API
   */
  public async completeOpenAI(
    prompt: PromptTemplate,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'text' | 'json_object';
      timeout?: number;
    }
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    llmLogger.info('Starting OpenAI completion', {
      requestId,
      model: options?.model || this.defaultModel,
      temperature: options?.temperature || this.defaultTemperature,
      systemPromptLength: prompt.system.length,
      userPromptLength: prompt.user.length
    });

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables');
      }

      const payload = {
        model: options?.model || this.defaultModel,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: options?.temperature ?? this.defaultTemperature,
        max_tokens: options?.maxTokens || 2000,
        ...(options?.responseFormat && { response_format: { type: options.responseFormat } })
      };

      const response = await this.makeAPIRequest('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      }, options?.timeout || 30000);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      const content = responseData.choices[0]?.message?.content || '';
      const usage = responseData.usage || {};

      const result: LLMResponse = {
        content,
        provider: 'openai',
        model: options?.model || this.defaultModel,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        },
        processingTime: Date.now() - startTime,
        requestId
      };

      llmLogger.info('OpenAI completion successful', {
        requestId,
        completionLength: content.length,
        tokensUsed: result.usage.totalTokens,
        processingTime: result.processingTime
      });

      return result;
    } catch (error) {
      llmLogger.error('OpenAI completion failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Complete a prompt with automatic retry logic
   */
  public async completeWithRetry(
    prompt: PromptTemplate,
    provider: 'openai' = 'openai',
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'text' | 'json_object';
      timeout?: number;
    }
  ): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        llmLogger.debug('Attempting LLM completion', { attempt, maxRetries: this.maxRetries });

        switch (provider) {
          case 'openai':
            return await this.completeOpenAI(prompt, options);
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
          llmLogger.warn('LLM completion attempt failed, retrying', {
            attempt,
            error: lastError.message,
            retryInMs: backoffMs
          });
          await this.sleep(backoffMs);
        }
      }
    }

    llmLogger.error('All LLM completion attempts failed', {
      attempts: this.maxRetries,
      finalError: lastError?.message
    });
    throw lastError || new Error('All completion attempts failed');
  }

  /**
   * Parse JSON response with error handling
   */
  public parseJSONResponse<T = any>(response: LLMResponse): T {
    try {
      return JSON.parse(response.content);
    } catch (error) {
      llmLogger.error('Failed to parse LLM JSON response', {
        requestId: response.requestId,
        contentLength: response.content.length,
        content: response.content.substring(0, 200) + '...',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Invalid JSON response from LLM');
    }
  }

  /**
   * Validate response format for specific templates
   */
  public validateImpactExplainResponse(response: any): ImpactExplainResponse {
    const errors: string[] = [];

    if (typeof response.impactScore !== 'number' || response.impactScore < -5 || response.impactScore > 5) {
      errors.push('impactScore must be a number between -5 and 5');
    }

    if (typeof response.rationale !== 'string' || response.rationale.length > 200) {
      errors.push('rationale must be a string with ≤200 characters');
    }

    if (!Array.isArray(response.evidence) || response.evidence.length > 5) {
      errors.push('evidence must be an array with ≤5 items');
    } else {
      response.evidence.forEach((item: any, index: number) => {
        if (typeof item.cardId !== 'string') {
          errors.push(`evidence[${index}].cardId must be a string`);
        }
        if (typeof item.relevance !== 'number' || item.relevance < 0 || item.relevance > 1) {
          errors.push(`evidence[${index}].relevance must be a number between 0 and 1`);
        }
      });
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
      errors.push('confidence must be a number between 0 and 1');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid ImpactExplain response: ${errors.join(', ')}`);
    }

    return response as ImpactExplainResponse;
  }

  /**
   * Get estimated cost for completion
   */
  public estimateCompletionCost(
    prompt: PromptTemplate,
    model: string = this.defaultModel,
    estimatedCompletionTokens: number = 500
  ): TokenCostEstimate {
    const inputTokens = this.estimateTokenCount(prompt.system + prompt.user);
    const outputTokens = estimatedCompletionTokens;
    const totalTokens = inputTokens + outputTokens;

    // Cost per 1K tokens (approximate, updated as of 2024)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
    };

    const modelCost = costs[model] || costs['gpt-4o'];
    const inputCost = (inputTokens / 1000) * modelCost.input;
    const outputCost = (outputTokens / 1000) * modelCost.output;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost,
      model
    };
  }

  /**
   * Check if API is available
   */
  public async healthCheck(provider: 'openai' = 'openai'): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) return false;

          const response = await this.makeAPIRequest('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
          }, 10000);

          return response.ok;
        default:
          return false;
      }
    } catch (error) {
      llmLogger.warn('Health check failed', { provider, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  // Private helper methods

  private async makeAPIRequest(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Type definitions
export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime: number;
  requestId: string;
}

export interface ImpactExplainResponse {
  impactScore: number; // -5 to 5
  rationale: string; // ≤200 chars
  evidence: Array<{
    cardId: string;
    relevance: number; // 0-1
  }>; // max 5 items
  confidence: number; // 0-1
}

export interface TokenCostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

// Export a default instance
export const llmCompletionService = new LLMCompletionService();

// Utility functions
export function formatCostEstimate(estimate: TokenCostEstimate): string {
  return `$${estimate.totalCost.toFixed(4)} (${estimate.totalTokens} tokens)`;
}

export function isHighCostOperation(estimate: TokenCostEstimate, threshold: number = 0.10): boolean {
  return estimate.totalCost > threshold;
} 