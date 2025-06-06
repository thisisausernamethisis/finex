'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Zap,
  Eye,
  ChevronRight
} from 'lucide-react';

interface InsightItem {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  relatedAssets?: string[];
  relatedScenarios?: string[];
  actionable: boolean;
}

interface PortfolioInsightsProps {
  insights?: InsightItem[];
  isLoading?: boolean;
}

const mockInsights: InsightItem[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'AI Compute Cluster Resilience',
    description: 'AI compute assets show remarkable resilience across regulatory scenarios, maintaining positive impact scores in 85% of tested futures.',
    confidence: 0.87,
    impact: 'high',
    category: 'Portfolio Resilience',
    relatedAssets: ['NVIDIA', 'AMD', 'Intel'],
    relatedScenarios: ['AI Regulation', 'Chip Act', 'Trade War'],
    actionable: true
  },
  {
    id: '2',
    type: 'risk',
    title: 'Geographic Concentration Risk',
    description: 'Portfolio shows high exposure to Taiwan-dependent supply chains. 60% of assets vulnerable to Taiwan-China conflict scenarios.',
    confidence: 0.92,
    impact: 'high',
    category: 'Geographic Risk',
    relatedAssets: ['TSMC', 'NVIDIA', 'Apple'],
    relatedScenarios: ['Taiwan Conflict', 'Supply Chain Disruption'],
    actionable: true
  },
  {
    id: '3',
    type: 'trend',
    title: 'Quantum Computing Emergence',
    description: 'Quantum computing scenarios showing accelerating positive impact across the matrix. Early positioning window may be closing.',
    confidence: 0.73,
    impact: 'medium',
    category: 'Emerging Technology',
    relatedAssets: ['IBM', 'Google', 'IonQ'],
    relatedScenarios: ['Quantum Breakthrough', 'Quantum Cryptography'],
    actionable: true
  },
  {
    id: '4',
    type: 'anomaly',
    title: 'Energy Sector Outlier Performance',
    description: 'Traditional energy assets unexpectedly outperforming in AI-heavy scenarios. Possible data quality issue or genuine trend.',
    confidence: 0.65,
    impact: 'medium',
    category: 'Data Quality',
    relatedAssets: ['ExxonMobil', 'Chevron'],
    relatedScenarios: ['AI Data Center Boom', 'Energy Demand Spike'],
    actionable: false
  },
  {
    id: '5',
    type: 'recommendation',
    title: 'Defensive Positioning Opportunity',
    description: 'Consider increasing allocation to utilities and healthcare assets which show strong defensive characteristics across scenarios.',
    confidence: 0.81,
    impact: 'medium',
    category: 'Strategic Allocation',
    relatedAssets: ['Johnson & Johnson', 'NextEra Energy'],
    relatedScenarios: ['Economic Recession', 'Market Volatility'],
    actionable: true
  }
];

export function PortfolioInsights({ insights = mockInsights, isLoading = false }: PortfolioInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'anomaly': return <Eye className="h-4 w-4 text-orange-600" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-purple-600" />;
      default: return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-l-green-500 bg-green-50';
      case 'risk': return 'border-l-red-500 bg-red-50';
      case 'trend': return 'border-l-blue-500 bg-blue-50';
      case 'anomaly': return 'border-l-orange-500 bg-orange-50';
      case 'recommendation': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    const type = insight.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(insight);
    return acc;
  }, {} as Record<string, InsightItem[]>);

  const insightSummary = {
    opportunities: groupedInsights.opportunity?.length || 0,
    risks: groupedInsights.risk?.length || 0,
    trends: groupedInsights.trend?.length || 0,
    recommendations: groupedInsights.recommendation?.length || 0,
    avgConfidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Portfolio Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Portfolio Insights
            <Badge variant="outline" className="ml-auto">
              {Math.round(insightSummary.avgConfidence * 100)}% avg confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{insightSummary.opportunities}</div>
              <div className="text-sm text-green-600">Opportunities</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{insightSummary.risks}</div>
              <div className="text-sm text-red-600">Risks</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{insightSummary.trends}</div>
              <div className="text-sm text-blue-600">Trends</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{insightSummary.recommendations}</div>
              <div className="text-sm text-purple-600">Actions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({insights.length})</TabsTrigger>
          <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
          <TabsTrigger value="risk">Risks</TabsTrigger>
          <TabsTrigger value="trend">Trends</TabsTrigger>
          <TabsTrigger value="recommendation">Actions</TabsTrigger>
          <TabsTrigger value="anomaly">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-3">
            {insights.map((insight) => (
              <Card 
                key={insight.id}
                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getInsightColor(insight.type)} ${
                  selectedInsight?.id === insight.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedInsight(insight)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getInsightIcon(insight.type)}
                        <span className="font-semibold">{insight.title}</span>
                        <Badge variant="outline" className={getImpactBadge(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="secondary">
                          {Math.round(insight.confidence * 100)}% confident
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            <Zap className="h-3 w-3 mr-1" />
                            Actionable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Category: {insight.category}</span>
                        {insight.relatedAssets && (
                          <span>Assets: {insight.relatedAssets.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Individual Type Tabs */}
        {Object.entries(groupedInsights).map(([type, typeInsights]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="space-y-3">
              {typeInsights.map((insight) => (
                <Card 
                  key={insight.id}
                  className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getInsightColor(insight.type)}`}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getInsightIcon(insight.type)}
                          <span className="font-semibold">{insight.title}</span>
                          <Badge variant="outline" className={getImpactBadge(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round(insight.confidence * 100)}% confident
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Insight Detail Panel */}
      {selectedInsight && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getInsightIcon(selectedInsight.type)}
                {selectedInsight.title}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedInsight(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{selectedInsight.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Analysis Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span>{Math.round(selectedInsight.confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impact Level:</span>
                    <span className="capitalize">{selectedInsight.impact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{selectedInsight.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actionable:</span>
                    <span>{selectedInsight.actionable ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Related Elements</h4>
                <div className="space-y-2">
                  {selectedInsight.relatedAssets && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Assets:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedInsight.relatedAssets.map((asset) => (
                          <Badge key={asset} variant="outline" className="text-xs">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedInsight.relatedScenarios && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Scenarios:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedInsight.relatedScenarios.map((scenario) => (
                          <Badge key={scenario} variant="outline" className="text-xs">
                            {scenario}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedInsight.actionable && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Suggested Actions
                </h4>
                <div className="flex gap-2">
                  <Button size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Investigate Further
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Run Scenarios
                  </Button>
                  <Button size="sm" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Adjust Position
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}