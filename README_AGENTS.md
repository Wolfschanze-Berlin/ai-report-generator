# AI Agents - Setup and Usage Guide

This guide explains how to use the AI agents in the AI Report Generator.

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
ANTHROPIC_API_KEY=your_api_key_here
WINDMILL_TOKEN=your_windmill_token_here
```

Get your Anthropic API key from: https://console.anthropic.com/

### 3. Test the Integration

```bash
bun run scripts/test-windmill-agent.ts
```

## Available Agents

### Analysis Agent

Transforms raw data from Windmill (or any source) into complete Report JSON.

**Features:**
- ✅ Automatic data pattern analysis
- ✅ Intelligent chart type selection
- ✅ KPI generation and insight synthesis
- ✅ 12-column grid layout optimization
- ✅ Schema validation with Zod
- ✅ Clarification questions when context is unclear

**Usage Example:**

```typescript
import { AnalysisAgent } from '@/lib/agents/analysis-agent';
import { windmillClient } from '@/lib/windmill-client';

// Fetch data from Windmill
const query = {
  index: 'sales-data',
  query: { match_all: {} },
  size: 1000,
};
const data = await windmillClient.executeJob(query);

// Create agent and analyze
const agent = new AnalysisAgent();

// Optional: Check if clarification is needed
const clarification = await agent.checkClarification({
  data,
  userPrompt: 'Show me Q4 sales performance',
});

if (clarification) {
  console.log('Clarification needed:', clarification.questions);
  // Present questions to user, then proceed with their answers
}

// Generate report
const result = await agent.analyze({
  data,
  userPrompt: 'Analyze Q4 sales performance with focus on regional trends',
  title: 'Q4 Sales Report',
  skipClarification: false, // Set to true to skip clarification check
});

console.log('Report generated:', result.report);
console.log('Metadata:', result.metadata);
```

### Clarification Agent (Coming Soon)

Converts natural language queries into structured OpenSearch queries.

### Monitoring Agent (Coming Soon)

Watches data sources for anomalies and triggers automated reports.

### Optimization Agent (Coming Soon)

Learns from user interactions to improve report quality over time.

## Agent Configuration

All agent configurations are centralized in `.claude/agents/config.ts`:

```typescript
import { DEFAULT_MODEL, ANALYSIS_AGENT_PROMPT } from '@/.claude/agents/config';
```

**Available Models:**
- `DEFAULT_MODEL`: Claude 3.5 Sonnet (balanced speed/quality)
- `HIGH_QUALITY_MODEL`: Claude Opus 4 (maximum quality)
- `FAST_MODEL`: Claude 3 Haiku (quick operations)

**Customizing Agent Behavior:**

```typescript
const agent = new AnalysisAgent();

// Use different model
agent.setModel('claude-opus-4-20250514');

// Adjust token limit
agent.setMaxTokens(16384); // for very complex reports
```

## Error Handling

The Analysis Agent provides structured error types:

```typescript
import { AnalysisAgentError } from '@/lib/agents/analysis-agent';

try {
  const result = await agent.analyze({ data });
} catch (error) {
  if (error instanceof AnalysisAgentError) {
    switch (error.code) {
      case 'INVALID_DATA':
        console.error('No data provided or data is empty');
        break;
      case 'SCHEMA_VALIDATION':
        console.error('Generated report does not match schema');
        console.error('Details:', error.details);
        break;
      case 'LLM_ERROR':
        console.error('Claude API error:', error.message);
        break;
      case 'TIMEOUT':
        console.error('Analysis took too long');
        break;
    }
  }
}
```

## Testing

### Run Integration Tests

```bash
bun run scripts/test-windmill-agent.ts
```

This tests:
1. Windmill data fetching
2. Clarification logic
3. Report generation
4. Schema validation
5. Performance metrics

### Manual Testing with Real Data

```typescript
// Create test file: scripts/test-custom-data.ts
import { AnalysisAgent } from '@/lib/agents/analysis-agent';

const testData = [
  { date: '2024-01-01', sales: 1000, region: 'North' },
  { date: '2024-01-02', sales: 1200, region: 'North' },
  { date: '2024-01-01', sales: 900, region: 'South' },
  // ... more data
];

const agent = new AnalysisAgent();
const result = await agent.analyze({
  data: testData,
  userPrompt: 'Compare sales by region',
});

console.log(JSON.stringify(result.report, null, 2));
```

## Architecture

```
┌─────────────────┐
│   User Request  │
└────────┬────────┘
         │
         v
┌─────────────────┐     ┌──────────────────┐
│ Windmill Client │────>│  Raw Data Array  │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 v
                        ┌─────────────────┐
                        │ Analysis Agent  │
                        │                 │
                        │ 1. Check clarity│
                        │ 2. Analyze data │
                        │ 3. Select charts│
                        │ 4. Generate KPIs│
                        │ 5. Create layout│
                        │ 6. Validate     │
                        └────────┬────────┘
                                 │
                                 v
                        ┌─────────────────┐
                        │  Report JSON    │
                        │  (Validated)    │
                        └────────┬────────┘
                                 │
                                 v
                        ┌─────────────────┐
                        │ Report Renderer │
                        └─────────────────┘
```

## Performance Tips

1. **Use appropriate models:**
   - Haiku for simple data (< 100 rows)
   - Sonnet for medium complexity (100-1000 rows)
   - Opus for complex analysis (> 1000 rows or many dimensions)

2. **Optimize data:**
   - Send only necessary fields
   - Pre-aggregate when possible
   - Limit to relevant time ranges

3. **Provide context:**
   - Clear userPrompt reduces processing time
   - Specific focus areas prevent over-analysis
   - Skip clarification when context is clear

4. **Cache results:**
   - Store generated reports in database
   - Reuse for similar queries
   - Implement incremental updates

## Troubleshooting

### "ANTHROPIC_API_KEY not found"

Make sure you:
1. Created `.env` file (copy from `.env.example`)
2. Added your API key to `.env`
3. Restarted your development server

### "No valid JSON found in agent response"

This usually means:
1. The model couldn't generate valid JSON
2. The prompt was unclear
3. The data structure was too complex

**Solution:**
- Add more context to `userPrompt`
- Use a higher quality model
- Simplify the data structure

### "Report validation failed"

The generated JSON doesn't match the Report schema.

**Solution:**
- Check [src/types/report-schema.ts](src/types/report-schema.ts) for schema
- Look at error details for specific field issues
- Try with a smaller dataset first

### Performance Issues

If analysis takes > 30 seconds:
- Reduce data size (use Windmill aggregations)
- Use faster model (Haiku)
- Provide more specific userPrompt
- Skip clarification step

## Next Steps

1. **Integrate with UI:**
   - Add report generation page
   - Display clarification questions
   - Show real-time progress

2. **Add More Agents:**
   - Clarification Agent for query building
   - Monitoring Agent for anomaly detection
   - Optimization Agent for learning

3. **Enhance Features:**
   - Multi-language support
   - Custom chart templates
   - Export formats (PDF, Excel)

## Resources

- [Agent Architecture Docs](docs/ai-agents.md)
- [Report Schema](src/types/report-schema.md)
- [Database Schema](docs/database-schema.md)
- [Anthropic API Docs](https://docs.anthropic.com/)
