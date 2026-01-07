import { NextRequest, NextResponse } from 'next/server';
import { AnalysisAgent } from '@/lib/agents/analysis-agent';

/**
 * POST /api/analyze
 *
 * Analyze data with AI Agent and generate Report JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, userPrompt, title, skipClarification = true } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Missing or invalid data parameter (must be array)' },
        { status: 400 }
      );
    }

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'Missing userPrompt parameter' },
        { status: 400 }
      );
    }

    // Initialize Analysis Agent
    const agent = new AnalysisAgent();
    agent.setModel('claude-sonnet-4-5-20250929'); // Use Sonnet 4.5 for quality

    // Analyze data
    const startTime = Date.now();
    const result = await agent.analyze({
      data,
      userPrompt,
      title: title || 'Data Analysis Report',
      skipClarification,
    });
    const analysisTime = Date.now() - startTime;

    return NextResponse.json({
      report: result.report,
      metadata: {
        ...result.metadata,
        processingTime: analysisTime,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
