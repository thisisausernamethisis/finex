import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Brain,
  PieChart,
  Activity
} from 'lucide-react';

interface InsightData {
  type: 'OPPORTUNITY' | 'RISK' | 'RECOMMENDATION' | 'OBSERVATION';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  actionable: boolean;
  metadata?: {
    assetId?: string;
    scenarioId?: string;
    confidence?: number;
  };
}

interface MatrixInsightsProps {
  insights?: {
    portfolioSummary: {
      totalAssets: number;
      categorizedAssets: number;
      averageImpact: number;
      riskDistribution: Record<string, number>;
    };
    technologyExposure: Array<{
      category: string;
      assetCount: number;
      averageImpact: number;
      riskLevel: string;
    }>;
    insights: InsightData[];
    concentrationRisks: Array<{
      type: string;
      description: string;
      severity: string;
      affectedAssets: number;
    }>;
  };
  isLoading: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

export function MatrixInsights({ insights, isLoading }: MatrixInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!insights) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No insights available</p>
        </CardContent>
      </Card>
    );
  }
  
  const { portfolioSummary, technologyExposure, insights: aiInsights, concentrationRisks } = insights;
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return TrendingUp;
      case 'RISK': return AlertTriangle;
      case 'RECOMMENDATION': return Lightbulb;
      default: return Target;
    }
  };
  
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return 'text-green-600 bg-green-50 border-green-200';
      case 'RISK': return 'text-red-600 bg-red-50 border-red-200';
      case 'RECOMMENDATION': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'HIGH': return <Badge variant="destructive">High Impact</Badge>;
      case 'MEDIUM': return <Badge variant="secondary">Medium Impact</Badge>;
      case 'LOW': return <Badge variant="outline">Low Impact</Badge>;
      default: return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Coverage</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((portfolioSummary.categorizedAssets / portfolioSummary.totalAssets) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.categorizedAssets} of {portfolioSummary.totalAssets} assets analyzed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Impact</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              portfolioSummary.averageImpact > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioSummary.averageImpact > 0 ? '+' : ''}{portfolioSummary.averageImpact.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Portfolio-wide average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Assets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {portfolioSummary.riskDistribution.HIGH || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground">Generated insights</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Technology Exposure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Technology Exposure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technologyExposure.map((exposure, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{exposure.category.replace(/_/g, ' ')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {exposure.assetCount} assets • Avg impact: {exposure.averageImpact.toFixed(1)}
                  </p>
                </div>
                <Badge variant={
                  exposure.riskLevel === 'HIGH' ? 'destructive' :
                  exposure.riskLevel === 'MEDIUM' ? 'secondary' : 'outline'
                }>
                  {exposure.riskLevel}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* AI-Generated Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium line-clamp-1">{insight.title}</h4>
                        {getImpactBadge(insight.impact)}
                      </div>
                      <p className="text-sm leading-relaxed">{insight.description}</p>
                      
                      {insight.metadata?.confidence && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Confidence: {Math.round(insight.metadata.confidence * 100)}%
                          </span>
                          {insight.actionable && (
                            <Badge variant="outline" className="text-xs">
                              Actionable
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {aiInsights.length === 0 && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No insights generated yet. Add more assets and scenarios for AI analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Concentration Risks */}
      {concentrationRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Concentration Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {concentrationRisks.map((risk, index) => (
                <Alert key={index} className={
                  risk.severity === 'HIGH' ? 'border-red-200 bg-red-50' :
                  risk.severity === 'MEDIUM' ? 'border-amber-200 bg-amber-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{risk.type}</span>
                        <p className="text-sm mt-1">{risk.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          risk.severity === 'HIGH' ? 'destructive' :
                          risk.severity === 'MEDIUM' ? 'secondary' : 'outline'
                        }>
                          {risk.severity}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {risk.affectedAssets} assets
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 