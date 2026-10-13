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
    // Helper to sanitize any string against accidental URL or key leakage
    const sanitize = (val: unknown): string => {
      if (val === undefined || val === null) return 'undefined';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (supabaseUrl) str = str.split(supabaseUrl).join('[SUPABASE_URL]');
      if (supabaseKey) str = str.split(supabaseKey).join('[SUPABASE_KEY]');
      return str.slice(0, 300);
    };

    // Safely extract top-level error fields
    const errObj   = (typeof err === 'object' && err !== null) ? (err as Record<string, unknown>) : null;
    const errName  = typeof errObj?.name === 'string' ? errObj.name : (err instanceof Error ? err.name : 'UnknownError');
    const errMsg   = typeof errObj?.message === 'string' ? errObj.message : String(err);
    const errProps = errObj ? Object.getOwnPropertyNames(err) : [];

    // Safely extract underlying cause (Node.js fetch wraps OS/DNS/TLS errors in error.cause)
    const causeRaw = errObj ? errObj['cause'] : (err instanceof Error ? err.cause : undefined);
    const causeObj = (typeof causeRaw === 'object' && causeRaw !== null)
      ? (causeRaw as Record<string, unknown>)
      : null;

    const causeName     = causeObj?.name !== undefined ? String(causeObj.name) : undefined;
    const causeMsg      = causeObj?.message !== undefined ? String(causeObj.message) : undefined;
    const causeCode     = causeObj?.code !== undefined ? String(causeObj.code) : undefined;
    const causeErrno    = causeObj?.errno !== undefined ? String(causeObj.errno) : undefined;
    const causeSyscall  = causeObj?.syscall !== undefined ? String(causeObj.syscall) : undefined;
    const causeHostname = causeObj?.hostname !== undefined ? String(causeObj.hostname) : undefined;
    const causeAddress  = causeObj?.address !== undefined ? String(causeObj.address) : undefined;
    const causePort     = causeObj?.port !== undefined ? String(causeObj.port) : undefined;
    const causeProps    = causeObj ? Object.getOwnPropertyNames(causeObj) : undefined;

    console.error(
      '[health] diag=fetch_exception attempt=%d elapsed_ms=%d ' +
      'error_name=%s error_message=%s error_props=%s ' +
      'cause_name=%s cause_message=%s cause_code=%s cause_errno=%s ' +
      'cause_syscall=%s cause_hostname=%s cause_address=%s cause_port=%s ' +
      'cause_props=%s',
      attempt,
      elapsedMs,
      errName,
      sanitize(errMsg),
      JSON.stringify(errProps),
      sanitize(causeName),
      sanitize(causeMsg),
      sanitize(causeCode),
      sanitize(causeErrno),
      sanitize(causeSyscall),
      sanitize(causeHostname),
      sanitize(causeAddress),
      sanitize(causePort),
      causeProps ? JSON.stringify(causeProps) : 'undefined'
    );

    console.error('[health] diag=fetch_exception_details', JSON.stringify({
      attempt,
      elapsed_ms: elapsedMs,
      error_name: errName,
      error_message: sanitize(errMsg),
      error_props: errProps,
      cause_name: causeName !== undefined ? sanitize(causeName) : undefined,
      cause_message: causeMsg !== undefined ? sanitize(causeMsg) : undefined,
      cause_code: causeCode !== undefined ? sanitize(causeCode) : undefined,
      cause_errno: causeErrno !== undefined ? sanitize(causeErrno) : undefined,
      cause_syscall: causeSyscall !== undefined ? sanitize(causeSyscall) : undefined,
      cause_hostname: causeHostname !== undefined ? sanitize(causeHostname) : undefined,
      cause_address: causeAddress !== undefined ? sanitize(causeAddress) : undefined,
      cause_port: causePort !== undefined ? sanitize(causePort) : undefined,
      cause_props: causeProps,
    }));

    return { ok: false, errorMessage: `fetch exception: ${errName}` };
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
