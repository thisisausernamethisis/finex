'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Brain,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Lightbulb
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  title: string;
  content: string;
  source: string;
  relevanceScore: number;
  confidenceScore: number;
  type: 'market_analysis' | 'financial_impact' | 'technical_analysis' | 'risk_assessment' | 'strategic_insight';
}

interface AnalysisReasoning {
  positiveFactors: string[];
  negativeFactors: string[];
  uncertainties: string[];
  keyAssumptions: string[];
}

interface ConfidenceBreakdown {
  dataQuality: number;
  evidenceStrength: number;
  analysisConsistency: number;
  sourceCredibility: number;
}

interface MatrixAnalysisDetailProps {
  assetName: string;
  scenarioName: string;
  impactScore: number;
  confidenceLevel: number;
  reasoning?: string;
  evidence?: EvidenceItem[];
  analysisReasoning?: AnalysisReasoning;
  confidenceBreakdown?: ConfidenceBreakdown;
  generatedAt?: string;
  processingTime?: number;
}

export function MatrixAnalysisDetail({
  assetName,
  scenarioName,
  impactScore,
  confidenceLevel,
  reasoning,
  evidence = [],
  analysisReasoning,
  confidenceBreakdown,
  generatedAt,
  processingTime
}: MatrixAnalysisDetailProps) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (impact < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getImpactColor = (impact: number) => {
    if (impact > 3) return 'text-green-700 bg-green-100 border-green-300';
    if (impact > 1) return 'text-green-600 bg-green-50 border-green-200';
    if (impact > 0) return 'text-green-500 bg-green-25 border-green-100';
    if (impact === 0) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (impact > -1) return 'text-red-500 bg-red-25 border-red-100';
    if (impact > -3) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getEvidenceTypeColor = (type: string) => {
    switch (type) {
      case 'market_analysis': return 'bg-blue-100 text-blue-800';
      case 'financial_impact': return 'bg-green-100 text-green-800';
      case 'technical_analysis': return 'bg-purple-100 text-purple-800';
      case 'risk_assessment': return 'bg-red-100 text-red-800';
      case 'strategic_insight': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEvidenceType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const selectedEvidence = evidence.find(e => e.id === selectedEvidenceId);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getImpactIcon(impactScore)}
          <div>
            <h3 className="text-lg font-semibold">Impact Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {assetName} × {scenarioName}
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg border text-lg font-bold ${getImpactColor(impactScore)}`}>
          {impactScore > 0 ? '+' : ''}{impactScore}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Impact Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{impactScore}</div>
                <p className="text-xs text-muted-foreground">-5 to +5 scale</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(confidenceLevel * 100)}%</div>
                <p className="text-xs text-muted-foreground">AI certainty</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{evidence.length}</div>
                <p className="text-xs text-muted-foreground">data points</p>
              </CardContent>
            </Card>
          </div>

          {reasoning && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{reasoning}</p>
              </CardContent>
            </Card>
          )}

          {/* Meta Information */}
          {(generatedAt || processingTime) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Analysis Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {generatedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Generated:</span>
                    <span>{new Date(generatedAt).toLocaleString()}</span>
                  </div>
                )}
                {processingTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing time:</span>
                    <span>{processingTime}ms</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          {evidence.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {evidence.map((item) => (
                <Card 
                  key={item.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedEvidenceId === item.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedEvidenceId(item.id === selectedEvidenceId ? null : item.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getEvidenceTypeColor(item.type)}`}>
                          {formatEvidenceType(item.type)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(item.relevanceScore * 100)}% relevant
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Source: {item.source}</span>
                      <span>Confidence: {Math.round(item.confidenceScore * 100)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No evidence data available</p>
              </CardContent>
            </Card>
          )}

          {/* Evidence Detail Panel */}
          {selectedEvidence && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Evidence Detail</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedEvidenceId(null)}
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">{selectedEvidence.title}</h4>
                  <p className="text-sm leading-relaxed">{selectedEvidence.content}</p>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Source: {selectedEvidence.source}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {Math.round(selectedEvidence.relevanceScore * 100)}% relevant
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(selectedEvidence.confidenceScore * 100)}% confident
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reasoning Tab */}
        <TabsContent value="reasoning" className="space-y-4">
          {analysisReasoning ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-4 w-4" />
                    Positive Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisReasoning.positiveFactors.map((factor, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
                    <TrendingDown className="h-4 w-4" />
                    Negative Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisReasoning.negativeFactors.map((factor, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-4 w-4" />
                    Uncertainties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisReasoning.uncertainties.map((uncertainty, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                        {uncertainty}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                    <Lightbulb className="h-4 w-4" />
                    Key Assumptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisReasoning.keyAssumptions.map((assumption, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Detailed reasoning not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Confidence Tab */}
        <TabsContent value="confidence" className="space-y-4">
          {confidenceBreakdown ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Confidence Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(confidenceBreakdown).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span className="font-medium">{Math.round(value * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Confidence Interpretation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {confidenceLevel >= 0.8 && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        High confidence - analysis is well-supported by evidence
                      </div>
                    )}
                    {confidenceLevel >= 0.6 && confidenceLevel < 0.8 && (
                      <div className="flex items-center gap-2 text-orange-700">
                        <AlertCircle className="h-4 w-4" />
                        Medium confidence - some uncertainty in the analysis
                      </div>
                    )}
                    {confidenceLevel < 0.6 && (
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        Low confidence - significant uncertainty, gather more evidence
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Confidence breakdown not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}