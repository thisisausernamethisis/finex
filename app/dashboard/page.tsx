'use client';

import { useDashboardMetrics } from '@/lib/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowProgress } from '@/components/workflow/WorkflowProgress';
import { 
  TrendingUp, 
  Target, 
  Activity, 
  DollarSign,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useDashboardMetrics();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {error?.message || 'Failed to load dashboard data'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const {
    totalAssets = 0,
    totalScenarios = 0,
    matrixCoverage = 0,
    portfolioValue = 0,
    topPerformers = [],
    recentScenarios = [],
  } = metrics || {};
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Strategic Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your portfolio and scenario analysis workflow
          </p>
        </div>
        
        {/* Workflow Progress */}
        <WorkflowProgress className="mb-6" />
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                Assets in portfolio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScenarios}</div>
              <p className="text-xs text-muted-foreground">
                Active scenarios
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matrix Coverage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matrixCoverage}</div>
              <p className="text-xs text-muted-foreground">
                Impact relationships
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioValue > 0 ? `$${portfolioValue.toLocaleString()}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total growth value
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((performer) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <span className="font-medium">{performer.name}</span>
                      <div className="flex items-center gap-1">
                        {performer.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          performer.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {performer.change >= 0 ? '+' : ''}{performer.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No performance data available
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentScenarios.length > 0 ? (
                <div className="space-y-3">
                  {recentScenarios.map((scenario) => (
                    <div key={scenario.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{scenario.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {scenario.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(scenario.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No recent scenarios
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Add Asset</p>
                <p className="text-xs text-muted-foreground">Expand your portfolio</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Create Scenario</p>
                <p className="text-xs text-muted-foreground">Analyze new possibilities</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">View Matrix</p>
                <p className="text-xs text-muted-foreground">See impact relationships</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 