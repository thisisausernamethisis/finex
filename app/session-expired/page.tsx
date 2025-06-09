'use client'

import Link from 'next/link'
import { RefreshCw, Clock, Shield } from 'lucide-react'

export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center">
          {/* Session Icon */}
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          
          {/* Error Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Session Expired
          </h1>
          <p className="text-muted-foreground mb-8">
            Your session has expired for security reasons. Please sign in again to continue using the application.
          </p>
          
          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/sign-in"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Sign In Again</span>
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </button>
          </div>
          
          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-1" />
              Sessions expire automatically for your security
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 