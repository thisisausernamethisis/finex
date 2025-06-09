import { NextRequest, NextResponse } from 'next/server'
import { AuthMonitor } from '../monitoring/authMonitor'

// Edge Runtime compatible logger
const createEdgeLogger = (service: string) => ({
  warn: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[${new Date().toISOString()}] [${service}] WARN: ${message}`, meta ? JSON.stringify(meta) : '')
    }
  },
  error: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[${new Date().toISOString()}] [${service}] ERROR: ${message}`, meta ? JSON.stringify(meta) : '')
    }
  }
})

// Rate limiting logger (Edge Runtime compatible)
const rateLimitLogger = createEdgeLogger('rate-limit')

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configurations
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  blockDurationMs?: number // How long to block after limit exceeded
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Very strict for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
  },
  // Moderate for API endpoints
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes
  },
  // Lenient for general endpoints
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
} as const

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = getRateLimitKey(req)
    const now = Date.now()
    
    // Clean up expired entries
    cleanupExpiredEntries(now)
    
    // Get current rate limit data
    const current = rateLimitStore.get(key)
    
    if (!current) {
      // First request from this key
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null // Allow request
    }
    
    // Check if window has expired
    if (now > current.resetTime) {
      // Reset the window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null // Allow request
    }
    
    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      const blockUntil = config.blockDurationMs 
        ? now + config.blockDurationMs 
        : current.resetTime
      
      // Log rate limit violation
      rateLimitLogger.warn('Rate limit exceeded', {
        key,
        count: current.count,
        limit: config.maxRequests,
        windowMs: config.windowMs,
        route: req.nextUrl.pathname,
        userAgent: req.headers.get('user-agent'),
        ipAddress: getClientIP(req)
      })
      
      // Create security alert for repeated violations
      if (current.count > config.maxRequests * 2) {
        AuthMonitor.createSecurityAlert(
          'Severe Rate Limit Violation',
          `Client ${key} has made ${current.count} requests (limit: ${config.maxRequests})`,
          {
            route: req.nextUrl.pathname,
            ipAddress: getClientIP(req),
            userAgent: req.headers.get('user-agent') || undefined,
            metadata: {
              requestCount: current.count,
              limit: config.maxRequests,
              severity: 'high'
            }
          }
        )
      }
      
      // Return rate limit response
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((blockUntil - now) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(blockUntil / 1000).toString(),
        }
      })
    }
    
    // Increment counter
    current.count++
    rateLimitStore.set(key, current)
    
    return null // Allow request
  }
}

/**
 * Generate rate limiting key based on IP and user agent
 */
function getRateLimitKey(req: NextRequest): string {
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Create a simple hash of user agent to avoid storing full strings
  const userAgentHash = hashString(userAgent).toString(36)
  
  return `${ip}:${userAgentHash}`
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const remoteAddr = req.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number) {
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((data, key) => {
    if (now > data.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => rateLimitStore.delete(key))
}

/**
 * Get rate limit status for a request
 */
export function getRateLimitStatus(
  req: NextRequest, 
  config: RateLimitConfig
): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const key = getRateLimitKey(req)
  const now = Date.now()
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }
  
  const remaining = Math.max(0, config.maxRequests - current.count)
  
  return {
    allowed: remaining > 0,
    remaining,
    resetTime: current.resetTime
  }
}

/**
 * Middleware to add rate limiting headers to responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  req: NextRequest,
  config: RateLimitConfig
): NextResponse {
  const status = getRateLimitStatus(req, config)
  
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', status.remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(status.resetTime / 1000).toString())
  
  return response
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  auth: createRateLimiter(RATE_LIMIT_CONFIGS.AUTH),
  api: createRateLimiter(RATE_LIMIT_CONFIGS.API),
  general: createRateLimiter(RATE_LIMIT_CONFIGS.GENERAL),
}

/**
 * Helper to apply rate limiting to API routes
 */
export async function withRateLimit<T>(
  req: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const rateLimiter = createRateLimiter(config)
  const rateLimitResponse = await rateLimiter(req)
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  return await handler()
} 