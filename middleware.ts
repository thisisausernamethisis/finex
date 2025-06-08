import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { AuthMonitor, AuthEventType } from './lib/monitoring/authMonitor'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
  '/unauthorized',
  '/session-expired'
])

// Define routes that require fresh sessions (sensitive operations)
const isSensitiveRoute = createRouteMatcher([
  '/api/assets/(.*)', // Asset modifications
  '/api/scenarios/(.*)', // Scenario modifications
  '/api/matrix/calculate', // Matrix calculations
  '/api/theme-templates/(.*)' // Template modifications
])

export default clerkMiddleware(async (auth, req) => {
  // Extract request context for logging
  const requestContext = {
    route: req.nextUrl.pathname,
    method: req.method,
    userAgent: req.headers.get('user-agent') || undefined,
    ipAddress: req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
  }

  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  try {
    // Get authentication details
    const { userId, sessionClaims } = await auth()
    
    // Check basic authentication
    if (!userId) {
      // Log unauthorized access attempt
      AuthMonitor.logUnauthorizedAccess(req.nextUrl.pathname, requestContext)
      
      // Redirect to sign-in for pages, return 401 for API routes
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse('Unauthorized', { status: 401 })
      } else {
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Enhanced session validation for sensitive routes
    if (isSensitiveRoute(req) && sessionClaims) {
      const sessionAge = Date.now() - (sessionClaims.iat * 1000)
      const maxSessionAge = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
      
      // Check if session is too old for sensitive operations
      if (sessionAge > maxSessionAge) {
        // Log session expiration
        AuthMonitor.logSessionExpired(userId, {
          ...requestContext,
          metadata: { sessionAge: Math.floor(sessionAge / 1000) }
        })
        
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return new NextResponse('Session expired', { status: 401 })
        } else {
          const sessionExpiredUrl = new URL('/session-expired', req.url)
          return NextResponse.redirect(sessionExpiredUrl)
        }
      }
    }

    // Standard protection for all other protected routes
    await auth.protect()
    
    // Log successful access for monitoring (only for sensitive routes to avoid log spam)
    if (isSensitiveRoute(req)) {
      AuthMonitor.logEvent(AuthEventType.SIGN_IN_SUCCESS, {
        userId,
        ...requestContext
      })
    }
    
    return NextResponse.next()
  } catch (error) {
    // Log authentication errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error'
    AuthMonitor.logMiddlewareError(errorMessage, {
      ...requestContext,
      error: errorMessage
    })
    
    // Handle authentication errors gracefully
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse('Authentication error', { status: 500 })
    } else {
      const unauthorizedUrl = new URL('/unauthorized', req.url)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}