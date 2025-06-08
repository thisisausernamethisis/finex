import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { MatrixCalculation } from '@/lib/hooks/matrix';

interface MatrixStrategicInsightsProps {
  calculations: MatrixCalculation[];
  isLoading?: boolean;
}

export function MatrixStrategicInsights({ calculations, isLoading }: MatrixStrategicInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="animate-pulse bg-muted rounded h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!calculations.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No matrix data available for insights</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate insights directly from displayed matrix data
  const assetResilienceMap = new Map<string, { name: string; impacts: number[] }>();
  const scenarioRiskMap = new Map<string, { name: string; impacts: number[]; type: string }>();

  calculations.forEach(calc => {
    // Aggregate asset data
    if (!assetResilienceMap.has(calc.assetId)) {
      assetResilienceMap.set(calc.assetId, {
        name: calc.assetName,
        impacts: []
      });
    }
    assetResilienceMap.get(calc.assetId)!.impacts.push(calc.impact);

    // Aggregate scenario data
    if (!scenarioRiskMap.has(calc.scenarioId)) {
      scenarioRiskMap.set(calc.scenarioId, {
        name: calc.scenarioName,
        impacts: [],
        type: calc.scenarioType
      });
    }
    scenarioRiskMap.get(calc.scenarioId)!.impacts.push(calc.impact);
  });

  // Calculate top resilient assets (highest average impact)
  const topResilientAssets = Array.from(assetResilienceMap.values())
    .map(asset => ({
      ...asset,
      avgImpact: asset.impacts.reduce((sum, impact) => sum + impact, 0) / asset.impacts.length
    }))
    .sort((a, b) => b.avgImpact - a.avgImpact)
    .slice(0, 3);

  // Calculate biggest risk scenarios (lowest average impact)
  const biggestRiskScenarios = Array.from(scenarioRiskMap.values())
    .map(scenario => ({
      ...scenario,
      avgImpact: scenario.impacts.reduce((sum, impact) => sum + impact, 0) / scenario.impacts.length
    }))
    .sort((a, b) => a.avgImpact - b.avgImpact)
    .slice(0, 3);

  // Calculate portfolio averages
  const portfolioAvgImpact = calculations.reduce((sum, calc) => sum + calc.impact, 0) / calculations.length;
  const positiveImpacts = calculations.filter(calc => calc.impact > 0).length;
  const negativeImpacts = calculations.filter(calc => calc.impact < 0).length;
  const neutralImpacts = calculations.filter(calc => calc.impact === 0).length;

  return (
    <div className="space-y-4">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Matrix Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Portfolio Impact</span>
            <span className={`font-bold ${
              portfolioAvgImpact > 0 ? 'text-green-600' : 
              portfolioAvgImpact < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {portfolioAvgImpact > 0 ? '+' : ''}{portfolioAvgImpact.toFixed(1)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">{positiveImpacts}</div>
              <div className="text-muted-foreground">Positive</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-600">{neutralImpacts}</div>
              <div className="text-muted-foreground">Neutral</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">{negativeImpacts}</div>
              <div className="text-muted-foreground">Negative</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Resilient Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Most Resilient Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topResilientAssets.map((asset, index) => (
              <div key={asset.name} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">{asset.name}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    asset.avgImpact > 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {asset.avgImpact > 0 ? '+' : ''}{asset.avgImpact.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biggest Risk Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Biggest Risk Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {biggestRiskScenarios.map((scenario, index) => (
              <div key={scenario.name} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">{scenario.name}</span>
                  <div className="text-xs text-muted-foreground">{scenario.type}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    scenario.avgImpact < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {scenario.avgImpact.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Risk #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {topResilientAssets.length > 0 && (
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <span className="font-medium text-green-800">
                  Top Performer:
                </span>
                <span className="text-green-700 ml-1">
                  {topResilientAssets[0].name} shows strong resilience ({topResilientAssets[0].avgImpact > 0 ? '+' : ''}{topResilientAssets[0].avgImpact.toFixed(1)} avg)
                </span>
              </div>
            )}
            
            {biggestRiskScenarios.length > 0 && (
              <div className="p-2 bg-red-50 rounded border border-red-200">
                <span className="font-medium text-red-800">
                  Top Risk:
                </span>
                <span className="text-red-700 ml-1">
                  {biggestRiskScenarios[0].name} poses significant portfolio risk ({biggestRiskScenarios[0].avgImpact.toFixed(1)} avg)
                </span>
              </div>
            )}

            {portfolioAvgImpact > 0 ? (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <span className="font-medium text-blue-800">Portfolio Health:</span>
                <span className="text-blue-700 ml-1">
                  Overall positive outlook with {((positiveImpacts / calculations.length) * 100).toFixed(0)}% positive scenarios
                </span>
              </div>
            ) : (
              <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                <span className="font-medium text-yellow-800">Portfolio Alert:</span>
                <span className="text-yellow-700 ml-1">
                  Consider risk mitigation with {((negativeImpacts / calculations.length) * 100).toFixed(0)}% negative scenarios
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 