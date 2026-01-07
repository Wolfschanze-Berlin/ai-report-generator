/**
 * Test Script: Windmill + Analysis Agent Integration
 *
 * Tests the complete flow from Windmill data fetching to Report JSON generation.
 *
 * Usage:
 *   bun run scripts/test-windmill-agent.ts
 */

import { windmillClient } from '@/lib/windmill-client';
import { AnalysisAgent } from '@/lib/agents/analysis-agent';

async function testWindmillAgent() {
  console.log('🧪 Testing Windmill + Analysis Agent Integration\n');

  try {
    // Step 1: Test Windmill Connection
    console.log('📡 Step 1: Fetching data from Windmill...');
    const query = {
      index: 'test-data',
      query: {
        match_all: {},
      },
      size: 100,
    };

    const startFetch = Date.now();
    const data = await windmillClient.executeJob(query);
    const fetchTime = Date.now() - startFetch;

    console.log(`✅ Data fetched: ${data.length} records in ${fetchTime}ms`);
    console.log(`📊 Sample data:`, JSON.stringify(data.slice(0, 2), null, 2), '\n');

    // Step 2: Check if clarification is needed
    console.log('🤔 Step 2: Checking if clarification is needed...');
    const agent = new AnalysisAgent();
    const clarification = await agent.checkClarification({
      data,
      userPrompt: 'Generate a comprehensive report',
    });

    if (clarification) {
      console.log('❓ Clarification needed:');
      console.log(`   Reason: ${clarification.reason}`);
      clarification.questions.forEach((q, i) => {
        console.log(`   Q${i + 1}: ${q.question}`);
        if (q.options) {
          console.log(`       Options: ${q.options.join(', ')}`);
        }
      });
      console.log('\n⚠️  Proceeding with analysis anyway for testing...\n');
    } else {
      console.log('✅ No clarification needed\n');
    }

    // Step 3: Analyze data and generate report
    console.log('🤖 Step 3: Analyzing data with AI agent...');
    const result = await agent.analyze({
      data,
      userPrompt: 'Generate a comprehensive report showing key trends and insights',
      title: 'Windmill Test Report',
      skipClarification: true, // Skip for testing
    });

    console.log('✅ Report generated successfully!\n');

    // Step 4: Display results
    console.log('📋 Report Details:');
    console.log(`   Title: ${result.report.title}`);
    console.log(`   Description: ${result.report.description}`);
    console.log(`   Components: ${result.report.components.length}`);
    console.log(`   Component types:`, result.report.components.map(c => c.type).join(', '));
    console.log(`\n⏱️  Performance:`);
    console.log(`   Data fetch: ${fetchTime}ms`);
    console.log(`   AI analysis: ${result.metadata.processingTime}ms`);
    console.log(`   Total: ${fetchTime + result.metadata.processingTime}ms`);
    console.log(`\n📊 Metadata:`);
    console.log(`   Data points: ${result.metadata.dataPoints}`);
    console.log(`   Insights: ${result.metadata.insights}`);
    console.log(`   Model: ${result.metadata.model}`);

    console.log('\n✅ All tests passed! Integration working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      console.error('   Error:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }

    process.exit(1);
  }
}

// Run tests
testWindmillAgent().catch(console.error);
