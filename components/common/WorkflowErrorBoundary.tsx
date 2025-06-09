'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorkflowErrorBoundaryProps {
  children: React.ReactNode;
  phase: 1 | 2 | 3 | 4;
  phaseLabel: string;
  onRetry?: () => void;
}

export function WorkflowErrorBoundary({ 
  children, 
  phase, 
  phaseLabel, 
  onRetry 
}: WorkflowErrorBoundaryProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (phase > 1) {
      // Go to previous phase
      const previousPhases = ['/assets', '/scenarios', '/matrix', '/dashboard'];
      router.push(previousPhases[phase - 2]);
    } else {
      // Go to dashboard
      router.push('/');
    }
  };

  const WorkflowErrorFallback = (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 mx-auto mb-3 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">Phase {phase} Error</CardTitle>
          <p className="text-sm text-muted-foreground">
            An error occurred in {phaseLabel}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">
              Unable to load {phaseLabel.toLowerCase()}. This might be due to a temporary issue or missing data.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onRetry || (() => window.location.reload())} 
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={handleGoBack}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If this problem persists, try refreshing the page or contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={WorkflowErrorFallback}
      context={`Phase ${phase}: ${phaseLabel}`}
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Log workflow-specific error information
        console.error(`Workflow Phase ${phase} Error:`, {
          phase,
          phaseLabel,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}