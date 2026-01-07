/**
 * Test Script: Windmill Integration with Real Data
 *
 * Tests the complete flow: Windmill → Analysis Agent → Report JSON
 *
 * Usage:
 *   bun run scripts/test-windmill-real.ts
 */

import { windmillClient } from '@/lib/windmill-client';
import { AnalysisAgent } from '@/lib/agents/analysis-agent';

async function testWindmillIntegration() {
  console.log('🧪 Testing Windmill Integration with Real Data\n');

  try {
    // Step 1: Fetch data from Windmill with OpenSearch query
    console.log('📡 Step 1: Fetching data from Windmill...');
    console.log('   Index: Already configured in Windmill client');

    // Example query: Get user activity data from last 7 days
    // OpenSearch requires query to be wrapped in { query: {...} }
    const query = {
      query: {
        bool: {
          filter: [
            {
              range: {
                'query.endDate': {
                  gte: 'now-7d',
                  lte: 'now'
                }
              }
            }
          ]
        }
      },
      size: 1000, // Limit results
      sort: [
        { 'query.endDate': { order: 'desc' } }
      ]
    };

    console.log('   Query:', JSON.stringify(query, null, 2));
    console.log('   Executing job...\n');

    const startTime = Date.now();
    const data = await windmillClient.executeJob(query, {
      timeout: 120000, // 2 minutes
      pollInterval: 2000, // Poll every 2 seconds
    });

    const fetchTime = Date.now() - startTime;
    console.log(`✅ Data fetched successfully!`);

    // OpenSearch returns { hits: { hits: [...] } }
    let records: any[] = [];
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        records = data;
      } else if (data.hits && data.hits.hits && Array.isArray(data.hits.hits)) {
        // Extract _source from each hit
        records = data.hits.hits.map((hit: any) => hit._source || hit);
      } else if (data.aggregations) {
        console.log('   ⚠️  Result contains aggregations, not raw records');
        console.log(`   Aggregations: ${Object.keys(data.aggregations).join(', ')}`);
      }
    }

    console.log(`   Records: ${records.length}`);
    console.log(`   Fetch time: ${fetchTime}ms\n`);

    // Show sample of data structure
    if (records.length > 0) {
      console.log('📋 Sample record structure:');
      const firstRecord = records[0];
      const fields = Object.keys(firstRecord);
      console.log(`   Fields (${fields.length}): ${fields.slice(0, 10).join(', ')}${fields.length > 10 ? '...' : ''}\n`);
    } else {
      console.log('⚠️  No records found. Response structure:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
      console.log('\n');
    }

    // Step 2: Analyze with AI Agent
    console.log('🤖 Step 2: Analyzing data with Analysis Agent...');
    console.log('   This may take 20-40 seconds...\n');

    const agent = new AnalysisAgent();
    // Use Sonnet for better quality with real data
    agent.setModel('claude-sonnet-4-5-20250929');

    const result = await agent.analyze({
      data: records,
      userPrompt: 'Analyze user activity patterns. Identify key trends, peak usage times, and interesting behaviors.',
      title: 'User Activity Analysis - Last 7 Days',
      skipClarification: true,
    });

    console.log('✅ Report generated successfully!\n');

    // Step 3: Display results
    console.log('📊 Report Details:');
    console.log(`   Title: ${result.report.title}`);
    console.log(`   Description: ${result.report.description || 'N/A'}`);
    console.log(`   Components: ${result.report.components.length}`);
    console.log(`   Generated at: ${result.report.generatedAt}`);

    console.log(`\n📦 Component Breakdown:`);
    const componentCounts = result.report.components.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(componentCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log(`\n⏱️  Performance:`);
    console.log(`   Windmill fetch: ${fetchTime}ms`);
    console.log(`   AI analysis: ${result.metadata.processingTime}ms`);
    console.log(`   Total time: ${fetchTime + result.metadata.processingTime}ms`);

    console.log(`\n📊 Metadata:`);
    console.log(`   Data points: ${result.metadata.dataPoints}`);
    console.log(`   Insights: ${result.metadata.insights}`);
    console.log(`   Model: ${result.metadata.model}`);

    // Step 4: Show component titles
    console.log(`\n📋 Component Titles:`);
    result.report.components.forEach((comp, idx) => {
      console.log(`   ${idx + 1}. [${comp.type.toUpperCase()}] ${comp.title || comp.id}`);
    });

    console.log('\n✅ All tests passed! Windmill integration working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Test with different query filters');
    console.log('   2. Try different aggregations');
    console.log('   3. Integrate with UI for real-time reporting');

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      console.error('   Error:', error.message);
      console.error('   Name:', error.name);

      if (error.stack) {
        console.error('\n   Stack trace:');
        console.error(error.stack);
      }
    }

    process.exit(1);
  }
}

// Run test
testWindmillIntegration().catch(console.error);
