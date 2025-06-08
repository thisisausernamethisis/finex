import Link from 'next/link'
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          {/* Error Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access this resource. Please sign in with an authorized account or contact your administrator.
          </p>
          
          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/sign-in"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            
            <Link
              href="/"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
          
          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Need help? Contact support or check your account permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 