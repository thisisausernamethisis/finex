# PATCH FE-16: Core Strategic Dashboard - Simplified Design

**Priority**: HIGH  
**Effort**: 2 days (simplified scope)  
**Dependencies**: PATCH FE-15 (Guided Workflow) ✅ COMPLETE  
**Focus**: Core ground truth deliverables with maximum usability

---

## 🎯 **Core Objective**

Transform the current dashboard into a simple, intuitive "low resolution map of the future" that delivers the 4 essential strategic insights from the ground truth:

1. **Asset Resilience**: Which assets perform well across scenarios
2. **Scenario Risk**: Which scenarios pose the biggest portfolio risks  
3. **Opportunity Discovery**: TAM/Impact ratios for growth opportunities
4. **Strategic Recommendations**: Simple, actionable next steps

---

## 📋 **Ground Truth Core Deliverables**

### **"Low Resolution Map of the Future"**
- Simple matrix visualization showing asset × scenario impacts
- Clear visual indicators for positive/negative impacts
- Easy identification of patterns and outliers

### **Growth/Risk Discovery Engine**  
- `TAM / Net Impact Score` ratio analysis
- Identify undervalued assets with high scenario resilience
- Highlight "cheap growth sources"

### **Strategic Pattern Recognition**
- Assets with consistent positive performance across scenarios
- Scenarios that pose concentrated risk to portfolio
- Simple portfolio optimization suggestions

---

## 🎨 **Simplified Dashboard Design**

### **Layout: 3 Core Sections**
```
┌─────────────────────────────────────────────────────┐
│ Strategic Dashboard                                  │
├─────────────────────────────────────────────────────┤
│ Workflow Progress (from PATCH FE-15)                │
├─────────────────────────────────────────────────────┤
│ 1. LOW RESOLUTION MAP (Full Width)                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Asset × Scenario Heatmap                        │ │
│ │ Simple color coding: Red/Yellow/Green           │ │
│ │ Click for details, hover for quick info         │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 2. STRATEGIC INSIGHTS (2 columns)                   │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ Top Resilient Assets│ │ Biggest Risk Scenarios  │ │
│ │ • NVDA (8.2/10)     │ │ • China Conflict (-45%) │ │
│ │ • MSFT (7.8/10)     │ │ • Tech Regulation (-12%)│ │
│ │ • GOOG (7.1/10)     │ │ • Recession (-8%)       │ │
│ └─────────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 3. GROWTH OPPORTUNITIES (3 columns)                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │
│ │Best TAM/Risk│ │Strategic Rec│ │Next Actions     │ │
│ │• AI Infra   │ │• Reduce NVDA│ │• Rebalance 15%  │ │
│ │• Defense    │ │• Add Defense│ │• Add hedge      │ │
│ │• Healthcare │ │• Hedge China│ │• Review monthly │ │
│ └─────────────┘ └─────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ **Core Implementation**

### **1. Simple Matrix Heatmap** (`components/dashboard/SimpleHeatmap.tsx`)
```typescript
interface SimpleHeatmapData {
  assets: Array<{
    id: string;
    name: string;
    avgImpact: number; // -5 to +5
    resilienceScore: number; // 0-10 for simplicity
  }>;
  scenarios: Array<{
    id: string;
    name: string;
    portfolioRisk: number; // 0-100% portfolio impact
    probability: number;
  }>;
  cells: Array<{
    assetId: string;
    scenarioId: string;
    impact: number; // -5 to +5
  }>;
}

// Simple 3-color system
const getImpactColor = (impact: number) => {
  if (impact >= 1) return '#10B981'; // Green (positive)
  if (impact <= -1) return '#EF4444'; // Red (negative)  
  return '#F59E0B'; // Yellow (neutral)
};

export function SimpleHeatmap({ data }: { data: SimpleHeatmapData }) {
  return (
    <div className="w-full bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Low Resolution Map of the Future</h3>
      
      {/* Simple CSS Grid Heatmap */}
      <div className="grid gap-1" style={{
        gridTemplateColumns: `150px repeat(${data.scenarios.length}, 1fr)`
      }}>
        {/* Header row */}
        <div></div>
        {data.scenarios.map(scenario => (
          <div key={scenario.id} className="text-xs p-2 text-center font-medium">
            {scenario.name}
          </div>
        ))}
        
        {/* Asset rows */}
        {data.assets.map(asset => (
          <>
            <div key={asset.id} className="text-sm p-2 font-medium bg-gray-50">
              {asset.name}
              <div className="text-xs text-gray-500">
                Resilience: {asset.resilienceScore}/10
              </div>
            </div>
            {data.scenarios.map(scenario => {
              const cell = data.cells.find(c => c.assetId === asset.id && c.scenarioId === scenario.id);
              const impact = cell?.impact || 0;
              
              return (
                <div
                  key={`${asset.id}-${scenario.id}`}
                  className="h-16 flex items-center justify-center text-white text-sm font-bold rounded cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: getImpactColor(impact) }}
                  title={`${asset.name} × ${scenario.name}: ${impact > 0 ? '+' : ''}${impact}`}
                >
                  {impact > 0 ? '+' : ''}{impact}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
```

### **2. Strategic Insights Cards** (`components/dashboard/StrategicInsights.tsx`)
```typescript
interface StrategicInsights {
  topAssets: Array<{
    name: string;
    resilienceScore: number;
    avgImpact: number;
  }>;
  biggestRisks: Array<{
    scenario: string;
    portfolioImpact: number; // percentage
    probability: number;
  }>;
}

export function StrategicInsights({ insights }: { insights: StrategicInsights }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Resilient Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Most Resilient Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.topAssets.map((asset, index) => (
              <div key={asset.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium">{asset.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {asset.resilienceScore.toFixed(1)}/10
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg: {asset.avgImpact > 0 ? '+' : ''}{asset.avgImpact.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biggest Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Biggest Risk Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.biggestRisks.map((risk, index) => (
              <div key={risk.scenario} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium">{risk.scenario}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    -{risk.portfolioImpact}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {(risk.probability * 100).toFixed(0)}% likely
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **3. Growth Opportunities** (`components/dashboard/GrowthOpportunities.tsx`)
```typescript
interface GrowthOpportunity {
  asset: string;
  tamSize: number; // in billions
  riskAdjustedScore: number; // TAM / Risk ratio
  currentWeight: number; // % of portfolio
  recommendedWeight: number; // % recommended
}

interface SimpleRecommendation {
  action: 'INCREASE' | 'DECREASE' | 'HEDGE' | 'MONITOR';
  target: string;
  reason: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function GrowthOpportunities({ 
  opportunities, 
  recommendations 
}: { 
  opportunities: GrowthOpportunity[], 
  recommendations: SimpleRecommendation[] 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Best TAM/Risk Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Best Growth Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {opportunities.slice(0, 3).map(opp => (
              <div key={opp.asset} className="flex justify-between items-center">
                <span className="text-sm font-medium">{opp.asset}</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">
                    ${opp.tamSize}B TAM
                  </div>
                  <div className="text-xs text-gray-500">
                    Score: {opp.riskAdjustedScore.toFixed(1)}
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
          <CardTitle className="text-base">Strategic Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${
                  rec.impact === 'HIGH' ? 'bg-red-500' :
                  rec.impact === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
                <div>
                  <div className="text-sm font-medium">
                    {rec.action} {rec.target}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rec.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button className="w-full text-sm" variant="outline">
              📊 Rebalance Portfolio
            </Button>
            <Button className="w-full text-sm" variant="outline">
              🛡️ Add Hedging Positions  
            </Button>
            <Button className="w-full text-sm" variant="outline">
              📈 Review Monthly
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔄 **Simplified Data Flow**

### **Core Hook** (`lib/hooks/strategicDashboard.ts`)
```typescript
export function useStrategicDashboard() {
  const { data: assets } = useAssets();
  const { data: scenarios } = useScenarios({});
  const { data: matrixData } = useMatrixCalculation('summary');
  
  return useQuery({
    queryKey: ['strategic-dashboard', assets?.data?.length, scenarios?.data?.length, matrixData?.calculations?.length],
    queryFn: async () => {
      if (!assets?.data || !scenarios?.data || !matrixData?.calculations) {
        return null;
      }
      
      // Simple calculations
      const heatmapData = generateSimpleHeatmap(assets.data, scenarios.data, matrixData.calculations);
      const insights = calculateStrategicInsights(assets.data, scenarios.data, matrixData.calculations);
      const opportunities = findGrowthOpportunities(assets.data, matrixData.calculations);
      const recommendations = generateSimpleRecommendations(insights, opportunities);
      
      return {
        heatmap: heatmapData,
        insights,
        opportunities,
        recommendations
      };
    },
    enabled: !!(assets?.data?.length && scenarios?.data?.length && matrixData?.calculations?.length),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// Simple calculation functions
function calculateStrategicInsights(assets: Asset[], scenarios: Scenario[], matrix: MatrixResult[]) {
  // Calculate resilience score for each asset (0-10 scale)
  const assetScores = assets.map(asset => {
    const assetResults = matrix.filter(m => m.assetId === asset.id);
    const avgImpact = assetResults.reduce((sum, r) => sum + r.impactScore, 0) / assetResults.length;
    const resilience = Math.max(0, Math.min(10, 5 + avgImpact)); // Convert -5/+5 to 0-10
    
    return {
      name: asset.name,
      resilienceScore: resilience,
      avgImpact
    };
  });
  
  // Calculate portfolio risk per scenario
  const scenarioRisks = scenarios.map(scenario => {
    const scenarioResults = matrix.filter(m => m.scenarioId === scenario.id);
    const negativeImpacts = scenarioResults.filter(r => r.impactScore < 0);
    const portfolioImpact = (negativeImpacts.length / scenarioResults.length) * 100;
    
    return {
      scenario: scenario.name,
      portfolioImpact,
      probability: scenario.probability || 0.5
    };
  });
  
  return {
    topAssets: assetScores.sort((a, b) => b.resilienceScore - a.resilienceScore).slice(0, 5),
    biggestRisks: scenarioRisks.sort((a, b) => b.portfolioImpact - a.portfolioImpact).slice(0, 5)
  };
}
```

---

## 📋 **Simplified Implementation Plan**

### **Day 1: Core Components**
- [ ] **Simple Heatmap Component**: CSS Grid-based matrix visualization
- [ ] **Strategic Insights Cards**: Top assets and biggest risks
- [ ] **Basic Data Hook**: `useStrategicDashboard()` with simple calculations

### **Day 2: Integration & Polish**
- [ ] **Growth Opportunities Component**: TAM/Risk ratios and recommendations
- [ ] **Dashboard Integration**: Replace current dashboard content
- [ ] **Mobile Responsive**: Ensure all components work on mobile
- [ ] **Testing**: Basic functionality and data accuracy

---

## ✅ **Core Success Criteria**

### **Visual Clarity**
- [ ] **Instant Understanding**: Users see portfolio health at a glance
- [ ] **Clear Actions**: Specific next steps visible immediately
- [ ] **Simple Colors**: Red/Yellow/Green system everyone understands

### **Core Insights Delivered**
- [ ] **Asset Resilience**: Which assets perform well across scenarios (0-10 score)
- [ ] **Scenario Risk**: Which scenarios hurt portfolio most (% impact)
- [ ] **Growth Opportunities**: Best TAM/Risk ratios highlighted
- [ ] **Simple Recommendations**: 3-5 clear action items

### **Usability**  
- [ ] **No Learning Curve**: Intuitive for any strategic planner
- [ ] **Fast Load**: <2 seconds to strategic insights
- [ ] **Mobile Friendly**: Full functionality on phones/tablets

---

## 🎯 **Ground Truth Alignment**

**Core Mission**: ✅ "Low resolution map of the future"  
**Asset Resilience**: ✅ Clear ranking of cross-scenario performance  
**Risk Assessment**: ✅ Biggest portfolio risk scenarios identified  
**Opportunity Discovery**: ✅ TAM/Impact ratio analysis  
**Strategic Decisions**: ✅ Simple, actionable recommendations  

**Result**: Users get strategic clarity in 30 seconds instead of 2+ hours of manual analysis.

---

This simplified design focuses entirely on the core ground truth deliverables with maximum usability. No complex algorithms, no overwhelming data - just the essential strategic insights presented clearly and intuitively. 