'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Pause,
  Play,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface ProcessingJob {
  id: string;
  type: 'matrix_calculation' | 'insight_generation' | 'portfolio_analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  assetId?: string;
  scenarioId?: string;
  assetName?: string;
  scenarioName?: string;
  startedAt: string;
  estimatedCompletion?: string;
  error?: string;
  resultId?: string;
}

interface MatrixProcessingStatusProps {
  jobs?: ProcessingJob[];
  onPauseJob?: (jobId: string) => void;
  onResumeJob?: (jobId: string) => void;
  onCancelJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

const mockJobs: ProcessingJob[] = [
  {
    id: '1',
    type: 'matrix_calculation',
    status: 'processing',
    progress: 65,
    assetId: 'asset-1',
    scenarioId: 'scenario-1',
    assetName: 'NVIDIA Corporation',
    scenarioName: 'AI Regulation Tightening',
    startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    estimatedCompletion: new Date(Date.now() + 1 * 60 * 1000).toISOString() // 1 min from now
  },
  {
    id: '2',
    type: 'matrix_calculation',
    status: 'pending',
    progress: 0,
    assetId: 'asset-2',
    scenarioId: 'scenario-1',
    assetName: 'Tesla Inc',
    scenarioName: 'AI Regulation Tightening',
    startedAt: new Date().toISOString()
  },
  {
    id: '3',
    type: 'insight_generation',
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    resultId: 'insight-result-1'
  },
  {
    id: '4',
    type: 'matrix_calculation',
    status: 'failed',
    progress: 45,
    assetId: 'asset-3',
    scenarioId: 'scenario-2',
    assetName: 'Apple Inc',
    scenarioName: 'Supply Chain Disruption',
    startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    error: 'API rate limit exceeded'
  }
];

export function MatrixProcessingStatus({ 
  jobs = mockJobs,
  onPauseJob,
  onResumeJob,
  onCancelJob,
  onRetryJob,
  isVisible = true,
  onClose
}: MatrixProcessingStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'matrix_calculation': return <BarChart3 className="h-4 w-4" />;
      case 'insight_generation': return <Brain className="h-4 w-4" />;
      case 'portfolio_analysis': return <Zap className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJobType = (type: string) => {
    switch (type) {
      case 'matrix_calculation': return 'Matrix Analysis';
      case 'insight_generation': return 'AI Insights';
      case 'portfolio_analysis': return 'Portfolio Analysis';
      default: return type;
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const duration = currentTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatETA = (estimatedCompletion?: string) => {
    if (!estimatedCompletion) return null;
    
    const eta = new Date(estimatedCompletion);
    const remaining = eta.getTime() - currentTime.getTime();
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);

    if (remaining <= 0) return 'Completing...';
    if (minutes > 0) return `~${minutes}m ${seconds % 60}s remaining`;
    return `~${seconds}s remaining`;
  };

  const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  if (!isVisible || jobs.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[70vh] overflow-hidden shadow-lg border-primary z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Processing Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {activeJobs.length} active
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{activeJobs.length}</div>
            <div className="text-xs text-blue-600">Active</div>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">{completedJobs.length}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-700">{failedJobs.length}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
        </div>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Active Jobs
            </h4>
            {activeJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getJobIcon(job.type)}
                    <span className="font-medium text-sm">{formatJobType(job.type)}</span>
                    <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                      {job.status}
                    </Badge>
                  </div>
                  {getStatusIcon(job.status)}
                </div>

                {(job.assetName || job.scenarioName) && (
                  <div className="text-xs text-muted-foreground">
                    {job.assetName} × {job.scenarioName}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{job.progress}% complete</span>
                    <span>{formatDuration(job.startedAt)}</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                  {job.estimatedCompletion && (
                    <div className="text-xs text-muted-foreground">
                      {formatETA(job.estimatedCompletion)}
                    </div>
                  )}
                </div>

                {/* Job Actions */}
                <div className="flex gap-1">
                  {job.status === 'processing' && onPauseJob && (
                    <Button size="sm" variant="outline" onClick={() => onPauseJob(job.id)}>
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                  {job.status === 'paused' && onResumeJob && (
                    <Button size="sm" variant="outline" onClick={() => onResumeJob(job.id)}>
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  {onCancelJob && (
                    <Button size="sm" variant="outline" onClick={() => onCancelJob(job.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Completed Jobs */}
        {completedJobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Recently Completed
            </h4>
            {completedJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="border rounded-lg p-3 bg-green-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getJobIcon(job.type)}
                    <span className="font-medium text-sm">{formatJobType(job.type)}</span>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      completed
                    </Badge>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>

                {(job.assetName || job.scenarioName) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {job.assetName} × {job.scenarioName}
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-1">
                  Completed {formatDuration(job.startedAt)} ago
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Failed Jobs */}
        {failedJobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Failed Jobs
            </h4>
            {failedJobs.slice(0, 2).map((job) => (
              <div key={job.id} className="border rounded-lg p-3 bg-red-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getJobIcon(job.type)}
                    <span className="font-medium text-sm">{formatJobType(job.type)}</span>
                    <Badge className="text-xs bg-red-100 text-red-800">
                      failed
                    </Badge>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>

                {(job.assetName || job.scenarioName) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {job.assetName} × {job.scenarioName}
                  </div>
                )}

                {job.error && (
                  <div className="text-xs text-red-600 mt-1">
                    Error: {job.error}
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-1">
                  Failed after {formatDuration(job.startedAt)}
                </div>

                {onRetryJob && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => onRetryJob(job.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Overall Progress Summary */}
        {jobs.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground text-center">
              {completedJobs.length} of {jobs.length} jobs completed
            </div>
            <Progress 
              value={(completedJobs.length / jobs.length) * 100} 
              className="h-1 mt-1" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}