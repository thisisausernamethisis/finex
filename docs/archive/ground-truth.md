# MetaMap • Single‑Source‑of‑Truth

> **Technology Disruption Analysis Tool**  
> For autonomous coding agents

## 0 · Quick‑start TL;DR

| Action | Command / File |
|--------|---------------|
| Spin up full stack (UI + API + workers + mocks) | `make dev` |
| Run the machine‑failing tests you must turn green | `npm run test:contract` |
| Generate all OpenAPI routes from spec | `make api` (uses openapi-generator-cli) |
| Seed deterministic fixture data | `make db:seed` |
| Verify CI passes locally | `act -j ci` |
| One task = one YAML in /tasks/ | Example: T‑003_implement_DELETE_asset.yml |

Green CI = deliverable accepted.
If any spec ambiguity remains, emit `CLARIFICATION NEEDED: …` and halt.

## 1 · Mission & Product

**MetaMap** is an AI‑powered technology disruption analysis tool that enables investment analysts to:

- **Auto-categorize assets** by technology vertical (AI/Compute, Robotics/Physical AI, Quantum, Traditional)
- **Analyze technology scenarios** ("AI Compute Breakthrough", "Physical AI Mass Adoption", "Quantum Viability")
- **Generate instant insights** ("Tesla is 80% robotics play", "Portfolio has 60% AI exposure")
- **View simplified matrix** of Technology Impact (-5…+5) vs Growth % vs Timeline
- **Discover tech concentrations** with automatic portfolio risk analysis

**Key Transformation**: From complex research workspace → Simple matrix analysis tool with maximum insight generation and minimum complexity.

**Target User**: Individual technology-focused investment analysts who need rapid disruption impact assessment.

Large‑language‑model pipelines (Retrieval‑Augmented Generation, "RAG") compute:

- **Technology categorization** per asset (auto-classification)
- **Impact per asset–scenario pair** (technology disruption focus)
- **Growth % per asset** with technology trend weighting
- **Probability % per scenario** (technology timeline assessment)  
- **Portfolio concentration insights** (exposure revelations)
- **Technology explanations** + linked evidence

**Preserved Sophistication**: All backend complexity (Themes→Cards→Chunks, workers, embeddings, hybrid search) remains but is hidden behind simplified interface.

## 2 · Operating Principles for Agents

**UI‑First → Contract‑First → Simplicity‑First**  
Implement backend only to satisfy the OpenAPI contract derived from the validated UI, but prioritize maximum simplicity in user experience while preserving technical sophistication.

**Phase‑locked (see §8)**  
Never start tasks from a future phase without an explicit new YAML.

**Fail‑fast tests drive acceptance**  
Every endpoint & worker has a failing Jest test stub. Your job: make them pass while keeping contract unchanged.

**Ask before guessing**  
Emit `CLARIFICATION NEEDED:` once per ambiguity—no silent assumptions.

**Hide Complexity, Surface Insights**  
Complex evidence capture (Themes→Cards→Chunks) remains in backend but is hidden from primary user interface. Focus on auto-generated insights and simple matrix views.

## 3 · Tech Stack Snapshot

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 14 App Router · Shadcn UI · Tailwind v4 | **Simple matrix-focused interface** |
| API | Next.js API routes (Node 18) | edge‑safe code in /edge/ uses @prisma/client/edge |
| AuthN | Clerk | JWT in Authorization header for server calls |
| ORM / DB | Prisma 5 · PostgreSQL (Neon) · pgvector | pooled connection string must be used (?pgbouncer=true…) |
| Background | BullMQ + Redis 7 | workers live in /workers/ |
| AI | OpenAI / Anthropic APIs | keys from .env |
| Search | Hybrid keyword + vector via raw SQL ($queryRaw) | uses RRF (k = 60) |
| CI | GitHub Actions (.github/workflows/ci.yml) | lint → type → unit → contract → E2E |
| Tests | Vitest/Jest · Playwright · RAGAS | |

## 4 · Repository Layout

```
/
├─ app/
│   ├─ dashboard/          ← **Simple matrix interface**
│   ├─ api/
│   │   ├─ assets/
│   │   │   └─ categorize/ ← **NEW: Auto-categorization endpoint**
│   │   ├─ scenarios/
│   │   │   └─ technology/ ← **NEW: Tech scenario templates**
│   │   └─ matrix/
│   │       └─ insights/   ← **NEW: Portfolio insights**
│   └─ advanced/           ← Complex features for power users
├─ prisma/
│   ├─ schema.prisma       ← **Enhanced with ScenarioType, Asset.category**
│   └─ seed.ts             ← **Technology scenarios + categorized assets**
├─ lib/
│   ├─ services/
│   │   ├─ accessControlService.ts
│   │   ├─ growthRiskService.ts
│   │   ├─ searchService.ts
│   │   ├─ contextAssemblyService.ts
│   │   └─ categorizationService.ts  ← **NEW: Asset tech categorization**
│   └─ hooks/
├─ workers/
│   ├─ matrixWorker.ts
│   ├─ growthWorker.ts
│   ├─ probabilityWorker.ts
│   ├─ technologyCategorizationWorker.ts  ← **NEW: Asset intelligence**
│   └─ portfolioInsightWorker.ts          ← **NEW: Portfolio analysis**
├─ openapi/
│   └─ finex.yaml          ← **authoritative contract (enhanced)**
├─ tests/
│   ├─ contract/…          ← MUST PASS
│   ├─ unit/…
│   └─ e2e/…
├─ tasks/                  ← YAML task manifests (one per ticket)
└─ docs/
    ├─ runbooks/…
    └─ metamap-transformation-analysis.md  ← **Transformation plan**
```

## 5 · Database Enhanced Schema (Prisma)

Always migrate via `prisma migrate dev` using DIRECT_URL locally and pooled DATABASE_URL in runtime.

```prisma
enum AssetKind { REGULAR TEMPLATE }

enum ScenarioType { 
  TECHNOLOGY
  ECONOMIC  
  GEOPOLITICAL 
}

model Asset {
  id              String   @id @default(cuid())
  name            String
  description     String?
  growthValue     Float?
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String
  kind            AssetKind @default(REGULAR)
  sourceTemplateId String?
  category        String?   // "AI/Compute", "Robotics/Physical AI", "Quantum", "Traditional"
  insights        String?   // AI-generated technology insights (JSON)
  themes          Theme[]
  matrixResults   MatrixAnalysisResult[]
  accesses        AssetAccess[]
  isPublic        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Scenario {
  id          String @id @default(cuid())
  name        String
  description String?
  type        ScenarioType @default(TRADITIONAL)  // NEW: Scenario categorization
  timeline    String?                             // NEW: "2-5 years", "5-10 years"
  probability Float?
  themes      Theme[]
  matrixResults MatrixAnalysisResult[]
}

model ThemeTemplate {
  id          String   @id @default(cuid())
  ownerId     String
  name        String
  description String?
  payload     Json      // serialised Theme + Card structure
  isPublic    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum ThemeType { STANDARD GROWTH PROBABILITY }

model Theme {
  id            String   @id @default(cuid())
  name          String
  description   String?
  category      String   @default("Default")
  themeType     ThemeType @default(STANDARD)
  assetId       String?
  scenarioId    String?
  calculatedValue Float?
  manualValue     Float?
  useManualValue  Boolean @default(false)
  cards         Card[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@check(name: "owner_oneof", 
     "(\"assetId\" IS NOT NULL) <> (\"scenarioId\" IS NOT NULL)")
}

model Card {
  id        String @id @default(cuid())
  title     String
  content   String   @db.Text
  importance Int?    @default(1)
  source    String?
  theme     Theme @relation(fields: [themeId], references: [id], onDelete: Cascade)
  themeId   String
  chunks    Chunk[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Chunk {
  id        String @id @default(cuid())
  content   String @db.Text
  order     Int
  embedding Unsupported("vector(1536)")
  card      Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  cardId    String
}

model MatrixAnalysisResult {
  id          String   @id @default(cuid())
  assetId     String
  scenarioId  String
  impact      Int      // −5…+5
  summary     String?
  evidenceIds String
  status      String   @default("pending")
  error       String?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([assetId, scenarioId])
}
```

## 6 · Enhanced OpenAPI Contract

```yaml
openapi: 3.1.0
info:
  title: MetaMap API
  version: "0.2.0"
  description: "Technology disruption analysis tool API"
servers:
  - url: /api
paths:
  /assets:
    get:
      summary: List assets
      security: [ { BearerAuth: [] } ]
      responses:
        "200":
          description: List
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PaginatedAssets"
    post:
      summary: Create asset
      security: [ { BearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/AssetCreate" }
      responses:
        "201": { description: Created, content: { application/json: { schema: { $ref: "#/components/schemas/Asset" } } } }

  /assets/categorize:  # NEW ENDPOINT
    post:
      summary: Auto-categorize asset by technology vertical
      security: [ { BearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                assetId: { type: string }
      responses:
        "202": { description: Categorization job queued }

  /scenarios/technology:  # NEW ENDPOINT
    get:
      summary: Get technology scenario templates
      security: [ { BearerAuth: [] } ]
      responses:
        "200":
          description: Technology scenarios
          content:
            application/json:
              schema:
                type: array
                items: { $ref: "#/components/schemas/TechnologyScenario" }

  /matrix/insights:  # NEW ENDPOINT
    get:
      summary: Get portfolio technology insights
      security: [ { BearerAuth: [] } ]
      responses:
        "200":
          description: Portfolio insights
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PortfolioInsights"

  /dashboard/simple:  # NEW ENDPOINT
    get:
      summary: Get simplified dashboard data
      security: [ { BearerAuth: [] } ]
      responses:
        "200":
          description: Dashboard data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SimpleDashboardData"

components:
  schemas:
    TechnologyScenario:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        type: { type: string, enum: [TECHNOLOGY, ECONOMIC, GEOPOLITICAL] }
        timeline: { type: string }
        probability: { type: number }
        category: { type: string }

    PortfolioInsights:
      type: object
      properties:
        concentrations: 
          type: array
          items:
            type: object
            properties:
              category: { type: string }
              percentage: { type: number }
              risk: { type: string }
        revelations:
          type: array
          items:
            type: object
            properties:
              asset: { type: string }
              insight: { type: string }
              confidence: { type: number }
```

## 7 · Enhanced Services & Algorithms

```typescript
// lib/services/categorizationService.ts
export async function categorizeAsset(assetName: string, context?: string): Promise<{
  category: string;
  confidence: number;
  insights: string[];
}>;

// lib/services/portfolioInsightService.ts
export async function generatePortfolioInsights(userId: string): Promise<{
  concentrations: TechConcentration[];
  revelations: AssetRevelation[];
  risks: ConcentrationRisk[];
}>;

// lib/services/technologyScenarioService.ts
export async function getTechnologyScenarios(): Promise<TechnologyScenario[]>;
export async function matchScenariosToAsset(assetCategory: string): Promise<string[]>;

// Enhanced existing services
export async function assembleMatrixContext(
  assetId: string, scenarioId: string, tokenLimit: number
): Promise<string>

export async function hybridSearch(opts: {
  query: string
  assetId?: string
  scenarioId?: string
  technologyCategory?: string  // NEW: Filter by tech category
  limit?: number
}): Promise<Array<{ id: string; score: number }>>
```

## 8 · Enhanced Phased Road‑map & Task Seeds

| Phase | Status | Key deliverables | Next Actions |
|-------|--------|------------------|--------------|
| **0 – UX Foundation** | **✅ COMPLETED** | **MetaMapper design integration, navigation, matrix grids, discovery cards** | **All MetaMap UI components implemented** |
| **1 – Backend Foundation** | **✅ COMPLETED** | **Database schema, repositories, core API routes, authentication** | **Database seeded, APIs working, tests passing** |
| **2 – Technology Intelligence** | **✅ COMPLETED** | **Asset categorization, portfolio insights, technology endpoints** | **Auto-categorization API, insight generation** |
| **3 – AI Processing Pipeline** | **✅ COMPLETED** | **Enhanced vector search, matrix analysis engine, real LLM integration** | **Production-ready AI pipeline with prompt templates** |
| 4 – Real-time Analysis Pipeline | 🚧 IN PROGRESS | WebSocket/SSE, streaming results, job optimization | T‑112_sse_endpoint.yml |
| 5 – Template Library & Sharing | 📋 PLANNED | RBAC enforcement, template publishing, collaboration | T‑165_template_library_ui_stub.yml |
| 6 – Production Optimization | 📋 PLANNED | RAGAS evaluation, performance monitoring, cost optimization | T‑130_ragas_ci_job.yml |

### **✅ Phase 3: AI Processing Pipeline - COMPLETED**

#### **✅ Milestone 3.1: Enhanced Vector Search & Embeddings**
- **T-029 ✅**: Chunking Service Implementation
  - Intelligent sentence-boundary chunking with overlap
  - Quality scoring and keyword extraction
  - Context preservation for AI processing
- **T-030 ✅**: Embedding Service Implementation  
  - Mock service with OpenAI-compatible architecture
  - 1536-dimensional embeddings ready for pgvector
  - Batch processing and similarity search
- **T-031 ✅**: Hybrid Search Service Implementation
  - Reciprocal Rank Fusion (RRF) algorithm
  - Technology category filtering
  - Portfolio-based content recommendations
- **T-032 ✅**: Context Assembly Service Implementation
  - Matrix analysis context with evidence prioritization
  - Token limit management and intelligent truncation
  - Multi-source evidence assembly

#### **✅ Milestone 3.2: Matrix Analysis Engine**
- **T-033 ✅**: Matrix Analysis Worker Implementation
  - Single and batch analysis capabilities
  - Sophisticated impact scoring with AI integration
  - Confidence assessment and evidence summarization
- **T-034 ✅**: Evidence Assembly Enhancement
  - Multi-dimensional evidence scoring
  - Temporal decay factors and source credibility
  - Priority grouping (Critical/Important/Supporting)
- **T-035 ✅**: Confidence Scoring System
  - 6-dimensional confidence assessment
  - Uncertainty quantification with bounds
  - Quality grading with actionable recommendations

#### **✅ Milestone 3.3: Prompt Templates & LLM Integration**
- **Prompt Template Service ✅**: All documented templates implemented
  - `ImpactExplain`: Scenario→Asset impact assessment
  - `ThemeSummary`: Card synthesis with citations
  - `BoardSummary`: Cross-theme macro analysis
- **LLM Completion Service ✅**: Production OpenAI integration
  - Retry logic with exponential backoff
  - JSON response validation and parsing
  - Cost estimation and health checking
- **Enhanced Matrix Analysis ✅**: Real AI vs. heuristic fallback
  - OpenAI GPT-4 integration for impact calculation
  - Structured prompt formatting with evidence
  - Confidence-aware analysis with LLM reasoning

### **🚧 Phase 4: Real-time Analysis Pipeline - IN PROGRESS**

#### **📋 Milestone 4.1: Server-Sent Events & Real-time Updates**
- **T-112**: SSE Endpoint Implementation
  - Real-time job status updates via Server-Sent Events
  - Authentication and connection management
  - Event filtering by job type and user access
- **T-113**: WebSocket Integration (Alternative/Additional)
  - Bidirectional real-time communication
  - Live collaboration features
  - Progressive analysis streaming

#### **📋 Milestone 4.2: Job Queue Optimization**
- **T-114**: Enhanced Worker Management
  - Dynamic worker scaling based on load
  - Priority queues for urgent analysis
  - Dead letter queue management
- **T-115**: Streaming Analysis Results
  - Progressive result delivery as analysis proceeds
  - Partial confidence updates during processing
  - Real-time evidence discovery feedback

#### **📋 Milestone 4.3: Performance & Monitoring**
- **T-116**: Analysis Performance Optimization
  - Parallel evidence gathering and ranking
  - Context assembly optimization
  - LLM call batching and caching
- **T-117**: Real-time Metrics & Monitoring
  - Live analysis performance dashboards
  - Queue health monitoring
  - Cost tracking and optimization alerts

## 9 · Enhanced Validation & Testing

- **Unit**: services & utilities (Vitest) + **technology categorization accuracy tests**.
- **Contract**: Jest generates calls from openapi/finex.yaml and asserts status + schema + **technology endpoint compliance**.
- **E2E**: Playwright seeds DB, logs in via Clerk test user, exercises UI flows + **simplified matrix workflow**.
- **RAG**: npm run rag:eval produces CSV of precision/recall/faithfulness for 50 curated Q‑A + **technology insight accuracy**.
- **MetaMap UX**: Time-to-insight < 2 minutes, 3-click portfolio analysis.
- **CI** (.github/workflows/ci.yml) must stay green.

## 10 · Security & Quality Gates

- All mutations must pass zodParse(bodySchema).
- Edge routes must use @prisma/adapter-neon and never fs.
- Rate‑limit per‑IP (/middleware/rateLimit.ts placeholder).
- Never store secrets in code – environment variables only.
- Coverage target ≥ 80 % lines for lib/services & API routes.
- Worker-job prompt budgets: Theme ≤400 tokens, Board ≤300 tokens, Impact ≤500 tokens, **Technology Categorization ≤600 tokens**.
- JSON outputs (ImpactExplain, **TechnologyInsight**) must pass schema validation ≥99.5 % and RAGAS faithfulness ≥0.8.

## 11 · Enhanced Seed Data (prisma/seed.ts)

```typescript
// Technology-focused assets
await prisma.asset.create({
  data: {
    name: 'NVIDIA',
    category: 'AI/Compute',
    insights: JSON.stringify({
      primary: "Leading AI compute infrastructure provider",
      secondary: "85% revenue from data center AI chips",
      disruption_exposure: "High positive exposure to AI advancement"
    }),
    userId,
    themes: {
      create: [
        { name: 'Growth', themeType: 'GROWTH', manualValue: 25.0 },
        { name: 'AI Compute Leadership' }
      ]
    }
  }
})

await prisma.asset.create({
  data: {
    name: 'Tesla',
    category: 'Robotics/Physical AI',
    insights: JSON.stringify({
      primary: "Electric vehicle + robotics/AI company", 
      secondary: "80% future value from robotics and AI",
      disruption_exposure: "High exposure to physical AI adoption"
    }),
    userId,
    themes: {
      create: [
        { name: 'Growth', themeType: 'GROWTH', manualValue: 18.5 },
        { name: 'Robotics/FSD Development' }
      ]
    }
  }
})

// Technology scenarios
await prisma.scenario.create({
  data: {
    name: 'AI Compute Breakthrough',
    type: 'TECHNOLOGY',
    timeline: '2-5 years',
    description: 'Major advancement in AI training efficiency',
    probability: 0.4,
    themes: {
      create: [
        { name: 'Technology Impact Analysis' },
        { name: 'Probability', themeType: 'PROBABILITY', manualValue: 40.0 }
      ]
    }
  }
})

await prisma.scenario.create({
  data: {
    name: 'Physical AI Mass Adoption', 
    type: 'TECHNOLOGY',
    timeline: '3-7 years',
    description: 'Widespread robotics deployment in industry',
    probability: 0.6,
    themes: {
      create: [
        { name: 'Robotics Deployment Impact' },
        { name: 'Probability', themeType: 'PROBABILITY', manualValue: 60.0 }
      ]
    }
  }
})
```

Running `make db:seed` must leave the Matrix page fully populated with **technology-focused scenarios and categorized assets**.

## 12 · User Journey Transformation

### **FROM (Complex - 6 steps):**
1. Authentication → 2. Asset Management → 3. Evidence Capture (Themes→Cards→Chunks) → 4. Scenario Planning → 5. AI Analysis → 6. Team Collaboration

### **TO (Simple - 3 steps):**
1. **Add Assets** → Auto-categorization reveals "Tesla is Robotics/Physical AI"
2. **Analyze Matrix** → Simple grid shows technology disruption impacts  
3. **Get Insights** → "Portfolio has 60% AI exposure, 20% robotics risk"

### **Hidden Sophistication:**
- Themes→Cards→Chunks processing happens automatically
- Complex evidence capture available in `/advanced` route
- Team features available but not primary workflow
- All technical sophistication preserved in backend

## 13 · Success Metrics

### **UX Simplification:**
- Time to first insight: < 2 minutes
- Steps to analyze portfolio: 3 clicks
- Learning curve: < 5 minutes

### **Technology Intelligence:**
- Auto-categorization accuracy: > 90%
- Insight relevance: > 85% user approval  
- Technology exposure detection: 100% coverage

### **Performance:**
- Matrix load time: < 2 seconds
- Auto-categorization: < 30 seconds
- Insight generation: < 60 seconds

## 14 · Environment template (.env.example)

```env
DATABASE_URL="postgres://user:pass@neon.db.../finex?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgres://user:pass@neon.db.../finex"
OPENAI_API_KEY="sk-..."
CLERK_SECRET_KEY="sk_..."
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## 15 · FAQs for Agents

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| P1001 can't reach database in local tests | using pooled URL for migrations | set DIRECT_URL env & run prisma migrate dev |
| MaxListenersExceededWarning from BullMQ | forgot setMaxListeners(0) after adding N workers/tests | update queueEvents.setMaxListeners(0) in worker bootstrap |
| Technology categorization failing | Missing AI context or token limits | Check OPENAI_API_KEY and increase categorization worker token budget |
| Portfolio insights empty | No categorized assets | Run asset categorization jobs first, check seed data |

## 16 · Definition of Done (per task)

- All referenced tests green.
- openapi/finex.yaml unchanged unless task says "modify contract".
- Lint & typecheck pass.
- No TODOs or console.log in changed lines.
- At least one new unit test when fixing a bug.
- **For MetaMap features**: UX simplicity verified, complex features properly hidden.

**MetaMap Transformation Principle**: 
> Preserve all technical sophistication, maximize user simplicity, surface automatic insights.

If anything above is ambiguous, output exactly:

```
CLARIFICATION NEEDED: <question>
```

Otherwise, run the failing tests, implement, commit, push, and we're done.

Happy shipping 🛫
