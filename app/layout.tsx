import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Navigation } from '@/components/Navigation'
import { Providers } from './providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
      title: 'Finex v3 - Strategic Scenario Analysis Platform',
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
