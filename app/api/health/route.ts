// app/api/health/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Public, unauthenticated lightweight health check endpoint.
 * Performs a minimal database query to verify Supabase connectivity
 * without returning any sensitive data, database records, or counts.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Perform a minimal database operation: query 1 ID from the root agencies table
    const { error } = await supabaseServer
      .from('agencies')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Health check database query failed:', error.message);
      return NextResponse.json(
        {
          success: false,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(
      'Health check exception:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
