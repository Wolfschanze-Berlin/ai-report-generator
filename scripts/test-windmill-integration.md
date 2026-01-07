# Windmill Integration Test Guide

This guide explains how to test the Analysis Agent with real Windmill data.

## Prerequisites

1. **Windmill Setup**:
   - Windmill account configured
   - OpenSearch connection set up
   - Test data available in OpenSearch

2. **Environment Configuration**:
   - `.env` file with `WINDMILL_TOKEN`
   - `.env` file with `ANTHROPIC_API_KEY`

## Test Configuration

The Windmill client is already implemented and ready to use. You just need to configure the correct query for your OpenSearch data.

### Example Query Structure

```typescript
const query = {
  index: 'your-index-name',  // Replace with your actual index
  query: {
    bool: {
      must: [
        {
          range: {
            '@timestamp': {
              gte: 'now-7d',
              lte: 'now'
            }
          }
        }
      ]
    }
  },
  size: 1000,  // Adjust based on data volume
  sort: [
    { '@timestamp': { order: 'desc' } }
  ]
};
```

### Running the Test

**Option 1: Use test-windmill-agent.ts (needs query update)**

1. Edit `scripts/test-windmill-agent.ts`
2. Update the `query` object with your actual index name and query
3. Run:
   ```bash
   bun run scripts/test-windmill-agent.ts
   ```

**Option 2: Create custom test script**

```typescript
import { windmillClient } from '@/lib/windmill-client';
import { AnalysisAgent } from '@/lib/agents/analysis-agent';

async function testWithRealData() {
  // 1. Fetch data from Windmill
  const data = await windmillClient.executeJob({
    index: 'sales-2024',
    query: { match_all: {} },
    size: 100
  });

  console.log(`Fetched ${data.length} records`);

  // 2. Analyze with AI
  const agent = new AnalysisAgent();
  const result = await agent.analyze({
    data,
    userPrompt: 'Analyze sales trends and identify top performers',
    title: 'Sales Analysis Report'
  });

  console.log('Report generated:', result.report.title);
  console.log('Components:', result.report.components.length);
}

testWithRealData();
```

## Expected Flow

```
┌─────────────────────┐
│   Your OpenSearch   │
│   (via Windmill)    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  WindmillClient     │
│  .executeJob()      │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Raw Data Array     │
│  (100-1000 records) │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Analysis Agent     │
│  Claude 4.5 Sonnet  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Report JSON        │
│  (Validated)        │
└─────────────────────┘
```

## Troubleshooting

### Windmill Connection Issues

**Error**: `WindmillAPIError: Failed to trigger job`

**Solutions**:
1. Check `WINDMILL_TOKEN` in `.env`
2. Verify Windmill workspace is accessible
3. Test with Windmill UI first to ensure query works
4. Check network connectivity to Windmill API

### Index Not Found

**Error**: `index_not_found_exception`

**Solutions**:
1. Verify index name matches exactly (case-sensitive)
2. Check if index exists in OpenSearch
3. Ensure you have permissions to access the index

### No Data Returned

**Error**: Empty array or 0 records

**Solutions**:
1. Check date range in query (might be too restrictive)
2. Verify data exists for the time period
3. Try `match_all` query first to see if any data exists
4. Check OpenSearch query syntax

### Schema Validation Fails

**Error**: `Report validation failed`

**Current Status**: The agent is generating reports but schema needs fine-tuning. This is expected and being actively worked on.

**Workaround**: The agent will improve with more examples and iterations.

## Next Steps

Once Windmill integration is working:

1. **Test with Different Data Types**:
   - Time series data
   - Categorical data
   - Numerical metrics
   - Mixed data types

2. **Optimize Performance**:
   - Adjust query size based on use case
   - Use aggregations in OpenSearch when possible
   - Cache frequently accessed data

3. **Add Error Handling**:
   - Retry logic for failed queries
   - Fallback for empty results
   - User-friendly error messages

4. **Integrate with UI**:
   - Real-time progress updates
   - Clarification question modal
   - Report preview and editing
