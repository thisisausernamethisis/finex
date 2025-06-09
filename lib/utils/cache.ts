/**
 * Cache busting utilities for Vercel deployment
 */

/**
 * Get the current cache bust version from environment variables
 * This can be updated to force fresh deployments
 */
export function getCacheBustVersion(): string {
  return process.env.CACHE_BUST_VERSION || process.env.DEPLOYMENT_TRIGGER || Date.now().toString();
}

/**
 * Get cache busting query parameter for URLs
 */
export function getCacheBustParam(): string {
  return `?v=${getCacheBustVersion()}`;
}

/**
 * Add cache busting to a URL
 */
export function addCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${getCacheBustVersion()}`;
}

/**
 * Cache control headers for different content types
 */
export const CACHE_HEADERS = {
  // No cache for dynamic pages
  NO_CACHE: {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'public, max-age=0',
  },
  // Short cache for API responses
  SHORT_CACHE: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, max-age=60',
  },
  // Long cache for static assets
  STATIC_CACHE: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000',
  },
} as const;