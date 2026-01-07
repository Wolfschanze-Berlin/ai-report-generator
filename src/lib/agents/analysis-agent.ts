/**
 * Analysis Agent
 *
 * Transforms raw OpenSearch data into complete Report JSON using Claude API with tool use.
 *
 * @packageDocumentation
 */

import Anthropic from '@anthropic-ai/sdk';
import { reportSchema, type Report } from '@/types/report-schema';
import {
  ANALYSIS_AGENT_PROMPT,
  ANALYZE_DATA_PATTERNS_TOOL,
  SUGGEST_CHART_TYPE_TOOL,
  VALIDATE_REPORT_SCHEMA_TOOL,
  DEFAULT_MODEL,
  getAnthropicAPIKey
} from '../../../.claude/agents/config';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for analysis agent.
 */
export interface AnalysisAgentInput {
  /** Raw data from Windmill or other source */
  data: any[];
  /** Optional user context for focused analysis */
  userPrompt?: string;
  /** Optional report title override */
  title?: string;
  /** Skip clarification questions and proceed with analysis */
  skipClarification?: boolean;
}

/**
 * Clarification question from agent.
 */
export interface ClarificationQuestion {
  /** Question to ask the user */
  question: string;
  /** Suggested options (if applicable) */
  options?: string[];
  /** Whether this question is required */
  required: boolean;
}

/**
 * Output when clarification is needed.
 */
export interface ClarificationNeeded {
  /** Indicates clarification is required */
  needsClarification: true;
  /** Questions to ask the user */
  questions: ClarificationQuestion[];
  /** Context about why clarification is needed */
  reason: string;
}

/**
 * Output from analysis agent.
 */
export interface AnalysisAgentOutput {
  /** Complete validated Report JSON */
  report: Report;
  /** Execution metadata */
  metadata: {
    /** Processing time in milliseconds */
    processingTime: number;
    /** Number of data points processed */
    dataPoints: number;
    /** Number of insights generated */
    insights: number;
    /** Model used for generation */
    model: string;
  };
}

/**
 * Error thrown by analysis agent.
 */
export class AnalysisAgentError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_DATA' | 'SCHEMA_VALIDATION' | 'LLM_ERROR' | 'TIMEOUT',
    public details?: any
  ) {
    super(message);
    this.name = 'AnalysisAgentError';
  }
}

// ============================================================================
// Analysis Agent
// ============================================================================

/**
 * AI Agent that transforms raw data into Report JSON.
 *
 * Uses Claude API with tool use for data analysis,
 * chart selection, and schema validation.
 *
 * @example
 * ```typescript
 * const agent = new AnalysisAgent();
 * const result = await agent.analyze({
 *   data: rawData,
 *   userPrompt: 'Focus on quarterly trends'
 * });
 * console.log(result.report);
 * ```
 */
export class AnalysisAgent {
  private anthropicClient: Anthropic;
  private model: string;
  private maxTokens: number;

  /**
   * Create a new Analysis Agent.
   *
   * @param apiKey - Anthropic API key (optional, uses env var by default)
   * @param model - Model to use (optional, defaults to Sonnet 3.5)
   */
  constructor(apiKey?: string, model?: string) {
    this.anthropicClient = new Anthropic({
      apiKey: apiKey || getAnthropicAPIKey(),
    });

    this.model = model || DEFAULT_MODEL;
    this.maxTokens = 8192;
  }

  /**
   * Check if clarification is needed before analysis.
   *
   * @param input - Analysis input to evaluate
   * @returns Clarification questions if needed, null otherwise
   */
  async checkClarification(
    input: AnalysisAgentInput
  ): Promise<ClarificationNeeded | null> {
    // Skip if user explicitly requested no clarification
    if (input.skipClarification) {
      return null;
    }

    // Check for ambiguous or missing context
    const needsClarification: ClarificationQuestion[] = [];

    // Check if data structure is unclear
    if (input.data.length > 0) {
      const firstItem = input.data[0];
      const keys = Object.keys(firstItem || {});

      // If data has many fields and no user prompt, ask for focus
      if (keys.length > 10 && !input.userPrompt) {
        needsClarification.push({
          question: 'Your data has many fields. What would you like to focus on?',
          options: ['All metrics', 'Key trends', 'Specific metrics', 'Comparative analysis'],
          required: false,
        });
      }

      // Check for time-series data without time range specification
      if (keys.some(k => k.includes('date') || k.includes('time')) &&
          !input.userPrompt?.match(/last|recent|past|this|between/i)) {
        needsClarification.push({
          question: 'What time period would you like to analyze?',
          options: ['Last 7 days', 'Last 30 days', 'Last quarter', 'All available data'],
          required: false,
        });
      }
    }

    // Return clarification if needed
    if (needsClarification.length > 0) {
      return {
        needsClarification: true,
        questions: needsClarification,
        reason: 'Additional context would help create a more focused and useful report',
      };
    }

    return null;
  }

  /**
   * Analyze data and generate Report JSON.
   *
   * @param input - Analysis input with data and optional context
   * @returns Complete Report JSON with metadata
   * @throws {AnalysisAgentError} If analysis fails
   */
  async analyze(input: AnalysisAgentInput): Promise<AnalysisAgentOutput> {
    const startTime = Date.now();

    // Validate input
    if (!input.data || input.data.length === 0) {
      throw new AnalysisAgentError(
        'No data provided for analysis',
        'INVALID_DATA'
      );
    }

    try {
      // Prepare analysis prompt
      const prompt = this.buildAnalysisPrompt(input);

      // Call Claude API
      const response = await this.anthropicClient.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: ANALYSIS_AGENT_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools: [
          ANALYZE_DATA_PATTERNS_TOOL,
          SUGGEST_CHART_TYPE_TOOL,
          VALIDATE_REPORT_SCHEMA_TOOL,
        ] as any,
      });

      // Extract text content
      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      // Extract and validate report JSON
      const reportJSON = this.extractReportJSON(content);
      const validatedReport = this.validateReport(reportJSON, input.title);

      return {
        report: validatedReport,
        metadata: {
          processingTime: Date.now() - startTime,
          dataPoints: input.data.length,
          insights: validatedReport.components.filter(
            (c) => c.type === 'markdown'
          ).length,
          model: this.model,
        },
      };
    } catch (error) {
      if (error instanceof AnalysisAgentError) {
        throw error;
      }

      throw new AnalysisAgentError(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LLM_ERROR',
        error
      );
    }
  }

  /**
   * Build analysis prompt from input.
   */
  private buildAnalysisPrompt(input: AnalysisAgentInput): string {
    const dataPreview = this.formatDataPreview(input.data);

    return `Analyze the following data and generate a comprehensive report in JSON format.

## Data to Analyze
${dataPreview}

${input.userPrompt ? `## User Context\n${input.userPrompt}\n` : ''}
${input.title ? `## Report Title\n${input.title}\n` : ''}

## Instructions
1. Analyze the data to identify key patterns, trends, and insights
2. Create appropriate visualizations (charts, KPIs, tables)
3. Generate actionable insights and recommendations
4. Design an optimal layout using the 12-column grid system
5. Output ONLY the Report JSON, no other text

## Report JSON Requirements
- Must follow the Report schema exactly
- Include title, description, and metadata
- Create multiple component types (KPI, chart, markdown, table)
- Use proper grid positioning (x, y, w, h)
- Ensure all data fields are populated correctly

Generate the Report JSON now:`;
  }

  /**
   * Format data preview for prompt.
   */
  private formatDataPreview(data: any[]): string {
    // Show first 10 items for context
    const preview = data.slice(0, 10);
    const remaining = data.length - preview.length;

    let formatted = JSON.stringify(preview, null, 2);

    if (remaining > 0) {
      formatted += `\n\n... and ${remaining} more items (${data.length} total)`;
    }

    return formatted;
  }

  /**
   * Extract Report JSON from agent response.
   */
  private extractReportJSON(content: string): any {
    // Try to extract JSON from code blocks
    const codeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    // Try to extract raw JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new AnalysisAgentError(
      'No valid JSON found in agent response',
      'SCHEMA_VALIDATION',
      { content }
    );
  }

  /**
   * Validate report against schema.
   */
  private validateReport(reportJSON: any, titleOverride?: string): Report {
    try {
      // Apply title override if provided
      if (titleOverride) {
        reportJSON.title = titleOverride;
      }

      // Validate with Zod schema
      const validated = reportSchema.parse(reportJSON);

      return validated;
    } catch (error) {
      throw new AnalysisAgentError(
        'Report validation failed',
        'SCHEMA_VALIDATION',
        { error, reportJSON }
      );
    }
  }

  /**
   * Get model being used.
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Update model.
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Set max tokens.
   */
  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create and run analysis agent in one call.
 *
 * @param input - Analysis input
 * @param apiKey - Optional API key
 * @returns Analysis result
 */
export async function analyzeData(
  input: AnalysisAgentInput,
  apiKey?: string
): Promise<AnalysisAgentOutput> {
  const agent = new AnalysisAgent(apiKey);
  return agent.analyze(input);
}
