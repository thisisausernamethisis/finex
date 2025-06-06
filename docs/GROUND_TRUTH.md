# Finex v3: Ground Truth System Specification

> **THE CANONICAL SYSTEM DESCRIPTION**
> 
> This document serves as the single source of truth for understanding what Finex v3 is and what we're building.

---

## 🎯 **System Purpose: Scenario-Based Impact Analysis Platform**

Finex v3 is a **scenario analysis matrix platform** that creates a systematic framework for evaluating how potential future events will affect specific assets or investments through AI-powered impact analysis.

### **Core Value Proposition**
Create a **"low resolution map of the future"** by systematically analyzing how different scenarios impact various assets, enabling data-driven strategic planning and risk assessment.

---

## 🏗️ **System Architecture**

### **Assets (Matrix Rows)**
- **Definition**: Specific things you want to analyze (companies, investments, strategies, technologies)
- **Examples**: NVIDIA, Bitcoin, Tesla, a startup, an investment thesis
- **Structure**: Each asset is defined through detailed research:
  - **Themes**: Major analytical categories for understanding the asset
  - **Cards**: Research reports, data points, evidence, analysis documents  
  - **Data**: Comprehensive context for AI analysis including TAM projections

### **Scenarios (Matrix Columns)**
- **Definition**: Time-bound future variables/events that could impact assets
- **Examples**:
  - **Geopolitical**: "China invades Taiwan", "US-China trade war escalates"
  - **Economic**: "Major recession occurs", "Hyperinflation period"
  - **Technological**: "Quantum computing breakthrough", "AI fast takeoff"
  - **Social**: "Humanoid robots go mainstream", "Longevity treatments become available"
  - **Resource**: "Energy shortage crisis", "Critical mineral scarcity"
  - **Regulatory**: "AI regulation tightening", "Crypto becomes regulated"

### **Matrix Analysis (Asset × Scenario Intersections)**
- **Structure**: Grid where each cell represents one Asset × Scenario combination
- **AI Processing**: Each intersection analyzed by AI using:
  - Complete asset context (all themes/cards/research)
  - Scenario details and implications
  - AI-generated impact assessment
- **Output**: Impact score from -5 to +5 with detailed reasoning
- **Examples**:
  - "NVIDIA × China takes Taiwan" → Impact: -4 (supply chain disruption)
  - "Bitcoin × Major recession" → Impact: -2 (risk-off sentiment)
  - "Tesla × Robo-taxis important" → Impact: +5 (competitive advantage)

---

## 💡 **Strategic Value & Use Cases**

### **"Low Resolution Map of the Future"**
The completed matrix provides systematic insights:
- **Asset Resilience**: Which assets perform well across multiple scenarios
- **Scenario Risk Assessment**: Which future events pose the biggest portfolio risks
- **Opportunity Discovery**: Unexpected positive impacts in specific combinations
- **Portfolio Optimization**: Data-driven rebalancing based on scenario analysis

### **Growth/Risk Discovery Engine**
- **TAM Integration**: Each asset includes Total Addressable Market projections
- **Risk-Adjusted Opportunity**: `TAM / Net Impact Score` ratio analysis
- **Cheap Growth Sources**: Identify undervalued assets with high scenario resilience
- **Strategic Positioning**: Make informed bets on future positioning

### **Systematic Future Planning**
Replace ad-hoc speculation with:
- **Structured scenario methodology** with consistent evaluation criteria
- **AI-powered impact assessment** removing human bias and increasing throughput
- **Quantified uncertainty** through systematic -5 to +5 scoring
- **Comparative analysis** enabling relative assessment across multiple assets

---

## 🔄 **User Workflow**

### **Phase 1: Asset Research & Definition**
1. **Create Assets**: Define what you want to analyze
2. **Build Themes**: Create analytical categories (market position, technology, competition, etc.)
3. **Populate Cards**: Fill themes with research reports, data, analysis, evidence
4. **Add TAM Data**: Include market size and growth projections

### **Phase 2: Scenario Planning**
1. **Define Scenarios**: Create time-bound future variables to test
2. **Categorize Types**: Organize by domain (geopolitical, economic, technological, etc.)
3. **Set Probabilities**: Assign likelihood estimates for each scenario
4. **Timeline Estimation**: Define when scenarios might occur

### **Phase 3: Matrix Generation**
1. **AI Analysis**: System processes each Asset × Scenario intersection
2. **Context Assembly**: AI receives complete asset research + scenario details
3. **Impact Scoring**: AI generates -5 to +5 score with detailed reasoning
4. **Matrix Population**: Complete grid showing all impact relationships

### **Phase 4: Strategic Analysis**
1. **Pattern Recognition**: Identify assets with consistent positive/negative scenarios
2. **Risk Assessment**: Find concentration risks and vulnerability patterns
3. **Opportunity Analysis**: Combine impact scores with TAM for growth/risk ratios
4. **Strategic Decisions**: Make informed allocation and positioning choices

---

## 🔧 **Technical Implementation**

### **Database Schema (Core Models)**
```typescript
Asset {
  id: string;
  name: string;
  description: string;
  tamProjection: number;        // Total Addressable Market
  themes: Theme[];             // Research categories
  userId: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

Theme {
  id: string;
  name: string;
  description: string;
  assetId: string;             // Belongs to specific asset
  cards: Card[];               // Research documents
  calculatedValue: number;     // AI-computed importance
  createdAt: DateTime;
}

Card {
  id: string;
  title: string;
  content: string;             // Research data, reports, analysis
  themeId: string;
  chunks: Chunk[];             // For AI processing/embeddings
  importance: number;          // 1-5 relevance rating
  source: string;              // Reference/URL
  createdAt: DateTime;
}

Scenario {
  id: string;
  name: string;                // "China takes Taiwan"
  description: string;         // Detailed scenario description
  type: ScenarioType;          // GEOPOLITICAL, ECONOMIC, TECHNOLOGICAL, etc.
  timeline: string;            // "2-5 years", "1-3 years"
  probability: number;         // 0.0-1.0 likelihood estimate
  userId: string;
  createdAt: DateTime;
}

MatrixAnalysisResult {
  id: string;
  assetId: string;
  scenarioId: string;
  impactScore: number;         // -5 to +5 AI-generated impact
  reasoning: string;           // AI explanation of score
  confidenceScore: number;     // AI confidence in analysis
  evidence: JSON;              // Supporting data/reasoning
  jobId: string;               // Background processing reference
  status: string;              // 'pending', 'completed', 'failed'
  createdAt: DateTime;
}
```

### **AI Processing Pipeline**
1. **Context Assembly**: Gather all theme/card content for an asset
2. **Scenario Integration**: Combine asset context with scenario details
3. **Impact Analysis**: AI evaluates intersection and generates impact score
4. **Reasoning Generation**: AI explains the reasoning behind the score
5. **Matrix Population**: Store results and update analysis grid

### **Background Job System**
- **BullMQ + Redis**: Handle matrix calculations asynchronously
- **Matrix Analysis Worker**: Process Asset × Scenario intersections
- **Batch Processing**: Efficiently handle large matrix calculations
- **Error Handling**: Retry failed analyses and track job status

---

## 🚀 **Future Enhancement Vision**

### **Phase 1: Basic Matrix** (Current Implementation)
- Individual cell analysis (Asset × Scenario)
- Independent impact scoring
- Linear analysis without cross-scenario effects

### **Phase 2: Advanced Correlation Analysis** (Future)
- **Scenario Correlations**: How scenarios influence each other
- **Second-Order Effects**: Indirect impacts through system relationships
- **Dynamic Modeling**: Account for cascading effects across the matrix
- **Network Effects**: More sophisticated future mapping beyond linear scoring

### **Phase 3: Portfolio Intelligence** (Advanced)
- **Concentration Risk Analysis**: Identify dangerous portfolio exposures
- **Optimization Recommendations**: AI-suggested portfolio rebalancing
- **Scenario Sensitivity**: Portfolio-level resilience across scenario combinations
- **Historical Backtesting**: Validate scenario analysis against historical events

---

## 📊 **Success Metrics**

### **System Effectiveness**
- **Analysis Throughput**: Complete Asset × Scenario matrix in <30 minutes
- **Impact Accuracy**: AI scores correlate with expert analyst assessments
- **Research Efficiency**: 10x faster than manual scenario analysis
- **Decision Quality**: Improved investment outcomes through systematic analysis

### **User Value**
- **Strategic Clarity**: Clear understanding of portfolio scenario exposure
- **Risk Awareness**: Identification of previously unknown vulnerabilities
- **Opportunity Discovery**: Find high-potential, low-risk asset combinations
- **Competitive Advantage**: Superior strategic planning through systematic future mapping

---

## 🎯 **What This System Is NOT**

- **NOT** a simple portfolio tracker or financial dashboard
- **NOT** a technology categorization or auto-classification tool
- **NOT** a traditional research workspace or document management system
- **NOT** focused on past performance or historical analysis

**This IS** a systematic future scenario analysis platform that quantifies uncertainty and enables data-driven strategic planning through AI-powered impact assessment.

---

## 📋 **Current Implementation Status**

### ✅ **Core Infrastructure Complete**
- Database schema aligned with system architecture
- Asset/Theme/Card research framework operational
- Scenario management with type categorization
- Matrix analysis job processing system
- AI integration for impact scoring

### 🚧 **Frontend Modernization In Progress**
- React Query migration (Patch 8 completed)
- Matrix visualization enhancement
- Component architecture isolation

### 📋 **Next Phase: System Completion**
- Enhanced matrix calculation AI workers
- Real-time matrix visualization interface
- Portfolio-level scenario analysis
- Advanced correlation and second-order effect modeling

This system represents the future of strategic planning: turning scenario analysis from an art into a systematic, AI-enhanced science. 