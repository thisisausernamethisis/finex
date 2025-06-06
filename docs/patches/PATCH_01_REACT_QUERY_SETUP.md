# Patch 1: React Query Setup

## Overview
Establishes the foundation for modern data management by integrating React Query into the Finex v3 application.

## Dependencies
- None (foundation patch)

## Estimated Effort
2-3 hours

## Risk Level
Low

---

## Changes Required

### 1. Add Dependencies

**File**: `package.json`
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0"
  }
}
```

### 2. Create Query Client Provider

**File**: `app/providers.tsx` (new file)
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408 (timeout)
              if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500 && status !== 408) {
                  return false;
                }
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 3. Update Root Layout

**File**: `app/layout.tsx`
```tsx
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Navigation } from '@/components/Navigation'
import { Providers } from './providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MetaMap - Technology Analysis Platform',
  description: 'AI-powered technology disruption analysis and portfolio insights',
}

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'

// Clerk configuration with fallback for build
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_build_placeholder_for_compatibility'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <body className={inter.className}>
          <Providers>
            <Navigation />
            <main>
              {children}
            </main>
          </Providers>
        </body>
      </ClerkProvider>
    </html>
  )
}
```

---

## Testing

### Manual Testing
1. Run `npm install` to install new dependencies
2. Start development server: `npm run dev`
3. Open browser and verify React Query DevTools appear (floating icon in bottom corner)
4. Open DevTools and confirm no console errors related to React Query

### Verification Checklist
- [ ] React Query DevTools icon appears in development
- [ ] No console errors on page load
- [ ] Application still renders correctly
- [ ] All existing functionality remains intact

---

## Rollback Plan
If issues arise:
1. Revert `package.json` changes
2. Remove `app/providers.tsx`
3. Restore original `app/layout.tsx`
4. Run `npm install` to restore previous state

---

## Notes
- React Query DevTools only appear in development mode
- Query configuration is optimized for the Finex use case (5min stale time, intelligent retry logic)
- This setup provides foundation for all subsequent data management improvements 