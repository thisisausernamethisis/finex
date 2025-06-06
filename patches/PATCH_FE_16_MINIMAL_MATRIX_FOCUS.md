# PATCH FE-16: Minimal Matrix-Focused Design

**Priority**: HIGH  
**Effort**: 2 days  
**Dependencies**: PATCH FE-15 (Guided Workflow) ✅ COMPLETE  
**Focus**: Core Asset → Scenario → Matrix workflow per ground truth

---

## 🎯 **Core Ground Truth Requirements**

### **The System IS:**
- **Matrix Analysis Platform**: Asset × Scenario grid with AI-powered impact scoring
- **Fixed Variables**: Assets (rows) - things you want to analyze
- **Time-Dependent Variables**: Scenarios (columns) - probabilistic future events  
- **Cell Content**: Each intersection = AI impact analysis (-5 to +5) with reasoning
- **Output**: "Low resolution map of the future" for strategic planning

### **Essential 3-Tab Workflow:**
1. **Assets Tab**: Create and research assets (themes → cards → TAM data)
2. **Scenarios Tab**: Define future variables (types, probabilities, timelines)
3. **Matrix Tab**: **THE CORE** - scaffold presenting impact analysis between fixed and time-dependent variables

---

## 🏗️ **Core Minimal Design**

### **Assets Tab Enhancement**
**Current State**: ✅ Functional asset management  
**Gap**: Missing clear workflow progression indicator  
**Minimal Addition**: 
- Progress indicator showing completion for matrix readiness
- TAM data prominence for growth/risk analysis

### **Scenarios Tab Enhancement**  
**Current State**: ✅ Functional scenario management  
**Gap**: Missing clear connection to matrix generation  
**Minimal Addition**:
- Matrix readiness indicator when sufficient scenarios exist
- Clear progression to matrix generation

### **Matrix Tab: THE CORE FOCUS**
**Current State**: ✅ Basic matrix grid functional  
**Target**: Enhanced scaffold for impact analysis presentation

```
Matrix Tab Core Design:
┌─────────────────────────────────────────────────────────────┐
│ Impact Matrix: Assets × Scenarios                           │
├─────────────────────────────────────────────────────────────┤
│           │ China War │ Recession │ AI Breakthrough │ ...   │
├─────────────────────────────────────────────────────────────┤
│ NVIDIA    │    -4     │    -2     │       +5        │ ...   │
│           │[reasoning]│[reasoning]│   [reasoning]    │       │
├─────────────────────────────────────────────────────────────┤
│ Tesla     │    -3     │    -1     │       +3        │ ...   │
│           │[reasoning]│[reasoning]│   [reasoning]    │       │
├─────────────────────────────────────────────────────────────┤
│ Bitcoin   │    -2     │    -3     │       +2        │ ...   │
│           │[reasoning]│[reasoning]│   [reasoning]    │       │
└─────────────────────────────────────────────────────────────┘

Row Summary: Asset resilience across scenarios
Column Summary: Scenario impact across portfolio  
```

**Core Cell Structure:**
- **Top**: Impact score (-5 to +5) with color coding
- **Underneath**: Expandable AI reasoning and evidence
- **Hover**: Quick summary of analysis
- **Click**: Full detailed reasoning modal

---

## 🛠️ **Minimal Implementation**

### **1. Enhanced Matrix Grid** (`app/matrix/page.tsx`)

```typescript
interface MatrixCell {
  assetId: string;
  scenarioId: string;
  impactScore: number; // -5 to +5
  reasoning: string;   // AI explanation
  confidenceScore: number; // 0-1
  status: 'pending' | 'completed' | 'failed';
}

interface MatrixDisplay {
  assets: Array<{
    id: string;
    name: string;
    tamProjection?: number;
    avgImpact: number; // Calculated from all scenarios
  }>;
  scenarios: Array<{
    id: string;
    name: string;
    type: string;
    probability: number;
    avgImpact: number; // Calculated from all assets
  }>;
  cells: MatrixCell[];
}

export default function MatrixPage() {
  const { data: matrixData } = useMatrixCalculation('detailed');
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with matrix stats */}
        <MatrixHeader data={matrixData} />
        
        {/* The Core: Asset × Scenario Grid */}
        <ImpactMatrix data={matrixData} />
        
        {/* Strategic Insights derived from matrix */}
        <MatrixInsights data={matrixData} />
      </div>
    </div>
  );
}
```

### **2. Core Impact Matrix Component** (`components/matrix/ImpactMatrix.tsx`)

```typescript
export function ImpactMatrix({ data }: { data: MatrixDisplay }) {
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Analysis Matrix</CardTitle>
        <CardDescription>
          Fixed Variables (Assets) × Time-Dependent Variables (Scenarios)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Matrix Grid */}
            <div className="grid gap-1" style={{
              gridTemplateColumns: `200px repeat(${data.scenarios.length}, 120px)`
            }}>
              {/* Header Row */}
              <div className="bg-gray-50 p-3 font-medium">Assets / Scenarios</div>
              {data.scenarios.map(scenario => (
                <div key={scenario.id} className="bg-gray-50 p-2 text-center">
                  <div className="font-medium text-sm">{scenario.name}</div>
                  <div className="text-xs text-gray-500">
                    {(scenario.probability * 100).toFixed(0)}% likely
                  </div>
                  <div className="text-xs font-bold text-blue-600">
                    Avg: {scenario.avgImpact > 0 ? '+' : ''}{scenario.avgImpact.toFixed(1)}
                  </div>
                </div>
              ))}
              
              {/* Asset Rows */}
              {data.assets.map(asset => (
                <>
                  {/* Asset Header */}
                  <div key={asset.id} className="bg-gray-50 p-3">
                    <div className="font-medium">{asset.name}</div>
                    {asset.tamProjection && (
                      <div className="text-xs text-blue-600">
                        TAM: ${asset.tamProjection}B
                      </div>
                    )}
                    <div className="text-xs font-bold text-green-600">
                      Resilience: {asset.avgImpact > 0 ? '+' : ''}{asset.avgImpact.toFixed(1)}
                    </div>
                  </div>
                  
                  {/* Impact Cells */}
                  {data.scenarios.map(scenario => {
                    const cell = data.cells.find(c => 
                      c.assetId === asset.id && c.scenarioId === scenario.id
                    );
                    
                    return (
                      <ImpactCell
                        key={`${asset.id}-${scenario.id}`}
                        cell={cell}
                        asset={asset}
                        scenario={scenario}
                        onClick={() => setSelectedCell(cell)}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
        
        {/* Cell Detail Modal */}
        {selectedCell && (
          <CellDetailModal
            cell={selectedCell}
            onClose={() => setSelectedCell(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

### **3. Impact Cell Component** (`components/matrix/ImpactCell.tsx`)

```typescript
interface ImpactCellProps {
  cell?: MatrixCell;
  asset: { name: string };
  scenario: { name: string };
  onClick: () => void;
}

export function ImpactCell({ cell, asset, scenario, onClick }: ImpactCellProps) {
  const getImpactColor = (score: number) => {
    if (score >= 3) return '#059669'; // Dark green
    if (score >= 1) return '#10B981'; // Green
    if (score > -1) return '#F59E0B'; // Yellow
    if (score > -3) return '#EF4444'; // Red
    return '#DC2626'; // Dark red
  };
  
  const getConfidenceOpacity = (confidence: number) => {
    return Math.max(0.4, confidence); // 40% minimum opacity
  };
  
  if (!cell || cell.status === 'pending') {
    return (
      <div className="h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
        <div className="text-xs text-gray-500">
          {cell?.status === 'pending' ? 'Analyzing...' : 'Not analyzed'}
        </div>
      </div>
    );
  }
  
  if (cell.status === 'failed') {
    return (
      <div className="h-20 bg-red-50 border border-red-200 rounded flex items-center justify-center">
        <div className="text-xs text-red-600">Analysis failed</div>
      </div>
    );
  }
  
  return (
    <div
      className="h-20 border border-gray-200 rounded cursor-pointer hover:scale-105 transition-transform"
      style={{
        backgroundColor: getImpactColor(cell.impactScore),
        opacity: getConfidenceOpacity(cell.confidenceScore)
      }}
      onClick={onClick}
      title={`${asset.name} × ${scenario.name}: ${cell.impactScore > 0 ? '+' : ''}${cell.impactScore}`}
    >
      <div className="h-full flex flex-col items-center justify-center text-white">
        {/* Impact Score */}
        <div className="text-lg font-bold">
          {cell.impactScore > 0 ? '+' : ''}{cell.impactScore}
        </div>
        
        {/* Confidence Indicator */}
        <div className="text-xs opacity-80">
          {(cell.confidenceScore * 100).toFixed(0)}% confident
        </div>
        
        {/* Quick Reasoning Preview */}
        <div className="text-xs opacity-60 px-1 text-center truncate">
          {cell.reasoning.substring(0, 30)}...
        </div>
      </div>
    </div>
  );
}
```

### **4. Matrix Strategic Insights** (`components/matrix/MatrixInsights.tsx`)

```typescript
export function MatrixInsights({ data }: { data: MatrixDisplay }) {
  // Calculate insights from the matrix
  const topResilientAssets = data.assets
    .sort((a, b) => b.avgImpact - a.avgImpact)
    .slice(0, 3);
    
  const biggestRiskScenarios = data.scenarios
    .sort((a, b) => a.avgImpact - b.avgImpact) // Lowest (most negative) first
    .slice(0, 3);
    
  const tamOpportunities = data.assets
    .filter(a => a.tamProjection && a.avgImpact > 0)
    .sort((a, b) => (b.tamProjection! / Math.max(1, -b.avgImpact)) - (a.tamProjection! / Math.max(1, -a.avgImpact)))
    .slice(0, 3);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Most Resilient Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Resilient Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topResilientAssets.map((asset, index) => (
              <div key={asset.id} className="flex justify-between items-center">
                <span className="text-sm font-medium">{asset.name}</span>
                <span className="text-sm font-bold text-green-600">
                  {asset.avgImpact > 0 ? '+' : ''}{asset.avgImpact.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Biggest Risk Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Biggest Risk Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {biggestRiskScenarios.map((scenario, index) => (
              <div key={scenario.id} className="flex justify-between items-center">
                <span className="text-sm font-medium">{scenario.name}</span>
                <span className="text-sm font-bold text-red-600">
                  {scenario.avgImpact.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* TAM Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tamOpportunities.map((asset, index) => (
              <div key={asset.id} className="flex justify-between items-center">
                <span className="text-sm font-medium">{asset.name}</span>
                <span className="text-sm font-bold text-blue-600">
                  ${asset.tamProjection}B TAM
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📋 **Minimal Implementation Plan**

### **Day 1: Core Matrix Enhancement**
- [ ] **Enhanced Matrix Grid**: Better visual hierarchy and cell display
- [ ] **Impact Cell Component**: Color-coded cells with confidence indicators
- [ ] **Cell Detail Modal**: Full AI reasoning display on click

### **Day 2: Strategic Insights & Polish**
- [ ] **Matrix Insights Component**: Extract strategic patterns from matrix
- [ ] **Workflow Integration**: Clear progression indicators from assets → scenarios → matrix
- [ ] **Mobile Responsive**: Matrix table scrollable and usable on mobile

---

## ✅ **Core Success Criteria**

### **Matrix as Scaffold**
- [ ] **Clear Grid Structure**: Assets (rows) × Scenarios (columns) clearly presented
- [ ] **Impact Scores Prominent**: -5 to +5 scores immediately visible in each cell
- [ ] **AI Reasoning Accessible**: Click any cell to see full AI analysis underneath
- [ ] **Visual Hierarchy**: Color coding makes patterns immediately apparent

### **Strategic Insights Delivery**
- [ ] **Asset Resilience**: Which assets perform well across multiple scenarios
- [ ] **Scenario Risk**: Which scenarios pose biggest portfolio threats  
- [ ] **TAM Opportunities**: Growth/risk ratios clearly identified
- [ ] **Pattern Recognition**: Matrix patterns drive strategic recommendations

### **Workflow Integration**
- [ ] **Clear Progression**: Assets → Scenarios → Matrix workflow obvious
- [ ] **Matrix Readiness**: Clear indicators when sufficient data exists for analysis
- [ ] **Strategic Output**: Matrix provides "low resolution map of future"

---

## 🎯 **Ground Truth Alignment**

**✅ Matrix Platform**: Asset × Scenario grid with AI impact analysis  
**✅ Fixed vs Time-Dependent**: Clear distinction between assets (fixed) and scenarios (probabilistic)  
**✅ Cell Structure**: Impact score on top, AI reasoning underneath  
**✅ Strategic Output**: Low resolution map enabling data-driven decisions  
**✅ Systematic Analysis**: Replace ad-hoc speculation with structured methodology  

**Result**: Users get a clear scaffold for presenting and understanding impact analysis between their fixed variables (assets) and time-dependent variables (scenarios), with each cell providing systematic AI-powered impact assessment. 