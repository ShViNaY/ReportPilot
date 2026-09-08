// lib/utils/url.ts

import type { NextRequest } from 'next/server';

/**
 * Get the application's base URL across development and production environments.
 *
 * Precedence:
 * 1. Explicit NEXT_PUBLIC_APP_URL environment variable (e.g. custom domain or production URL)
 * 2. Vercel deployment environment variables (VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL)
 * 3. Request headers (x-forwarded-proto, x-forwarded-host / host)
 * 4. Client-side browser window.location.origin
 * 5. Default fallback to http://localhost:3000
 */
export function getBaseUrl(request?: NextRequest | Request): string {
  // 1. Explicitly configured app URL (highest priority for custom domains/production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }

  // 2. Vercel deployment variables (automatically set by Vercel platform)
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, '')}`;
  }

  // 3. Request headers (server-side runtime)
  if (request) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto =
      request.headers.get('x-forwarded-proto') ||
      (host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https');

    if (host) {
      return `${proto}://${host}`;
    }
  }

  // 4. Browser location (client-side runtime)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 5. Default local development fallback
  return 'http://localhost:3000';
}

/**
 * Generate a complete, canonical Client Portal URL for a given portal token.
 */
export function getPortalUrl(token: string, request?: NextRequest | Request): string {
  const base = getBaseUrl(request);
  return `${base}/portal/${token}`;
}
