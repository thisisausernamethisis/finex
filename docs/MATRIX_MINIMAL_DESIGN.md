# Matrix Minimal Design Specification

**Date**: 2024-12-19  
**Focus**: Core Asset × Scenario matrix scaffold per ground truth requirements

---

## 🎯 **Ground Truth Requirements**

### **System Core Purpose**
- **Matrix Analysis Platform**: Asset × Scenario grid with AI-powered impact scoring
- **Fixed Variables**: Assets (rows) - specific things to analyze (NVIDIA, Tesla, Bitcoin)
- **Time-Dependent Variables**: Scenarios (columns) - probabilistic future events
- **Cell Structure**: Impact score (-5 to +5) on top, AI reasoning underneath
- **Output**: "Low resolution map of the future" for strategic planning

### **Essential 3-Tab Workflow**
1. **Assets Tab**: Research and define fixed variables (themes → cards → TAM)
2. **Scenarios Tab**: Define time-dependent variables (probabilities, timelines)
3. **Matrix Tab**: **THE CORE SCAFFOLD** - present impact analysis between variables

---

## 🏗️ **Matrix Tab Core Design**

### **Visual Structure**
```
┌─────────────────────────────────────────────────────────────┐
│ Impact Matrix: Assets × Scenarios                           │
├─────────────────────────────────────────────────────────────┤
│           │ China War │ Recession │ AI Breakthrough │ ...   │
│           │  70% prob │  40% prob │      25% prob   │       │
├─────────────────────────────────────────────────────────────┤
│ NVIDIA    │    -4     │    -2     │       +5        │ ...   │
│ $2T TAM   │[reasoning]│[reasoning]│   [reasoning]    │       │
├─────────────────────────────────────────────────────────────┤
│ Tesla     │    -3     │    -1     │       +3        │ ...   │
│ $800B TAM │[reasoning]│[reasoning]│   [reasoning]    │       │
├─────────────────────────────────────────────────────────────┤
│ Bitcoin   │    -2     │    -3     │       +2        │ ...   │
│ $500B TAM │[reasoning]│[reasoning]│   [reasoning]    │       │
└─────────────────────────────────────────────────────────────┘

Strategic Insights:
• Most Resilient: NVIDIA (+0.3 avg), Tesla (+0.1 avg)
• Biggest Risks: Recession (-2.0 avg), China War (-3.0 avg)  
• Growth Ops: NVIDIA ($2T TAM, +0.3 resilience)
```

### **Core Cell Requirements**
- **Visual Impact Score**: Large, color-coded -5 to +5 number
- **Color System**: Red (negative), Yellow (neutral), Green (positive)
- **Confidence Indicator**: AI confidence percentage visible
- **Reasoning Access**: Click cell → full AI analysis modal
- **Hover Preview**: Quick reasoning summary on hover

### **Strategic Insights Panel**
- **Asset Resilience**: Which assets perform best across scenarios
- **Scenario Risk**: Which scenarios pose biggest portfolio threats
- **TAM Opportunities**: Growth/risk ratios for strategic positioning

---

## 🔧 **Technical Implementation**

### **Data Structure**
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
    avgImpact: number; // Calculated resilience
  }>;
  scenarios: Array<{
    id: string;
    name: string;
    probability: number;
    avgImpact: number; // Calculated risk
  }>;
  cells: MatrixCell[];
}
```

### **Core Components**
1. **ImpactMatrix**: Main grid component with scrollable layout
2. **ImpactCell**: Individual cell with score, confidence, reasoning preview
3. **CellDetailModal**: Full AI analysis display on click
4. **MatrixInsights**: Strategic pattern analysis below grid

### **Visual Design**
- **Grid Layout**: CSS Grid for responsive matrix structure
- **Color Coding**: 
  - Green: +3 to +5 (strong positive)
  - Light Green: +1 to +2 (positive)
  - Yellow: -1 to +1 (neutral)
  - Light Red: -2 to -3 (negative)
  - Red: -4 to -5 (strong negative)
- **Typography**: Impact scores large and bold, metadata small
- **Mobile**: Horizontal scroll for matrix, vertical stack for insights

---

## ✅ **Success Criteria**

### **Matrix as Scaffold**
- [ ] Clear Assets (rows) × Scenarios (columns) structure
- [ ] Impact scores (-5 to +5) immediately visible in each cell
- [ ] Color coding makes patterns instantly recognizable
- [ ] Click any cell to access full AI reasoning underneath

### **Strategic Value Delivery**
- [ ] Asset resilience ranking across all scenarios
- [ ] Scenario risk assessment for portfolio impact
- [ ] TAM-integrated growth/risk opportunity discovery
- [ ] Clear "low resolution map of future" output

### **Workflow Integration**
- [ ] Clear progression from Assets → Scenarios → Matrix
- [ ] Matrix readiness indicators when data sufficient
- [ ] Strategic insights drive next actions and decisions

---

## 🎯 **Ground Truth Alignment Checklist**

**✅ Matrix Platform**: Asset × Scenario grid with AI impact analysis  
**✅ Fixed vs Time-Dependent**: Assets (fixed) vs Scenarios (probabilistic)  
**✅ Cell Structure**: Impact score on top, reasoning underneath  
**✅ Strategic Output**: Low resolution map enabling decisions  
**✅ Systematic Analysis**: Replace speculation with structured methodology

**Result**: Users get the core scaffold for systematic impact analysis between their fixed variables (assets) and time-dependent variables (scenarios), delivering the strategic "map of the future" per ground truth specification. 