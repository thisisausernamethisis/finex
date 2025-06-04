import { logger } from '../logger';

// Create a service-specific logger
const promptLogger = logger.child({ service: 'PromptTemplateService' });

/**
 * Prompt Template Service - Manages and formats AI prompt templates
 * Provides structured prompts for financial analysis tasks
 */
export class PromptTemplateService {
  /**
   * Format the ImpactExplain template for matrix analysis
   */
  public formatImpactExplain(data: {
    scenarioDescription: string;
    assetDescription: string;
    themes: Array<{
      themeName: string;
      summaryBullets?: string[];
      cards?: Array<{ id: string; title: string; content?: string }>;
    }>;
    variant?: 'A' | 'B';
  }): { system: string; user: string } {
    const variant = data.variant || 'A';

    if (variant === 'A') {
      return {
        system: `You are a financial impact-assessment specialist. Assess the Scenario→Asset impact and output a JSON object matching this schema
{
  "impactScore": integer -5..5,
  "rationale": string ≤200 chars,
  "evidence": [ { "cardId": string, "relevance": 0–1 } ] (max 5),
  "confidence": float 0–1
}
Return *only* the JSON. Be objective and analytical.`,
        user: this.buildImpactExplainUser(data)
      };
    } else {
      return {
        system: `You are ImpactQuant AI, producing rigorous, evidence-backed JSON impact assessments with the same schema as variant A.`,
        user: this.buildImpactExplainUser(data)
      };
    }
  }

  /**
   * Format the ThemeSummary template
   */
  public formatThemeSummary(data: {
    themeName: string;
    cards: Array<{
      id: string;
      title: string;
      content: string;
      importance: number;
      sourceURL?: string;
    }>;
    variant?: 'A' | 'B';
  }): { system: string; user: string } {
    const variant = data.variant || 'A';

    if (variant === 'A') {
      return {
        system: `You are an expert financial analyst assistant.
Your task is to synthesize a set of 5-30 'Cards' into 2-3 concise, actionable bullet points. Each Card has a title, content, importance score (0-5), and sourceURL.
• Each bullet *must* cite at least one relevant \`Card.title\` or \`Card.id\`, formatted as [Card.title] or [Card.id_value].
• Focus on insights an equity analyst can act upon; avoid speculation/hype.
• Tone: crisp, professional finance.
• Return *only* the 2-3 bullet points.`,
        user: this.buildThemeSummaryUser(data)
      };
    } else {
      return {
        system: `You are FinSummarize Pro, an AI assistant specializing in actionable intelligence for buy-side equity analysts. Provide exactly 2-3 bullets, each citing Card title or ID, in a crisp professional tone.`,
        user: this.buildThemeSummaryUser(data)
      };
    }
  }

  /**
   * Format the BoardSummary template
   */
  public formatBoardSummary(data: {
    boardName: string;
    boardType: string;
    themeSummaries: Array<{
      themeName: string;
      summaryBullets: string[];
    }>;
    variant?: 'A' | 'B';
  }): { system: string; user: string } {
    const variant = data.variant || 'A';

    if (variant === 'A') {
      return {
        system: `You are an expert financial meta-summarizer. Given several Theme Summaries, output:
1. One macro paragraph (3-5 sentences) giving a holistic overview.
2. Exactly 3 bullet points with the most critical cross-theme takeaways.
Maintain a crisp professional tone. No extra text.`,
        user: this.buildBoardSummaryUser(data)
      };
    } else {
      return {
        system: `You are BoardStrategist AI, crafting concise, strategic board-level briefs for senior analysts: 1 macro paragraph + 3 potent bullets.`,
        user: this.buildBoardSummaryUser(data)
      };
    }
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates(): string[] {
    return ['ImpactExplain', 'ThemeSummary', 'BoardSummary'];
  }

  /**
   * Validate template data
   */
  public validateTemplateData(templateName: string, data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (templateName) {
      case 'ImpactExplain':
        if (!data.scenarioDescription) errors.push('scenarioDescription is required');
        if (!data.assetDescription) errors.push('assetDescription is required');
        if (!Array.isArray(data.themes)) errors.push('themes must be an array');
        break;
      case 'ThemeSummary':
        if (!data.themeName) errors.push('themeName is required');
        if (!Array.isArray(data.cards)) errors.push('cards must be an array');
        break;
      case 'BoardSummary':
        if (!data.boardName) errors.push('boardName is required');
        if (!data.boardType) errors.push('boardType is required');
        if (!Array.isArray(data.themeSummaries)) errors.push('themeSummaries must be an array');
        break;
      default:
        errors.push(`Unknown template: ${templateName}`);
    }

    return { valid: errors.length === 0, errors };
  }

  // Private helper methods

  private buildImpactExplainUser(data: {
    scenarioDescription: string;
    assetDescription: string;
    themes: Array<{
      themeName: string;
      summaryBullets?: string[];
      cards?: Array<{ id: string; title: string; content?: string }>;
    }>;
  }): string {
    let user = `Scenario: ${data.scenarioDescription}\n`;
    user += `Asset: ${data.assetDescription}\n`;
    user += `Relevant Theme Summaries & Cards:\n`;

    data.themes.forEach(theme => {
      user += `Theme: ${theme.themeName}\n`;
      
      if (theme.summaryBullets && theme.summaryBullets.length > 0) {
        theme.summaryBullets.forEach(bullet => {
          user += `- ${bullet}\n`;
        });
      }
      
      if (theme.cards && theme.cards.length > 0) {
        user += `Cards:\n`;
        theme.cards.forEach(card => {
          user += `Card ${card.id}: ${card.title}\n`;
        });
      }
      user += `\n`;
    });

    user += `Provide your impact assessment JSON.`;
    return user;
  }

  private buildThemeSummaryUser(data: {
    themeName: string;
    cards: Array<{
      id: string;
      title: string;
      content: string;
      importance: number;
      sourceURL?: string;
    }>;
  }): string {
    let user = `Here are the Cards for the Theme "${data.themeName}":\n\n`;

    data.cards.forEach(card => {
      user += `Card ${card.id} (Importance: ${card.importance}):\n`;
      user += `Title: ${card.title}\n`;
      user += `Content: ${card.content}\n`;
      if (card.sourceURL) {
        user += `Source: ${card.sourceURL}\n`;
      }
      user += `---\n`;
    });

    user += `\nSynthesize these Cards into 2-3 actionable bullet points with citations.`;
    return user;
  }

  private buildBoardSummaryUser(data: {
    boardName: string;
    boardType: string;
    themeSummaries: Array<{
      themeName: string;
      summaryBullets: string[];
    }>;
  }): string {
    let user = `Board: ${data.boardName} (${data.boardType})\n`;
    user += `Theme Summaries:\n`;

    data.themeSummaries.forEach(summary => {
      user += `Theme: ${summary.themeName}\n`;
      summary.summaryBullets.forEach(bullet => {
        user += `- ${bullet}\n`;
      });
      user += `---\n`;
    });

    user += `\nGenerate the Board Summary now.`;
    return user;
  }
}

// Export a default instance
export const promptTemplateService = new PromptTemplateService();

// Type definitions
export interface PromptTemplate {
  system: string;
  user: string;
}

export interface ImpactExplainData {
  scenarioDescription: string;
  assetDescription: string;
  themes: Array<{
    themeName: string;
    summaryBullets?: string[];
    cards?: Array<{ id: string; title: string; content?: string }>;
  }>;
  variant?: 'A' | 'B';
}

export interface ThemeSummaryData {
  themeName: string;
  cards: Array<{
    id: string;
    title: string;
    content: string;
    importance: number;
    sourceURL?: string;
  }>;
  variant?: 'A' | 'B';
}

export interface BoardSummaryData {
  boardName: string;
  boardType: string;
  themeSummaries: Array<{
    themeName: string;
    summaryBullets: string[];
  }>;
  variant?: 'A' | 'B';
}

// Utility functions
export function isValidTemplateVariant(variant: string): variant is 'A' | 'B' {
  return variant === 'A' || variant === 'B';
}

export function getTemplateDescription(templateName: string): string {
  switch (templateName) {
    case 'ImpactExplain':
      return 'Assess Scenario→Asset impact with structured JSON output including impact score, rationale, evidence, and confidence';
    case 'ThemeSummary':
      return 'Synthesize Cards into 2-3 concise, actionable bullet points with citations';
    case 'BoardSummary':
      return 'Create macro summaries across themes with holistic overview and critical takeaways';
    default:
      return 'Unknown template';
  }
} 