// lib/utils/apiCache.ts
'use client';

import { apiFetch } from './apiClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for API responses
const cache = new Map<string, CacheEntry<unknown>>();

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<unknown>>();

// Default stale time (2 minutes)
const DEFAULT_TTL_MS = 2 * 60 * 1000;

/**
 * Format a Date object to YYYY-MM-DD string for stable cache keys and API queries.
 * Prevents millisecond discrepancies from causing cache misses across navigations.
 */
export function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get synchronously from cache if present and not expired
 */
export function getCachedData<T>(url: string, maxAgeMs: number = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(url);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > maxAgeMs;
  if (isExpired) {
    return null;
  }

  return entry.data as T;
}

/**
 * Set data into cache manually
 */
export function setCachedData<T>(url: string, data: T): void {
  cache.set(url, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fetch from API with in-memory caching and in-flight request deduplication.
 * If forceRefresh is false and fresh cached data exists, returns cached data immediately.
 */
export async function cachedApiFetch<T>(
  url: string,
  options?: RequestInit,
  config?: { maxAgeMs?: number; forceRefresh?: boolean }
): Promise<T> {
  const maxAgeMs = config?.maxAgeMs ?? DEFAULT_TTL_MS;
  const forceRefresh = config?.forceRefresh ?? false;

  // Only GET requests should be cached
  const isGet = !options?.method || options.method.toUpperCase() === 'GET';

  if (isGet && !forceRefresh) {
    const cached = getCachedData<T>(url, maxAgeMs);
    if (cached !== null) {
      return cached;
    }
  }

  // Deduplicate concurrent in-flight requests to the same URL
  if (isGet && pendingRequests.has(url)) {
    return pendingRequests.get(url) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const res = await apiFetch(url, options);
      const data = await res.json();

      if (isGet && data && data.success) {
        cache.set(url, {
          data,
          timestamp: Date.now(),
        });
      }

      return data as T;
    } finally {
      if (isGet) {
        pendingRequests.delete(url);
      }
    }
  })();

  if (isGet) {
    pendingRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Invalidate cache entries that match a prefix or pattern
 */
export function invalidateCache(urlPattern: string | RegExp): void {
  for (const key of cache.keys()) {
    if (typeof urlPattern === 'string') {
      if (key.startsWith(urlPattern) || key.includes(urlPattern)) {
        cache.delete(key);
      }
    } else if (urlPattern.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate all clients & dependent caches
 */
export function invalidateClientsCache(): void {
  invalidateCache('/api/clients');
  invalidateCache('/api/dashboard');
}

/**
 * Invalidate all campaigns & dependent caches
 */
export function invalidateCampaignsCache(): void {
  invalidateCache('/api/campaigns');
  invalidateCache('/api/metrics');
  invalidateCache('/api/dashboard');
}

/**
 * Invalidate all metrics & dashboard caches
 */
export function invalidateMetricsCache(): void {
  invalidateCache('/api/metrics');
  invalidateCache('/api/dashboard');
}

/**
 * Invalidate all team & clients caches
 */
export function invalidateTeamCache(): void {
  invalidateCache('/api/team');
  invalidateCache('/api/clients');
}

/**
 * Completely clear cache (MUST be called on logout)
 */
export function clearApiCache(): void {
  cache.clear();
  pendingRequests.clear();
}
