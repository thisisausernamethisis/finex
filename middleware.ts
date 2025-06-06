import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal test middleware - no Clerk, no env validation
export function middleware(request: NextRequest) {
  console.log('Middleware executing for:', request.nextUrl.pathname)
  
  // Just pass through everything for now
  return NextResponse.next()
}

// Simple config matcher
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}