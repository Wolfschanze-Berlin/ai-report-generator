import { NextRequest, NextResponse } from 'next/server';
import { windmillClient } from '@/lib/windmill-client';

/**
 * POST /api/windmill/query
 *
 * Execute OpenSearch query via Windmill and return results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Execute Windmill job
    const startTime = Date.now();
    const data = await windmillClient.executeJob(query, {
      timeout: 120000, // 2 minutes
      pollInterval: 2000, // Poll every 2 seconds
    });

    const fetchTime = Date.now() - startTime;

    // Extract records from OpenSearch response
    let records: any[] = [];
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        records = data;
      } else if (data.hits && data.hits.hits && Array.isArray(data.hits.hits)) {
        // Extract _source from each hit
        records = data.hits.hits.map((hit: any) => hit._source || hit);
      } else if (data.aggregations) {
        // If aggregations are present, include them in the response
        return NextResponse.json({
          records: [],
          aggregations: data.aggregations,
          fetchTime,
          message: 'Query returned aggregations, not raw records',
        });
      }
    }

    return NextResponse.json({
      records,
      fetchTime,
      count: records.length,
    });
  } catch (error) {
    console.error('Windmill query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
