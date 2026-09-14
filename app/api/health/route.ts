// app/api/health/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const RETRY_DELAY_MS = 1000;

async function checkDatabaseConnection(): Promise<{ ok: boolean; errorMessage?: string }> {
  const { error } = await supabaseServer
    .from('agencies')
    .select('id')
    .limit(1);

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  return { ok: true };
}

/**
 * GET /api/health
 * Public, unauthenticated lightweight health check endpoint.
 * Performs a minimal database query to verify Supabase connectivity
 * with a single automatic retry on cold-start/transient gateway delay,
 * without returning any sensitive data, database records, or counts.
 */
export async function GET(): Promise<NextResponse> {
  try {
    let result = await checkDatabaseConnection();

    // If initial attempt fails (e.g. transient gateway cold start), retry once after a short delay
    if (!result.ok) {
      console.warn('Initial health check database query failed, retrying in 1s...');
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      result = await checkDatabaseConnection();
    }

    if (!result.ok) {
      console.error('Health check database query failed:', result.errorMessage);
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

