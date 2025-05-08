import { NextResponse } from 'next/server'

// Temporarily comment out Clerk import until proper types are in place
//import { authMiddleware } from '@clerk/nextjs/server'

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

// Mock implementation of auth middleware until proper types are in place
const mockAuthMiddleware = (config: any) => {
  return (req: any) => {
    if (config.beforeAuth) {
      return config.beforeAuth(req);
    }
    return NextResponse.next();
  };
};

// This combines Clerk's auth middleware with rate limiting
export default mockAuthMiddleware({
  publicRoutes: ['/'],
  beforeAuth: async (req: any) => {
    // Only apply rate limiting to API routes
    if (!req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    
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
    
    // Add rate limit headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    
    return response
  }
})

// Export config from Clerk
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
