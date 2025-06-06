import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't need authentication
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhooks',
    '/api/health'
  ]
  
  // Skip authentication for public paths and static files
  if (publicPaths.some(path => pathname.startsWith(path)) || 
      pathname.includes('.') || 
      pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  // For protected routes, check for Clerk session token
  const sessionToken = request.cookies.get('__session')
  const clerkToken = request.cookies.get('__clerk_jwt')
  
  // If no authentication tokens, redirect to sign-in
  if (!sessionToken && !clerkToken) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}