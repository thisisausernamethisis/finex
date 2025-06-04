import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rate limiting implementation
const ratelimit = {
  tokensPerInterval: 50,
  interval: 60 * 1000, // 1 minute
  fireImmediately: true,
  ipCache: new Map<string, { tokens: number; lastRefill: number }>(),
  
  check: (ip: string) => {
    const now = Date.now()
    let record = ratelimit.ipCache.get(ip)
    
    if (!record) {
      record = { tokens: ratelimit.tokensPerInterval, lastRefill: now }
      ratelimit.ipCache.set(ip, record)
      return { success: true, limit: ratelimit.tokensPerInterval, remaining: ratelimit.tokensPerInterval - 1 }
    }
    
    // Refill tokens based on elapsed time
    const elapsed = now - record.lastRefill
    const refillTokens = Math.floor(elapsed / ratelimit.interval) * ratelimit.tokensPerInterval
    
    if (refillTokens > 0) {
      record.tokens = Math.min(record.tokens + refillTokens, ratelimit.tokensPerInterval)
      record.lastRefill = now
    }
    
    // Check if there are enough tokens
    if (record.tokens > 0) {
      record.tokens -= 1
      return { success: true, limit: ratelimit.tokensPerInterval, remaining: record.tokens }
    }
    
    return { success: false, limit: ratelimit.tokensPerInterval, remaining: 0 }
  }
}

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(['/', '/sign-in', '/sign-up']);

// Combine Clerk middleware with rate limiting
export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting to API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    // Get client IP
    const ip = req.ip ?? '127.0.0.1'
    const { success, limit, remaining } = ratelimit.check(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': ratelimit.interval.toString()
          }
        }
      )
    }
  }

  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  return NextResponse.next();
})

// Export config from Clerk
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
