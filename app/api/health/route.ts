// app/api/health/route.ts

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allow up to 25 s so the retry cycle has room to complete within Vercel's limit.
export const maxDuration = 25;

// How long to wait before the single retry attempt.
// Must be long enough for Supabase to finish waking from a paused state (~5–15 s)
// while still leaving time for the second request + response within maxDuration.
const RETRY_DELAY_MS = 8000;

/**
 * Redact a string so it is safe to log:
 * - Shows the scheme + first 8 chars of the host, then "***"
 * - Used for URLs (never keys).
 */
function redactUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname;
    return `${u.protocol}//${host.slice(0, 8)}***`;
  } catch {
    return '[unparseable-url]';
  }
}

/**
 * Probe the Supabase project by fetching the PostgREST root endpoint.
 *
 * Why not query a user table (e.g. `agencies`)?
 * – A paused Supabase project does not return HTTP 503 on PostgREST queries;
 *   it returns a connection error, which bypasses the postgrest-js retry logic.
 * – Querying a user table requires PostgREST's schema cache to be fully loaded;
 *   during a cold start this causes extra 503 → retry cycles that chew through
 *   the Vercel function timeout budget.
 *
 * The REST root endpoint (`/rest/v1/`) responds as soon as the project is
 * alive, requires no schema cache, and naturally wakes a paused project.
 */
async function checkSupabaseReachability(attempt: number): Promise<{ ok: boolean; errorMessage?: string }> {
  // ── Category 1: env var availability ────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('[health] diag=env_missing var=NEXT_PUBLIC_SUPABASE_URL attempt=%d', attempt);
    return { ok: false, errorMessage: 'NEXT_PUBLIC_SUPABASE_URL is not set.' };
  }
  if (!supabaseKey) {
    console.error('[health] diag=env_missing var=SUPABASE_SERVICE_ROLE_KEY attempt=%d', attempt);
    return { ok: false, errorMessage: 'SUPABASE_SERVICE_ROLE_KEY is not set.' };
  }

  // Log URL shape (redacted) so we can confirm it resolves to the right project.
  console.info(
    '[health] diag=env_ok attempt=%d url_prefix=%s key_prefix=%s key_length=%d',
    attempt,
    redactUrl(supabaseUrl),
    supabaseKey.slice(0, 12) + '***',  // first 12 chars of key prefix — safe, not the secret part
    supabaseKey.length
  );

  const targetUrl = `${supabaseUrl}/rest/v1/`;
  const startMs = Date.now();

  try {
    // ── Category 3: network / fetch ─────────────────────────────────────────
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const elapsedMs = Date.now() - startMs;

    // ── Category 4: Supabase REST response / status ──────────────────────────
    if (!res.ok) {
      // Read body for diagnostics — never returned to the client.
      const body = await res.text().catch(() => '(could not read body)');
      console.error(
        '[health] diag=http_error attempt=%d status=%d elapsed_ms=%d body_preview=%s',
        attempt,
        res.status,
        elapsedMs,
        // Trim to 200 chars; no secrets should appear here, but be conservative.
        body.replace(/["\s]+/g, ' ').slice(0, 200)
      );
      return { ok: false, errorMessage: `HTTP ${res.status}` };
    }

    console.info(
      '[health] diag=http_ok attempt=%d status=%d elapsed_ms=%d',
      attempt,
      res.status,
      elapsedMs
    );
    return { ok: true };

  } catch (err) {
    const elapsedMs = Date.now() - startMs;

    // ── Category 3 / 6: network error or Vercel runtime issue ───────────────
    const name  = err instanceof Error ? err.name    : 'UnknownError';
    const msg   = err instanceof Error ? err.message : String(err);
    // Distinguish DNS failure, connection refused, timeout, etc.
    console.error(
      '[health] diag=fetch_exception attempt=%d elapsed_ms=%d error_name=%s error_message=%s',
      attempt,
      elapsedMs,
      name,
      // Scrub any embedded URL/key that Node might include in the error message.
      msg.replace(supabaseUrl, '[SUPABASE_URL]').slice(0, 300)
    );
    return { ok: false, errorMessage: `fetch exception: ${name}` };
  }
}

/**
 * GET /api/health
 * Public, unauthenticated lightweight health check endpoint.
 * Probes the Supabase project via the PostgREST root endpoint to verify
 * connectivity, with a single automatic retry on cold-start / paused-project
 * wake-up, without returning any sensitive data, database records, or counts.
 *
 * All diagnostic detail is written to server-side logs only.
 * The public JSON body is intentionally generic.
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.info('[health] diag=request_start ts=%s', new Date().toISOString());

    let result = await checkSupabaseReachability(1);

    // If initial attempt fails (e.g. paused project or transient cold start), retry once
    // after a longer delay to allow Supabase time to fully wake from a paused state.
    if (!result.ok) {
      console.warn(
        '[health] diag=retry_scheduled delay_ms=%d reason=%s',
        RETRY_DELAY_MS,
        result.errorMessage ?? 'unknown'
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      result = await checkSupabaseReachability(2);
    }

    if (!result.ok) {
      console.error(
        '[health] diag=final_failure reason=%s',
        result.errorMessage ?? 'unknown'
      );
      // Public response: generic — no internal detail.
      return NextResponse.json(
        {
          success: false,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    console.info('[health] diag=success');
    return NextResponse.json(
      {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (err) {
    // Unexpected exception — log it, return generic 500.
    console.error(
      '[health] diag=unhandled_exception error=%s',
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
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
