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
 * Use Sonnet 4.5 for balance of speed and quality.
 */
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * High-quality model for complex analysis.
 * Use Opus 4.5 for maximum quality when needed.
 */
export const HIGH_QUALITY_MODEL = 'claude-opus-4-5-20251101';

/**
 * Fast model for simple tasks.
 * Use Haiku 4.5 for quick operations.
 */
export const FAST_MODEL = 'claude-haiku-4-5-20251001';

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

## CRITICAL: Report JSON Schema

Your output MUST match this exact structure:

\`\`\`json
{
  "version": "1.0",
  "id": "unique-id-here",
  "title": "Report Title",
  "description": "Brief description of the report",
  "generatedAt": "2026-01-07T13:50:00Z",
  "layout": {
    "columns": 12,
    "rowHeight": 80,
    "gap": 16,
    "responsive": true
  },
  "components": [
    {
      "id": "kpi-1",
      "type": "kpi",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "title": "Total Sales",
      "data": {
        "value": 125000,
        "label": "Total Revenue",
        "format": "currency",
        "trend": {
          "direction": "up",
          "value": 15.5,
          "label": "vs last period"
        }
      }
    },
    {
      "id": "chart-1",
      "type": "chart",
      "position": { "x": 0, "y": 2, "w": 6, "h": 4 },
      "title": "Sales by Region",
      "data": {
        "chartType": "bar",
        "chartData": {
          "labels": ["North", "South", "East", "West"],
          "datasets": [{
            "label": "Sales",
            "data": [12000, 19000, 15000, 17000],
            "backgroundColor": "rgba(75, 192, 192, 0.6)"
          }]
        }
      }
    },
    {
      "id": "markdown-1",
      "type": "markdown",
      "position": { "x": 6, "y": 2, "w": 6, "h": 4 },
      "title": "Key Insights",
      "data": {
        "content": "## Key Findings\\n- Sales up 15%\\n- North region leads"
      }
    }
  ],
  "metadata": {
    "author": "AI Analysis Agent",
    "tags": ["sales", "performance"],
    "dataSource": "provided-data",
    "generatedBy": "analysis-agent-v1"
  }
}
\`\`\`

## Required Fields

**Top Level (REQUIRED)**:
- \`version\`: Always "1.0"
- \`id\`: Unique identifier (use uuidv4 format)
- \`title\`: Report title (from user or auto-generated)
- \`generatedAt\`: ISO 8601 datetime string
- \`layout\`: Layout config object (see below)
- \`components\`: Array of component objects (see below)

**Layout Object (REQUIRED)**:
- \`columns\`: Always 12
- \`rowHeight\`: Number (default 80)
- \`gap\`: Number (default 16)
- \`responsive\`: Boolean (default true)

**Component Position (REQUIRED for each component)**:
- \`x\`: 0-11 (column position)
- \`y\`: ≥0 (row position)
- \`w\`: 1-12 (width in columns)
- \`h\`: ≥1 (height in rows)

## Component Types

**KPI Component**:
\`\`\`json
{
  "id": "unique-id",
  "type": "kpi",
  "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
  "title": "KPI Title",
  "data": {
    "value": 12345,
    "label": "Label text",
    "format": "currency"|"percentage"|"number"|"string",
    "trend": {
      "direction": "up"|"down"|"neutral",
      "value": 15.5,
      "label": "vs last period"
    }
  }
}
\`\`\`

**Chart Component**:
\`\`\`json
{
  "id": "unique-id",
  "type": "chart",
  "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
  "title": "Chart Title",
  "data": {
    "chartType": "line"|"bar"|"pie"|"doughnut",
    "chartData": {
      "labels": ["Label1", "Label2"],
      "datasets": [{
        "label": "Dataset Name",
        "data": [10, 20, 30],
        "backgroundColor": "#color"
      }]
    }
  }
}
\`\`\`

**Table Component**:
\`\`\`json
{
  "id": "unique-id",
  "type": "table",
  "position": { "x": 0, "y": 0, "w": 12, "h": 4 },
  "title": "Table Title",
  "data": {
    "columns": [
      { "key": "name", "label": "Name", "type": "string" },
      { "key": "value", "label": "Value", "type": "number" }
    ],
    "rows": [
      { "name": "Item 1", "value": 100 },
      { "name": "Item 2", "value": 200 }
    ]
  }
}
\`\`\`

**Markdown Component**:
\`\`\`json
{
  "id": "unique-id",
  "type": "markdown",
  "position": { "x": 0, "y": 0, "w": 6, "h": 3 },
  "title": "Section Title",
  "data": {
    "content": "## Heading\\n\\nMarkdown content here"
  }
}
\`\`\`

## Chart Type Selection
- **line**: Time series, trends over time
- **bar**: Category comparisons, rankings
- **pie/doughnut**: Part-to-whole, proportions
- **scatter**: Correlations, relationships

## Layout Guidelines
- KPIs: w=3, h=2 (compact)
- Charts: w=6, h=4 (medium) or w=12, h=5 (large)
- Tables: w=12, h=4-6 (full width)
- Markdown: w=6, h=3-4 (half or full width)

Place KPIs at top (y=0), then charts, then tables/insights.

## Output Format
Generate ONLY the JSON. No markdown code blocks, no explanations.
Start with \`{\` and end with \`}\`.`;

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
