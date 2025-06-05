import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/_next(.*)',
  '/favicon.ico',
  '/api/public(.*)'
]);

// Clean Clerk-only middleware with error handling
export default clerkMiddleware(async (auth, req) => {
  try {
    // Skip protection for public routes
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // For all other routes, protect them
    await auth.protect();
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If there's an error and it's not a public route, redirect to sign-in
    if (!isPublicRoute(req)) {
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    return NextResponse.next();
  }
});

// Export config with better matcher
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
