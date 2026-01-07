/**
 * Test Script: Analysis Agent Only (No Windmill)
 *
 * Tests the Analysis Agent with mock data to verify it works correctly.
 *
 * Usage:
 *   bun run scripts/test-agent-only.ts
 */

import { AnalysisAgent } from '@/lib/agents/analysis-agent';

async function testAnalysisAgent() {
  console.log('🧪 Testing Analysis Agent\n');

  try {
    // Create mock sales data
    const mockData = [
      { date: '2024-01-01', sales: 15000, region: 'North', product: 'Widget A' },
      { date: '2024-01-02', sales: 18000, region: 'North', product: 'Widget A' },
      { date: '2024-01-03', sales: 22000, region: 'North', product: 'Widget A' },
      { date: '2024-01-01', sales: 12000, region: 'South', product: 'Widget A' },
      { date: '2024-01-02', sales: 14000, region: 'South', product: 'Widget A' },
      { date: '2024-01-03', sales: 16000, region: 'South', product: 'Widget A' },
      { date: '2024-01-01', sales: 20000, region: 'North', product: 'Widget B' },
      { date: '2024-01-02', sales: 23000, region: 'North', product: 'Widget B' },
      { date: '2024-01-03', sales: 25000, region: 'North', product: 'Widget B' },
      { date: '2024-01-01', sales: 18000, region: 'South', product: 'Widget B' },
      { date: '2024-01-02', sales: 19500, region: 'South', product: 'Widget B' },
      { date: '2024-01-03', sales: 21000, region: 'South', product: 'Widget B' },
    ];

    console.log(`📊 Mock data created: ${mockData.length} records`);
    console.log(`   Regions: North, South`);
    console.log(`   Products: Widget A, Widget B`);
    console.log(`   Date range: 2024-01-01 to 2024-01-03\n`);

    // Step 1: Check if clarification is needed
    console.log('🤔 Step 1: Checking if clarification is needed...');
    const agent = new AnalysisAgent();
    agent.setModel('claude-haiku-4-5-20251001'); // Use Haiku for faster testing
    const clarification = await agent.checkClarification({
      data: mockData,
      userPrompt: 'Compare sales performance by region and product',
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
      console.log('✅ No clarification needed - user context is clear\n');
    }

    // Step 2: Analyze data and generate report
    console.log('🤖 Step 2: Analyzing data with AI agent...');
    console.log('   This may take 10-30 seconds...\n');

    const startTime = Date.now();
    const result = await agent.analyze({
      data: mockData,
      userPrompt: 'Compare sales performance by region and product. Show trends over time and identify top performers.',
      title: 'Sales Performance Analysis',
      skipClarification: true,
    });

    console.log('✅ Report generated successfully!\n');

    // Step 3: Display results
    console.log('📋 Report Details:');
    console.log(`   Title: ${result.report.title}`);
    console.log(`   Description: ${result.report.description || 'N/A'}`);
    console.log(`   Components: ${result.report.components.length}`);

    console.log(`\n📦 Component Breakdown:`);
    const componentCounts = result.report.components.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(componentCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log(`\n⏱️  Performance:`);
    console.log(`   AI analysis: ${result.metadata.processingTime}ms`);
    console.log(`   Rate: ${(result.metadata.dataPoints / (result.metadata.processingTime / 1000)).toFixed(0)} records/sec`);

    console.log(`\n📊 Metadata:`);
    console.log(`   Data points: ${result.metadata.dataPoints}`);
    console.log(`   Insights: ${result.metadata.insights}`);
    console.log(`   Model: ${result.metadata.model}`);

    // Step 4: Show sample component
    console.log(`\n🔍 Sample Component (first component):`);
    const firstComponent = result.report.components[0];
    console.log(`   Type: ${firstComponent.type}`);
    console.log(`   ID: ${firstComponent.id}`);
    console.log(`   Position: x=${firstComponent.position.x}, y=${firstComponent.position.y}, w=${firstComponent.position.w}, h=${firstComponent.position.h}`);
    if (firstComponent.type === 'kpi') {
      console.log(`   Value: ${firstComponent.data.value}`);
      console.log(`   Label: ${firstComponent.data.label}`);
    }

    console.log('\n✅ All tests passed! Analysis Agent working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Add your Windmill configuration');
    console.log('   2. Update test-windmill-agent.ts with correct index');
    console.log('   3. Test with real Windmill data');

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      console.error('   Error:', error.message);
      if (error.stack) {
        console.error('\n   Stack:', error.stack);
      }
    }

    process.exit(1);
  }
}

// Run tests
testAnalysisAgent().catch(console.error);
