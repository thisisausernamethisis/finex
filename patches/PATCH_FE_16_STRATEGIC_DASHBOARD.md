# PATCH FE-16: Strategic Dashboard Enhancement

**Priority**: HIGH  
**Effort**: 3 days  
**Dependencies**: PATCH FE-15 (Guided Workflow)  
**Target Alignment**: Transform dashboard into strategic analysis center

---

## 🎯 Objective

Transform the current basic metrics dashboard into a comprehensive strategic analysis center that provides the "low resolution map of the future" visualization and portfolio-level insights.

---

## 📋 Current State vs Target

### **Current Dashboard** (`app/dashboard/page.tsx`)
- Basic metrics: Total assets, scenarios, matrix coverage
- Simple performance data display
- No strategic analysis or recommendations
- Missing portfolio-level insights

### **Target Strategic Dashboard**
- Portfolio resilience scoring (0-100)
- Scenario heatmap visualization
- Asset concentration risk analysis
- AI-generated strategic recommendations
- TAM-integrated growth discovery

---

## 🛠️ Implementation Specification

### **1. Portfolio Resilience Scoring**

```typescript
interface PortfolioResilience {
  score: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  vulnerabilities: string[];
  strengths: string[];
  recommendations: string[];
}

// New service: lib/services/portfolioAnalysisService.ts
export async function calculatePortfolioResilience(): Promise<PortfolioResilience> {
  // Algorithm:
  // 1. Cross-scenario impact analysis
  // 2. Asset concentration assessment
  // 3. Scenario sensitivity mapping
  // 4. Risk-adjusted scoring
}
```

### **2. Strategic Heatmap Component**

```typescript
// components/dashboard/PortfolioHeatmap.tsx
interface HeatmapData {
  assets: Array<{
    id: string;
    name: string;
    avgImpact: number;
    volatility: number;
    tamSize: number;
  }>;
  scenarios: Array<{
    id: string;
    name: string;
    avgImpact: number;
    probability: number;
  }>;
  matrix: Array<{
    assetId: string;
    scenarioId: string;
    impact: number;
    confidence: number;
  }>;
}

export function PortfolioHeatmap({ data }: { data: HeatmapData }) {
  // D3.js-powered heatmap visualization
  // Color coding: Red (negative), Green (positive), Gray (neutral)
  // Interactive tooltips with detailed analysis
  // Zoom and filter capabilities
}
```

### **3. Risk Concentration Analysis**

```typescript
// components/dashboard/ConcentrationAnalysis.tsx
interface ConcentrationRisk {
  singleScenarioFailure: {
    scenario: string;
    impactedAssets: number;
    portfolioLoss: number;
  };
  correlatedAssets: Array<{
    group: string[];
    correlation: number;
    sharedVulnerabilities: string[];
  }>;
  diversificationScore: number; // 0-100
}
```

### **4. AI-Generated Recommendations**

```typescript
// lib/services/recommendationService.ts
interface StrategyRecommendation {
  type: 'REBALANCE' | 'HEDGE' | 'OPPORTUNITY' | 'WARNING';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timeframe: string;
  actionItems: string[];
  rationale: string;
}

export async function generateStrategicRecommendations(): Promise<StrategyRecommendation[]> {
  // AI-powered analysis of:
  // 1. Portfolio composition
  // 2. Scenario probabilities
  // 3. Market conditions
  // 4. Risk tolerance
}
```

---

## 🎨 Visual Design Specifications

### **Dashboard Layout**
```
┌─────────────────────────────────────────────────────────┐
│ Portfolio Resilience Score (Hero Section)              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │ Score: 78/100│ │ Risk: MEDIUM│ │ 12 Assets   │      │
│ └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│ Strategic Heatmap (2/3 width) │ Recommendations (1/3)  │
│ ┌───────────────────────────┐  │ ┌─────────────────────┐ │
│ │ Asset × Scenario Matrix   │  │ │ Top 3 Actions      │ │
│ │ Interactive visualization │  │ │ • Reduce NVDA       │ │
│ │ Color-coded impacts       │  │ │ • Add defense hedge │ │
│ │ Tooltip details          │  │ │ • Monitor China     │ │
│ └───────────────────────────┘  │ └─────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Risk Analysis Cards                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │ Concentration│ │ Correlation  │ │ Opportunity  │   │
│ │ Risk         │ │ Clusters     │ │ Discovery    │   │
│ └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### **Color Scheme**
- **High Risk**: Red gradients (#EF4444 to #DC2626)
- **Medium Risk**: Yellow gradients (#F59E0B to #D97706)
- **Low Risk**: Green gradients (#10B981 to #059669)
- **Opportunities**: Blue gradients (#3B82F6 to #2563EB)

---

## 🔄 Data Integration

### **Required Data Sources**
1. **Portfolio Metrics**: From existing dashboard hooks
2. **Matrix Results**: From matrix calculation service
3. **Asset TAM Data**: From asset management hooks
4. **Scenario Probabilities**: From scenario management
5. **Historical Performance**: From analytics service

### **Real-time Updates**
```typescript
// Enhanced dashboard hook
export function useStrategicDashboard() {
  const portfolioResilience = usePortfolioResilience();
  const heatmapData = usePortfolioHeatmap();
  const riskAnalysis = useConcentrationAnalysis();
  const recommendations = useStrategicRecommendations();
  
  return {
    isLoading: portfolioResilience.isLoading || heatmapData.isLoading,
    data: {
      resilience: portfolioResilience.data,
      heatmap: heatmapData.data,
      risks: riskAnalysis.data,
      recommendations: recommendations.data
    }
  };
}
```

---

## 📱 Responsive Design

### **Desktop (≥1024px)**
- Full heatmap visualization
- Side-by-side risk analysis cards
- Detailed recommendation panels

### **Tablet (768px - 1023px)**
- Stacked layout with scrollable sections
- Condensed heatmap with zoom controls
- Collapsible recommendation details

### **Mobile (≤767px)**
- Single-column layout
- Summary metrics only
- Swipeable cards for analysis
- Quick action buttons

---

## 🧪 Testing Requirements

### **Performance Tests**
- Heatmap rendering: <2s for 50×50 matrix
- Dashboard load time: <3s complete render
- Real-time updates: <500ms data refresh

### **Accuracy Tests**
- Portfolio resilience calculation validation
- Risk scoring algorithm verification
- Recommendation relevance testing

### **Visual Tests**
- Heatmap color accuracy across scenarios
- Responsive layout on all device sizes
- Accessibility compliance (WCAG 2.1)

---

## 📈 Success Metrics

### **User Engagement**
- **Dashboard session time**: Increase by 150%
- **Action completion**: >60% follow recommendations
- **Feature usage**: >80% interact with heatmap

### **Strategic Value**
- **Decision confidence**: User surveys show 40% improvement
- **Risk awareness**: 90% identify top portfolio risks
- **Time to insight**: 70% faster strategic analysis

---

## 🔧 Implementation Steps

### **Day 1: Portfolio Analysis Backend**
1. Implement portfolioAnalysisService.ts
2. Create resilience scoring algorithm
3. Build concentration risk calculator
4. Test calculation accuracy

### **Day 2: Heatmap Visualization**
1. Design and implement PortfolioHeatmap component
2. Integrate D3.js for interactive visualization
3. Add responsive scaling and touch controls
4. Test performance with large datasets

### **Day 3: Integration & Polish**
1. Integrate all components into dashboard
2. Implement real-time data updates
3. Add recommendation generation
4. Complete responsive design and testing

---

## 🎯 Post-Implementation Validation

### **Functionality Checklist**
- [ ] Portfolio resilience score (0-100) calculated and displayed
- [ ] Interactive heatmap showing asset × scenario impacts
- [ ] Concentration risk analysis functional
- [ ] AI-generated strategic recommendations shown
- [ ] Real-time updates when underlying data changes
- [ ] Mobile responsive design maintained
- [ ] Performance targets met (<3s load time)

### **Ground Truth Compliance**
- [ ] "Portfolio heatmap across all scenarios" ✓
- [ ] "Low resolution map of the future" overview ✓
- [ ] "Strategic dashboard provides actionable insights" ✓
- [ ] "Risk assessment and opportunity analysis" ✓

**Expected Impact**: Strategic dashboard functionality +3.0 points alignment improvement 