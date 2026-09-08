// lib/utils/rateLimit.ts

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds until window reset
}

interface RateLimitRecord {
  count: number;
  resetAt: number; // Timestamp in milliseconds
}

// Global store to persist across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __reportpilot_ratelimit_store__: Map<string, RateLimitRecord> | undefined;
}

const store: Map<string, RateLimitRecord> =
  globalThis.__reportpilot_ratelimit_store__ ||
  (globalThis.__reportpilot_ratelimit_store__ = new Map());

// Periodic cleanup of expired entries to prevent memory leaks
let lastCleanup = Date.now();
function cleanupExpiredEntries(): void {
  const now = Date.now();
  // Run cleanup at most once every 60 seconds or if store grows large
  if (now - lastCleanup < 60_000 && store.size < 1_000) {
    return;
  }
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Helper to safely extract integer from environment variables with fallback
 */
function getEnvNumber(name: string, fallback: number): number {
  const val = process.env[name];
  if (val !== undefined && val.trim() !== '') {
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * Configurable rate limit thresholds via environment variables with safe defaults
 */
export function getRateLimitConfig() {
  return {
    login: {
      ipMax: getEnvNumber('RATE_LIMIT_LOGIN_IP_MAX', 10), // 10 attempts per IP per 15 min
      ipWindowSec: getEnvNumber('RATE_LIMIT_LOGIN_IP_WINDOW_SECONDS', 900),
      accountMax: getEnvNumber('RATE_LIMIT_LOGIN_ACCOUNT_MAX', 5), // 5 failed attempts per account per 15 min
      accountWindowSec: getEnvNumber('RATE_LIMIT_LOGIN_ACCOUNT_WINDOW_SECONDS', 900),
    },
    signup: {
      ipMax: getEnvNumber('RATE_LIMIT_SIGNUP_IP_MAX', 5), // 5 registrations per IP per hour
      ipWindowSec: getEnvNumber('RATE_LIMIT_SIGNUP_IP_WINDOW_SECONDS', 3600),
    },
    passwordAction: {
      max: getEnvNumber('RATE_LIMIT_PASSWORD_ACTION_MAX', 20), // 20 account creations/resets per hour
      windowSec: getEnvNumber('RATE_LIMIT_PASSWORD_ACTION_WINDOW_SECONDS', 3600),
    },
    publicPortal: {
      ipMax: getEnvNumber('RATE_LIMIT_PUBLIC_PORTAL_IP_MAX', 60), // 60 requests/min per IP
      ipWindowSec: getEnvNumber('RATE_LIMIT_PUBLIC_PORTAL_IP_WINDOW_SECONDS', 60),
      tokenMax: getEnvNumber('RATE_LIMIT_PUBLIC_PORTAL_TOKEN_MAX', 120), // 120 requests/min per token
      tokenWindowSec: getEnvNumber('RATE_LIMIT_PUBLIC_PORTAL_TOKEN_WINDOW_SECONDS', 60),
    },
    authenticated: {
      max: getEnvNumber('RATE_LIMIT_AUTH_USER_MAX', 200), // 200 requests/min per authenticated user
      windowSec: getEnvNumber('RATE_LIMIT_AUTH_USER_WINDOW_SECONDS', 60),
    },
  };
}

/**
 * Extract client IP from incoming request headers
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  return '127.0.0.1';
}

/**
 * Core sliding/fixed window rate limit check
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    const resetSec = Math.ceil(resetAt / 1000);
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: resetSec,
      retryAfter: windowSeconds,
    };
  }

  // Existing window
  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  const resetSec = Math.ceil(existing.resetAt / 1000);
  const remaining = Math.max(0, limit - existing.count);

  if (existing.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      reset: resetSec,
      retryAfter,
    };
  }

  return {
    allowed: true,
    limit,
    remaining,
    reset: resetSec,
    retryAfter,
  };
}

/**
 * Reset a rate limit key (e.g. clear account rate limit upon successful login)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Construct a standardized 429 Too Many Requests response with standard headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message: string = 'Too many requests. Please try again later.'
): NextResponse<{ success: false; error: string }> {
  return NextResponse.json(
    { success: false, error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}
