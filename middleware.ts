import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Development password lock
const DEV_USERNAME = 'admin'
const DEV_PASSWORD = 'wombat81'

function checkDevAuth(req: any) {
  const devAuth = req.cookies.get('dev-auth')?.value
  return devAuth === 'authenticated'
}

function createDevLoginPage() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Development Access</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .login-box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        input { display: block; width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #1860e2; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
        button:hover { background: #1550c2; }
        h2 { text-align: center; color: #333; }
        .error { color: red; text-align: center; margin: 0.5rem 0; }
      </style>
    </head>
    <body>
      <div class="login-box">
        <h2>🔒 Development Access</h2>
        <form method="POST" action="/api/dev-auth">
          <input type="text" name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Access Application</button>
        </form>
        <p style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 1rem;">
          Development environment - authorized access only
        </p>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

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

// Combine Clerk middleware with rate limiting and dev auth
export default clerkMiddleware(async (auth, req) => {
  // Skip dev auth for the dev-auth API endpoint
  if (req.nextUrl.pathname === '/api/dev-auth') {
    return NextResponse.next();
  }

  // Development password check - FIRST PRIORITY
  if (!checkDevAuth(req)) {
    return createDevLoginPage();
  }

  // Apply rate limiting to API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    // Get client IP safely
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') ?? '127.0.0.1'
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
    try {
      const authResult = await auth();
      if (!authResult.userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    } catch (error) {
      // Handle auth error gracefully
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  return NextResponse.next();
})

// Export config from Clerk
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
