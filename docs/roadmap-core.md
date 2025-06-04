# MetaMap • Roadmap Core Document

> **Single Source of Truth** for system architecture, design decisions, and transformation roadmap.
> Last Updated: January 2025 • **MetaMap Transformation Integration**

## 🎯 **Project Mission - TRANSFORMED**

**MetaMap** is an AI-powered technology disruption analysis tool that:
- **Auto-categorizes assets** by technology vertical (AI/Compute, Robotics/Physical AI, Quantum)
- **Generates instant insights** ("Tesla is 80% robotics play", "Portfolio has 60% AI exposure")
- **Analyzes technology scenarios** with simplified matrix interface
- **Preserves all technical sophistication** while dramatically simplifying user experience

**Key Transformation**: From complex research workspace → Simple matrix analysis tool with maximum insight generation.

## 🏗️ **System Architecture - Enhanced**

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Simple Matrix   │    │   Enhanced API  │    │  AI-Powered     │
│ Interface UI    │    │   + Technology  │    │  Workers +      │
│                 │    │   Endpoints     │    │  Categorization │
│ • Dashboard ✅  │◄──►│                 │◄──►│                 │
│ • Real data ✅  │    │ • /technology ✅│    │ • Tech Worker ⏳│
│ • 3-click flow  │    │ • /categorize ⏳│    │ • Portfolio AI ⏳│
│ • Hidden        │    │ • /insights ⏳  │    │ • Matrix + RAG ✅│
│   complexity ✅ │    │ • /simple ⏳    │    │ • Growth + Risk ✅│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │ Enhanced Schema │
                    │       ✅        │
                    │ • ScenarioType ✅│
                    │ • Asset.category✅│
                    │ • Asset.insights✅│
                    │ • Timeline ✅   │
                    │ • Tech scenarios✅│
                    └─────────────────┘
```

### **MetaMap Data Flow - UPDATED**
```
1. User adds asset → Auto-categorization worker ⏳ → "Tesla = Robotics/Physical AI"
2. System analyzes scenarios ✅ → Tech-focused matrix calculation → Impact scores
3. Portfolio insight worker ⏳ → Concentration analysis → "60% AI exposure"
4. Simple dashboard ✅ → Surfaces insights → 3-click workflow complete
```

## 🌟 **Fully Completed System Vision - Updated**

### **✅ COMPLETED: MetaMap Foundation (T-170)**
```
Step 1: TECHNOLOGY FOUNDATION ✅
├─ Database Schema Enhanced ✅
│  ├─ ScenarioType enum (TECHNOLOGY, ECONOMIC, GEOPOLITICAL, REGULATORY, MARKET)
│  ├─ TechnologyCategory enum (AI_COMPUTE, ROBOTICS_PHYSICAL_AI, QUANTUM_COMPUTING, etc.)
│  └─ Asset categorization fields (category, categoryConfidence, categoryInsights)
├─ Technology Scenarios Seeded ✅
│  ├─ "AI Compute Breakthrough" (TECHNOLOGY, 2-5 years, 40%)
│  ├─ "Physical AI Mass Adoption" (TECHNOLOGY, 3-7 years, 60%)
│  ├─ "Quantum Computing Breakthrough" (TECHNOLOGY, 5-10 years, 30%)
│  ├─ "AI Regulation Tightening" (REGULATORY, 1-3 years, 70%)
│  └─ "Semiconductor Supply Crisis" (GEOPOLITICAL, 1-2 years, 50%)
├─ Technology Assets Categorized ✅
│  ├─ NVIDIA → AI_COMPUTE (95% confidence)
│  ├─ Tesla → ROBOTICS_PHYSICAL_AI (88% confidence)
│  ├─ Google → AI_COMPUTE (82% confidence)
│  ├─ Microsoft → AI_COMPUTE (79% confidence)
│  ├─ IonQ → QUANTUM_COMPUTING (93% confidence)
│  └─ Boston Dynamics → ROBOTICS_PHYSICAL_AI (91% confidence)
├─ Real Data Integration ✅
│  ├─ GET /api/scenarios/technology endpoint working
│  ├─ Dashboard fetches real technology scenarios
│  └─ Contract tests passing
└─ Architecture Preserved ✅
   ├─ All existing template library functionality intact
   ├─ Themes→Cards→Chunks hierarchy ready for AI insights
   └─ Worker-based matrix analysis operational
```

### **⏳ IN PROGRESS: User Journey (Next 3 Steps)**
```
Step 2: ANALYZE MATRIX ⏳
├─ Simple matrix grid shows:
│  ├─ AI Compute Breakthrough × NVIDIA = +4 impact (needs auto-calculation)
│  ├─ Physical AI Adoption × Tesla = +5 impact (needs auto-calculation)
│  └─ Quantum Computing × Portfolio = -1 impact (needs auto-calculation)
├─ Click any cell → AI explanation + evidence (needs enhancement)
└─ Timeline view: 2-5 years vs 5-10 years scenarios (needs UI)

Step 3: GET INSIGHTS ⏳
├─ Auto-generated revelations (needs implementation):
│  ├─ "Tesla is fundamentally a robotics company (80% future value)"
│  ├─ "NVIDIA benefits from any AI compute advancement" 
│  └─ "Portfolio concentration risk: 60% in AI/compute vertical"
├─ Action recommendations (needs AI generation)
└─ Portfolio rebalancing suggestions (needs analysis engine)
```

## 🚀 **UPDATED Implementation Roadmap**

### **✅ Phase 6a: MetaMap Foundation - COMPLETED**
**Status**: 100% Complete ✅  
**Duration**: 1 week (Completed January 2025)

#### **✅ Completed Deliverables**
- Database schema with technology categorization
- Technology scenarios with theme→card structure
- Real data API endpoints
- Dashboard integration with real scenarios
- Contract test coverage
- Preserved backward compatibility

### **⏳ Phase 6b: Auto-Categorization Intelligence (Current Focus)**
**Status**: In Progress - T-171 Starting  
**Duration**: 1-2 weeks  
**Priority**: HIGH

#### **Current Status Update (January 2025)**
- ✅ T-170 MetaMap Foundation completed successfully
- ✅ Authentication middleware fixed and working
- ✅ Development server running on localhost:3001
- ✅ T-171 Auto-Categorization Service implemented

#### **T-171 Implementation Completed**
- ✅ Technology Categorization Worker with OpenAI integration
- ✅ Enhanced POST /api/assets/categorize endpoint (sync + async)
- ✅ Categorization Service with queue management
- ✅ Background processing with BullMQ
- ✅ Fallback to rule-based categorization
- ✅ Event system integration
- ✅ Contract test suite created

#### **T-171: Asset Auto-Categorization Service (Week 1)**
```yaml
Implementation:
  - AI-powered categorization service using OpenAI
  - POST /api/assets/categorize endpoint
  - technologyCategorizationWorker for background processing
  - Auto-confidence scoring and insights generation

Success Criteria:
  - "Add Tesla" → Auto-categorized as "ROBOTICS_PHYSICAL_AI" with 88% confidence
  - Categorization accuracy >90% on test portfolio
  - Insights like "Tesla derives 80% value from robotics/AI capabilities"

Technical Approach:
  - Leverage existing contextAssemblyService for asset analysis
  - Use theme→card data for sophisticated categorization
  - Store results in Asset.category, categoryConfidence, categoryInsights
  - Queue-based processing with BullMQ
```

#### **T-172: Portfolio Insight Generation (Week 2)**
```yaml
Implementation:
  - portfolioInsightWorker for concentration analysis
  - GET /api/matrix/insights endpoint for portfolio intelligence
  - Technology exposure calculations across categories
  - Risk concentration detection and alerting

Success Criteria:
  - "Your portfolio is 65% AI-exposed" insights generated
  - Concentration risk detection ("High AI concentration risk")
  - Technology timeline impact analysis
  - Automated insight refresh on portfolio changes

Output Examples:
  - "Portfolio has 60% AI/Compute exposure, 20% robotics potential"
  - "Tesla represents 25% of robotics exposure - consider diversification"
  - "High vulnerability to AI regulation scenarios"
```

### **📋 Phase 6c: Enhanced Matrix Intelligence (Weeks 3-4)**
**Status**: Planned  
**Duration**: 2 weeks

#### **T-173: Technology-Focused Matrix Analysis**
```yaml
Enhancement Focus:
  - Technology scenario impact calculation refinement
  - Timeline-adjusted scoring (short-term vs long-term impacts)
  - Category-specific analysis algorithms
  - Confidence-weighted portfolio aggregation

New Capabilities:
  - "Physical AI scenarios affect robotics assets with 3x multiplier"
  - "Timeline analysis: 2-5 year impacts vs 5-10 year projections"
  - "Quantum threat detection for crypto and security assets"
```

#### **T-174: Guided Workflow Implementation**
```yaml
UI Workflows:
  - /assets/build - Guided asset creation using themes
  - /scenarios/build - Technology scenario modeling interface
  - /insights/explore - Deep-dive insight analysis
  - Progressive complexity (Simple → Advanced modes)

User Experience:
  - 3-click portfolio analysis workflow
  - Contextual help and guided tours
  - Insight explanation with evidence links
  - Export and sharing capabilities
```

## 📈 **Updated Phase Delivery Timeline**

| Week | Phase | Deliverables | Success Metrics |
|------|--------|--------------|-----------------|
| ✅ **Week 1** | **MetaMap Foundation** | ✅ Technology scenarios, real data, schema | Dashboard shows real tech scenarios |
| ✅ **Week 2** | **Auto-Categorization** | ✅ AI categorization service, confidence scoring | >90% categorization accuracy |
| 📋 **Week 3** | **Portfolio Insights** | Concentration analysis, exposure insights | "65% AI-exposed" insights |
| 📋 **Week 4** | **Enhanced Matrix** | Technology-focused impact calculations | Timeline-adjusted impact scores |
| 📋 **Week 5** | **Workflow Polish** | Guided UI, 3-click experience | <2min to insights |

## 🎯 **Current Priority Queue**

### **⚡ IMMEDIATE (This Week)**
1. **Fix Clerk Middleware** (1 day) - Authentication for API endpoints  
2. **T-171: Auto-Categorization Service** (3-4 days)
   - AI categorization with confidence scoring
   - Background worker for processing
   - API endpoint for manual categorization

### **🔥 HIGH PRIORITY (Next Week)**  
3. **T-172: Portfolio Insight Generation** (4-5 days)
   - Technology exposure analysis
   - Concentration risk detection  
   - Insight generation engine

### **📊 MEDIUM PRIORITY (Week 3-4)**
4. **T-173: Enhanced Matrix Intelligence** (5-6 days)
   - Technology-focused impact calculations
   - Timeline analysis refinement
5. **T-174: UI Workflow Polish** (3-4 days)  
   - Guided asset/scenario building
   - 3-click workflow implementation

## 🎪 **The MetaMap Promise - PROGRESS UPDATE**

**BEFORE MetaMap (Research Workspace Era)**: 
"I need to research Tesla's exposure to AI disruption..."
→ 30 minutes of theme creation, card entry, chunk analysis, matrix setup

**CURRENT MetaMap (Post T-171)**:
"Add Tesla" → Auto-categorized as "ROBOTICS_PHYSICAL_AI" (88% confidence) → Shows in technology dashboard → Matrix displays impact scores
→ **5 minutes** (major improvement with AI categorization)

**TARGET MetaMap (Post T-171 + T-172)**:
"Add Tesla" → *Auto-categorizes as Robotics/Physical AI* → Matrix shows calculated impact → "Tesla is 80% robotics play" insight generated
→ **2 minutes total** 🎯

**Current Progress**: **25% Complete** towards the MetaMap vision
- ✅ Technology foundation established
- ✅ Real data flowing to dashboard  
- ⏳ Auto-categorization next
- ⏳ Insight generation following 