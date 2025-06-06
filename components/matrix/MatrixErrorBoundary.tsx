import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MatrixErrorBoundaryProps {
  children?: ReactNode;
  error?: any;
  onRetry?: () => void;
}

export function MatrixErrorBoundary({ children, error, onRetry }: MatrixErrorBoundaryProps) {
  // If there's an error passed in, show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Failed to load matrix data</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || 'An unexpected error occurred while loading the matrix.'}
            </p>
            {onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If no error, just render children
  return <>{children}</>;
} 