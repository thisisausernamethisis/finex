import { NextResponse } from 'next/server'

// Temporarily comment out Clerk import until proper types are in place
//import { authMiddleware } from '@clerk/nextjs/server'

import { createRateLimiter } from 'lib/rateLimit';
const rl = createRateLimiter();       // 50/min in prod
export { rl as ratelimit };

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
    const ip = req.ip ?? 'GLOBAL'
    
    // Check rate limit
    const { success, limit, remaining } = rl.check(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': '60'  // 60 seconds retry interval
          }
        }
      )
    }
    
    // Add rate limit headers to successful response
    const res = NextResponse.next()
    rl.limit(res, ip);  // Sets headers with consistent format
    return res
  }
})

// Export config from Clerk
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
