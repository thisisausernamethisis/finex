import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Edge Runtime-safe base64 decode
function base64Decode(str: string): string {
  try {
    // Use Buffer if available (Node.js), otherwise manual decode
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64').toString('utf-8')
    }
    // Manual base64 decode for Edge Runtime
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return ''
  }
}

// Simple HTTP Basic Auth
function checkBasicAuth(request: NextRequest): Response | null {
  const auth = request.headers.get('authorization')
  
  if (!auth || !auth.startsWith('Basic ')) {
    return new Response('Development Environment - Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Development Access"',
        'Content-Type': 'text/html'
      }
    })
  }

  try {
    const credentials = auth.slice('Basic '.length)
    const decoded = base64Decode(credentials)
    const [username, password] = decoded.split(':')

    if (username !== 'admin' || password !== 'wombat81') {
      return new Response('Invalid Credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Development Access"'
        }
      })
    }

    return null; // Auth successful
  } catch (error) {
    console.error('Basic auth error:', error)
    return new Response('Authentication Error', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Development Access"'
      }
    })
  }
}

// Development password lock (keeping as backup)
const DEV_USERNAME = 'admin'
const DEV_PASSWORD = 'wombat81'

function checkDevAuth(req: NextRequest) {
  const devAuth = req.cookies.get('dev-auth')?.value
  return devAuth === 'authenticated'
}

function createDevLoginPage() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Development Access</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .login-box { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
        input { display: block; width: 100%; margin: 0.75rem 0; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
        button { background: #1860e2; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-size: 16px; font-weight: 600; }
        button:hover { background: #1550c2; }
        h2 { text-align: center; color: #333; margin-bottom: 1.5rem; }
        .error { color: #dc2626; text-align: center; margin: 0.75rem 0; background: #fef2f2; padding: 0.5rem; border-radius: 4px; }
        .subtitle { text-align: center; color: #666; font-size: 0.9rem; margin-top: 1.5rem; }
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
        <p class="subtitle">Development environment - authorized access only</p>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
    status: 200
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

// Simple Clerk middleware - back to working state
const clerkHandler = clerkMiddleware(async (auth, req) => {
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
});

// Main middleware function - BACK TO WORKING STATE
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  return clerkHandler(req, event);
}

// Export config
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
