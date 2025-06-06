import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AssetsErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

export function AssetsErrorBoundary({ error, retry }: AssetsErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Failed to load assets
        </h3>
        <p className="text-muted-foreground max-w-md">
          {error.message || 'An unexpected error occurred while loading your assets.'}
        </p>
      </div>
      <Button onClick={retry} variant="outline" className="flex items-center space-x-2">
        <RefreshCw className="h-4 w-4" />
        <span>Try Again</span>
      </Button>
    </div>
  );
} 