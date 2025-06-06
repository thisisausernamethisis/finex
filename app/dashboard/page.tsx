'use client';

import { useDashboardMetrics } from '@/lib/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowProgress } from '@/components/workflow/WorkflowProgress';
import { PortfolioInsights } from '@/components/insights/PortfolioInsights';
import { 
  TrendingUp, 
  Target, 
  Activity, 
  DollarSign,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Brain,
  Zap
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
            Phase 4: Portfolio insights and strategic recommendations powered by AI analysis
          </p>
        </div>
        
        {/* Workflow Progress */}
        <WorkflowProgress className="mb-6" />
        
        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Strategic Insights
              </h2>
              <p className="text-muted-foreground">
                Discover opportunities, risks, and strategic recommendations based on your matrix analysis
              </p>
            </div>
            <PortfolioInsights />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Performers Expanded */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Asset Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topPerformers.length > 0 ? (
                    <div className="space-y-4">
                      {topPerformers.map((performer) => (
                        <div key={performer.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
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
                          <div className="text-xs text-muted-foreground">
                            Performance across scenario matrix
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

              {/* Scenario Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Scenario Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentScenarios.length > 0 ? (
                    <div className="space-y-4">
                      {recentScenarios.map((scenario) => (
                        <div key={scenario.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{scenario.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {scenario.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(scenario.createdAt), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Impact analysis across portfolio assets
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No scenario analysis available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="text-center p-6">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Add Asset</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Expand your portfolio with new assets for analysis
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Phase 1: Asset Research
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="text-center p-6">
                  <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Create Scenario</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Define new future scenarios to test against your portfolio
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Phase 2: Scenario Planning
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="text-center p-6">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Analyze Matrix</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate new impact analysis for asset-scenario combinations
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Phase 3: Matrix Generation
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="text-center p-6">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">AI Insights</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get AI-powered recommendations and opportunity discovery
                  </p>
                  <Badge className="text-xs bg-purple-100 text-purple-800">
                    <Zap className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="text-center p-6">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Export Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate reports and export your strategic analysis
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="text-center p-6">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2">Portfolio Optimization</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get recommendations for portfolio rebalancing and optimization
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Advanced Feature
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 