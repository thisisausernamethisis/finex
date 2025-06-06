import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Validate critical environment variables
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable')
}
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable')
}

// Vercel Edge Runtime compatible middleware using redirects
export default clerkMiddleware((auth, req) => {
  // Public routes that don't need authentication
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up', 
    '/api/webhooks',
    '/api/health',
    '/api/public'
  ]
  
  const { pathname } = req.nextUrl
  
  // Skip authentication for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Skip authentication for static files
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  // For protected routes, redirect to sign-in if not authenticated
  try {
    const authResult = auth()
    // Simple check - if auth() doesn't throw, user is authenticated
    return NextResponse.next()
  } catch (error) {
    // If auth() throws, redirect to sign-in
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

// Optimized config matcher for Edge Runtime
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}