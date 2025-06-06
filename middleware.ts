import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Validate critical environment variables
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable')
}
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable')
}

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/assets(.*)',
  '/scenarios(.*)',
  '/matrix(.*)',
  '/insights(.*)',
  '/templates(.*)',
  '/api/(?!webhooks|health|public)(.*)'
]);

// Latest Clerk middleware pattern for Edge Runtime
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      throw new Error('Unauthorized');
    }
  }
});

// Standard config matcher for Edge Runtime
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}