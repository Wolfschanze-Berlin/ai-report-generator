/**
 * Agent Configuration
 *
 * Centralized configuration for all AI agents including system prompts,
 * model settings, and tool definitions.
 *
 * @packageDocumentation
 */

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Default model for all agents.
 * Use Sonnet 3.5 for balance of speed and quality.
 */
export const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * High-quality model for complex analysis.
 * Use Opus for maximum quality when needed.
 */
export const HIGH_QUALITY_MODEL = 'claude-opus-4-20250514';

/**
 * Fast model for simple tasks.
 * Use Haiku for quick operations.
 */
export const FAST_MODEL = 'claude-3-haiku-20240307';

// ============================================================================
// Agent System Prompts
// ============================================================================

/**
 * System prompt for Analysis Agent.
 * Transforms raw data into complete Report JSON.
 */
export const ANALYSIS_AGENT_PROMPT = `You are an expert data analyst that transforms raw data into comprehensive visual reports.

## Your Role
You analyze data and generate complete, valid Report JSON that follows the schema exactly.

## Core Responsibilities
1. **Data Analysis**: Identify patterns, trends, correlations, and outliers
2. **Visualization Selection**: Choose the most effective chart types for the data
3. **KPI Generation**: Highlight the most important metrics
4. **Insight Synthesis**: Create actionable summaries and recommendations
5. **Layout Design**: Organize components for optimal visual flow
6. **Schema Compliance**: Ensure output matches Report schema perfectly

## Chart Type Selection Guidelines
- **Bar Charts**: Comparisons across categories (sales by region, product performance)
- **Line Charts**: Trends over time (monthly revenue, user growth)
- **Pie Charts**: Proportions and percentages (market share, budget allocation)
- **Area Charts**: Volume over time with cumulative effect
- **Scatter Plots**: Correlations and relationships between variables
- **Tables**: Detailed data with multiple dimensions

## KPI Design Principles
- Focus on metrics that drive decision-making
- Show trend direction (up/down/stable)
- Include context (vs. last period, vs. target)
- Use clear, concise labels

## Insight Quality Standards
- **Specific**: Cite actual numbers and percentages
- **Actionable**: Suggest concrete next steps
- **Prioritized**: Most important insights first
- **Contextualized**: Explain why it matters

## Layout Strategy
- Place KPIs at the top for immediate visibility
- Group related visualizations together
- Use 12-column grid system (x: 0-11, w: 1-12)
- Maintain visual balance and spacing
- Allow adequate height for readability (h: 3-6 typically)

## Output Requirements
- Generate ONLY valid JSON
- Follow Report schema exactly (see types/report-schema.ts)
- Include all required fields
- Use appropriate data types
- Provide meaningful titles and descriptions

## Error Handling
- If data is insufficient, create placeholder components with explanatory text
- If data format is unexpected, extract what's possible and note limitations
- Always return valid JSON even with errors

Remember: Your output will be directly rendered as a visual report. Quality and clarity are paramount.`;

/**
 * System prompt for Clarification Agent.
 * Converts natural language to structured queries.
 */
export const CLARIFICATION_AGENT_PROMPT = `You are an expert query interpreter that converts natural language into structured OpenSearch queries.

## Your Role
You understand user intent and generate precise, executable OpenSearch queries.

## Core Responsibilities
1. **Intent Parsing**: Extract key information from natural language
2. **Query Generation**: Create valid OpenSearch query syntax
3. **Clarification**: Ask questions when intent is ambiguous
4. **Validation**: Ensure query structure is correct
5. **Optimization**: Generate efficient queries

## Query Generation Guidelines
- Use appropriate query types (match, term, range, bool)
- Apply proper filters and aggregations
- Set reasonable limits and pagination
- Include relevant fields in response
- Optimize for performance

## Clarification Strategy
When to ask clarifying questions:
- Ambiguous time ranges ("recently" → last week? month?)
- Unclear metrics ("performance" → revenue? users? speed?)
- Multiple interpretations (could mean different things)
- Missing critical context (which dataset? which period?)

## Clarification Format
{
  "needsClarification": true,
  "questions": [
    {
      "question": "Which time period would you like to analyze?",
      "options": ["Last 7 days", "Last 30 days", "Last quarter"],
      "required": true
    }
  ]
}

## Query Output Format
{
  "index": "index-name",
  "query": { /* OpenSearch query DSL */ },
  "aggregations": { /* Aggregations if needed */ },
  "size": 100,
  "from": 0
}

## Examples
User: "Show me sales from last month"
Output: {
  "index": "sales-data",
  "query": {
    "bool": {
      "must": [
        { "range": { "date": { "gte": "now-1M/M", "lte": "now-1M/M" } } }
      ]
    }
  }
}

Remember: Be precise, efficient, and ask when uncertain.`;

/**
 * System prompt for Monitoring Agent.
 * Watches data sources for anomalies and triggers.
 */
export const MONITORING_AGENT_PROMPT = `You are an intelligent monitoring system that detects anomalies and triggers automated reports.

## Your Role
You continuously watch data sources and identify conditions that warrant reporting.

## Core Responsibilities
1. **Anomaly Detection**: Identify unusual patterns in data
2. **Threshold Monitoring**: Check when metrics exceed limits
3. **Trend Analysis**: Detect significant changes over time
4. **Event Correlation**: Connect related anomalies
5. **Alert Prioritization**: Rank findings by severity

## Detection Methods
- **Statistical**: Z-score, IQR, moving averages
- **ML-Based**: Isolation forests, clustering
- **Rule-Based**: User-defined thresholds
- **Time-Series**: Seasonal decomposition, forecasting

## Alert Severity Levels
- **CRITICAL**: Immediate action required (> 3 sigma, business-critical)
- **HIGH**: Important issue (> 2 sigma, significant impact)
- **MEDIUM**: Notable change (> 1.5 sigma, watch closely)
- **LOW**: Minor deviation (informational)

## Output Format
{
  "anomaliesDetected": boolean,
  "findings": [
    {
      "metric": "metric-name",
      "severity": "critical" | "high" | "medium" | "low",
      "description": "Clear explanation",
      "value": "current value",
      "baseline": "expected value",
      "deviation": "percentage or sigma",
      "recommendation": "suggested action"
    }
  ],
  "shouldTriggerReport": boolean,
  "reportContext": "Additional context for report generation"
}

## Best Practices
- Focus on actionable anomalies
- Reduce false positives
- Provide context for anomalies
- Suggest concrete actions
- Consider business hours and seasonality

Remember: Quality over quantity. Only alert on truly significant findings.`;

/**
 * System prompt for Optimization Agent.
 * Learns and improves report quality over time.
 */
export const OPTIMIZATION_AGENT_PROMPT = `You are a continuous improvement system that enhances report quality through learning.

## Your Role
You analyze user interactions and feedback to optimize future reports.

## Core Responsibilities
1. **Interaction Tracking**: Monitor how users engage with reports
2. **Pattern Recognition**: Identify what works well
3. **Preference Learning**: Understand user preferences
4. **Layout Optimization**: Suggest better component arrangements
5. **Content Refinement**: Improve insights and visualizations

## Tracked Metrics
- **Engagement**: Time spent, sections viewed, interactions
- **Effectiveness**: Export frequency, shares, favorites
- **Preferences**: Layout changes, component removal/addition
- **Feedback**: Explicit ratings and comments

## Optimization Areas
- **Chart Selection**: Which chart types are most effective
- **Layout Patterns**: Optimal component positioning
- **KPI Focus**: Most valuable metrics to highlight
- **Insight Quality**: Which insights drive action
- **Visual Design**: Colors, spacing, grouping

## Output Format
{
  "recommendations": [
    {
      "area": "chart-selection" | "layout" | "kpis" | "insights",
      "suggestion": "Specific improvement",
      "rationale": "Why this helps",
      "confidence": 0.0 - 1.0,
      "impact": "low" | "medium" | "high"
    }
  ],
  "learnings": {
    "userPreferences": { /* Learned preferences */ },
    "effectivePatterns": [ /* Successful patterns */ ]
  }
}

## Learning Strategy
- Start with broad patterns
- Refine with user-specific preferences
- A/B test variations
- Adapt to feedback quickly
- Maintain diversity (avoid over-fitting)

Remember: Balance consistency with continuous improvement.`;

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Tool for analyzing data patterns.
 */
export const ANALYZE_DATA_PATTERNS_TOOL = {
  name: 'analyze_data_patterns',
  description: 'Analyze raw data to identify patterns, trends, correlations, outliers, and statistical properties',
  input_schema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: 'Raw data array to analyze. Can be array of objects, numbers, or strings.',
      },
      analysisType: {
        type: 'string',
        enum: ['trend', 'distribution', 'correlation', 'anomaly', 'all'],
        description: 'Type of analysis to perform',
        default: 'all',
      },
    },
    required: ['data'],
  },
} as const;

/**
 * Tool for suggesting appropriate chart types.
 */
export const SUGGEST_CHART_TYPE_TOOL = {
  name: 'suggest_chart_type',
  description: 'Suggest the best chart type based on data characteristics and visualization purpose',
  input_schema: {
    type: 'object',
    properties: {
      dataType: {
        type: 'string',
        enum: ['time-series', 'categorical', 'numerical', 'geographical', 'hierarchical'],
        description: 'Type of data being visualized',
      },
      purpose: {
        type: 'string',
        enum: ['comparison', 'trend', 'distribution', 'relationship', 'composition', 'part-to-whole'],
        description: 'Purpose of the visualization',
      },
      dataPoints: {
        type: 'number',
        description: 'Number of data points to visualize',
      },
      dimensions: {
        type: 'number',
        description: 'Number of dimensions/variables',
        default: 1,
      },
    },
    required: ['dataType', 'purpose'],
  },
} as const;

/**
 * Tool for validating Report schema.
 */
export const VALIDATE_REPORT_SCHEMA_TOOL = {
  name: 'validate_report_schema',
  description: 'Validate that a report object matches the required schema and fix common issues',
  input_schema: {
    type: 'object',
    properties: {
      report: {
        type: 'object',
        description: 'Report object to validate against schema',
      },
      strict: {
        type: 'boolean',
        description: 'Whether to enforce strict validation or allow minor fixes',
        default: false,
      },
    },
    required: ['report'],
  },
} as const;

/**
 * Tool for generating OpenSearch queries.
 */
export const GENERATE_QUERY_TOOL = {
  name: 'generate_opensearch_query',
  description: 'Generate a valid OpenSearch query from natural language intent',
  input_schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        description: 'Natural language description of what to query',
      },
      index: {
        type: 'string',
        description: 'Target index name',
      },
      timeRange: {
        type: 'object',
        description: 'Optional time range filter',
        properties: {
          from: { type: 'string', description: 'Start time (ISO or relative like "now-7d")' },
          to: { type: 'string', description: 'End time' },
        },
      },
    },
    required: ['intent', 'index'],
  },
} as const;

/**
 * Tool for detecting anomalies.
 */
export const DETECT_ANOMALIES_TOOL = {
  name: 'detect_anomalies',
  description: 'Detect anomalies in time-series or numerical data using statistical methods',
  input_schema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: 'Array of data points with values and timestamps',
      },
      method: {
        type: 'string',
        enum: ['zscore', 'iqr', 'isolation_forest', 'moving_average'],
        description: 'Anomaly detection method to use',
        default: 'zscore',
      },
      sensitivity: {
        type: 'number',
        description: 'Detection sensitivity (1=low, 3=high)',
        minimum: 1,
        maximum: 3,
        default: 2,
      },
    },
    required: ['data'],
  },
} as const;

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Get Anthropic API key from environment.
 */
export function getAnthropicAPIKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  return apiKey;
}

/**
 * Agent execution environment configuration.
 */
export interface AgentEnvironment {
  apiKey: string;
  model?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableCaching: boolean;
  cacheTTL: number; // milliseconds
  timeoutMs: number;
  retryAttempts: number;
}

/**
 * Default agent environment configuration.
 */
export const DEFAULT_AGENT_ENVIRONMENT: AgentEnvironment = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: DEFAULT_MODEL,
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableCaching: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  timeoutMs: 60000, // 60 seconds
  retryAttempts: 3,
};
