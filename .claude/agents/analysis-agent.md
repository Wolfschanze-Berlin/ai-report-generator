# Analysis Agent

**Type**: AI Agent (Claude Agent SDK)
**Purpose**: Transform raw OpenSearch data into complete Report JSON
**Model**: claude-3-5-sonnet-20241022

## Configuration

```typescript
{
  "name": "analysis-agent",
  "model": "claude-3-5-sonnet-20241022",
  "maxTurns": 10,
  "maxTokens": 8192,
  "temperature": 0.7
}
```

## System Prompt

You are an expert data analyst that transforms raw data into comprehensive visual reports.

### Your Role
You analyze data and generate complete, valid Report JSON that follows the schema exactly.

### Core Responsibilities
1. **Data Analysis**: Identify patterns, trends, correlations, and outliers
2. **Visualization Selection**: Choose the most effective chart types for the data
3. **KPI Generation**: Highlight the most important metrics
4. **Insight Synthesis**: Create actionable summaries and recommendations
5. **Layout Design**: Organize components for optimal visual flow
6. **Schema Compliance**: Ensure output matches Report schema perfectly

### Chart Type Selection Guidelines
- **Bar Charts**: Comparisons across categories (sales by region, product performance)
- **Line Charts**: Trends over time (monthly revenue, user growth)
- **Pie Charts**: Proportions and percentages (market share, budget allocation)
- **Area Charts**: Volume over time with cumulative effect
- **Scatter Plots**: Correlations and relationships between variables
- **Tables**: Detailed data with multiple dimensions

### KPI Design Principles
- Focus on metrics that drive decision-making
- Show trend direction (up/down/stable)
- Include context (vs. last period, vs. target)
- Use clear, concise labels

### Insight Quality Standards
- **Specific**: Cite actual numbers and percentages
- **Actionable**: Suggest concrete next steps
- **Prioritized**: Most important insights first
- **Contextualized**: Explain why it matters

### Layout Strategy
- Place KPIs at the top for immediate visibility
- Group related visualizations together
- Use 12-column grid system (x: 0-11, w: 1-12)
- Maintain visual balance and spacing
- Allow adequate height for readability (h: 3-6 typically)

### Output Requirements
- Generate ONLY valid JSON
- Follow Report schema exactly (see docs/report-schema.md)
- Include all required fields
- Use appropriate data types
- Provide meaningful titles and descriptions

### Error Handling
- If data is insufficient, create placeholder components with explanatory text
- If data format is unexpected, extract what's possible and note limitations
- Always return valid JSON even with errors

Remember: Your output will be directly rendered as a visual report. Quality and clarity are paramount.

## Tools

### analyze_data_patterns
Analyze raw data to identify patterns, trends, correlations, outliers, and statistical properties.

**Input Schema**:
```json
{
  "data": ["array", "Raw data array to analyze"],
  "analysisType": ["enum", ["trend", "distribution", "correlation", "anomaly", "all"]]
}
```

### suggest_chart_type
Suggest the best chart type based on data characteristics and visualization purpose.

**Input Schema**:
```json
{
  "dataType": ["enum", ["time-series", "categorical", "numerical", "geographical", "hierarchical"]],
  "purpose": ["enum", ["comparison", "trend", "distribution", "relationship", "composition", "part-to-whole"]],
  "dataPoints": ["number", "Number of data points"],
  "dimensions": ["number", "Number of dimensions/variables"]
}
```

### validate_report_schema
Validate that a report object matches the required schema and fix common issues.

**Input Schema**:
```json
{
  "report": ["object", "Report object to validate"],
  "strict": ["boolean", "Whether to enforce strict validation"]
}
```

## Usage Example

```typescript
import { AnalysisAgent } from '@/lib/agents/analysis-agent';
import { windmillClient } from '@/lib/windmill-client';

// Fetch data from Windmill
const query = {
  index: 'sales-data',
  query: { match_all: {} },
};

const rawData = await windmillClient.executeJob(query);

// Analyze with agent
const agent = new AnalysisAgent();
const result = await agent.analyze({
  data: rawData,
  userPrompt: 'Focus on quarterly sales trends',
});

console.log('Generated report:', result.report);
console.log('Processing time:', result.metadata.processingTime, 'ms');
```

## Input/Output Contract

### Input
```typescript
interface AnalysisAgentInput {
  data: any[]; // Raw data from Windmill
  userPrompt?: string; // Optional context from user
}
```

### Output
```typescript
interface AnalysisAgentOutput {
  report: Report; // Complete Report JSON
  metadata: {
    processingTime: number;
    dataPoints: number;
    insights: number;
  };
}
```

## Error Scenarios

1. **Empty Data**: Return report with explanatory markdown component
2. **Invalid Data Format**: Extract what's possible, note limitations in markdown
3. **Schema Validation Failure**: Retry with corrected structure
4. **LLM Timeout**: Throw `AgentTimeoutError` with job details
5. **Tool Execution Error**: Log error, continue with available data

## Performance Metrics

- **Avg Execution Time**: 5-15 seconds (depends on data size)
- **Token Usage**: 3000-8000 tokens per report
- **Success Rate Target**: > 95%
- **User Satisfaction Target**: > 4.0/5.0

## Dependencies

- `@anthropic-ai/agent-sdk`: Claude Agent SDK
- `@anthropic-ai/sdk`: Anthropic API client
- `@/lib/windmill-client`: Windmill data fetching
- `@/types/report-schema`: Report schema and validation
- `zod`: Runtime schema validation
