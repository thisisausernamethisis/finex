import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Navigation } from '@/components/Navigation'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MetaMap - Technology Analysis Platform',
  description: 'AI-powered technology disruption analysis and portfolio insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body className={inter.className}>
          <Navigation />
          <main>
            {children}
          </main>
        </body>
      </ClerkProvider>
    </html>
  )
}
