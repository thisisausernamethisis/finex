# Finex v3 Technical Reference

This document consolidates technical implementation details, database schemas, and architecture patterns from across the Finex v3 codebase.

---

## 🏗️ **Current Architecture Overview**

### **Technology Stack**
| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14 App Router, Shadcn UI, Tailwind CSS | Modern React patterns |
| **API** | Next.js API routes (Node 18) | Edge-safe code in `/edge/` |
| **Authentication** | Clerk | JWT in Authorization header |
| **Database** | Prisma 5, PostgreSQL (Neon), pgvector | Pooled connections |
| **Background Jobs** | BullMQ + Redis 7 | Workers in `/workers/` |
| **AI Integration** | OpenAI/Anthropic APIs | Keys from `.env` |
| **Search** | Hybrid keyword + vector via raw SQL | RRF (k = 60) |
| **Testing** | Vitest/Jest, Playwright, RAGAS | Contract tests required |

### **Repository Structure**
```
finex_v3/
├── app/
│   ├── (auth)/              # Protected routes (from modernization)
│   ├── api/                 # API endpoints
│   │   ├── assets/
│   │   ├── scenarios/
│   │   ├── matrix/
│   │   └── events/          # SSE endpoint
│   ├── dashboard/           # Main UI
│   └── advanced/            # Complex features
├── components/
│   ├── ui/                  # Shadcn design system
│   ├── modals/              # CRUD modals (from UX enhancement)
│   └── [feature]/           # Feature-specific components
├── lib/
│   ├── services/            # Business logic services
│   ├── hooks/               # React Query hooks (from modernization)
│   └── events/              # Event emitter for SSE
├── workers/                 # Background job processors
├── prisma/                  # Database schema and migrations
└── docs/                    # All documentation
```

---

## 🗄️ **Database Schema Reference**

### **Core Models**

#### **Asset Model** (Enhanced from UX project)
```typescript
interface Asset {
  id: string;
  name: string;
  description?: string;
  
  // Financial fields
  growthValue?: number;               // Growth percentage/value
  
  // Template system (from UX enhancement)
  kind: AssetKind;                   // REGULAR | TEMPLATE
  sourceTemplateId?: string;         // Reference to template
  
  // Technology categorization (from UX enhancement)
  category?: TechnologyCategory;     // AI_COMPUTE, ROBOTICS_PHYSICAL_AI, etc.
  categoryConfidence?: number;       // 0.0-1.0 confidence score
  categoryInsights?: any;            // JSON AI-generated insights
  
  // Access control
  userId: string;
  isPublic: boolean;
  
  // Relationships
  themes: Theme[];
  matrixResults: MatrixAnalysisResult[];
  accesses: AssetAccess[];
  
  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum TechnologyCategory {
  AI_COMPUTE = "AI_COMPUTE"
  ROBOTICS_PHYSICAL_AI = "ROBOTICS_PHYSICAL_AI"
  QUANTUM_COMPUTING = "QUANTUM_COMPUTING"
  BIOTECH_HEALTH = "BIOTECH_HEALTH"
  FINTECH_CRYPTO = "FINTECH_CRYPTO"
  ENERGY_CLEANTECH = "ENERGY_CLEANTECH"
  SPACE_DEFENSE = "SPACE_DEFENSE"
  TRADITIONAL_TECH = "TRADITIONAL_TECH"
  OTHER = "OTHER"
}
```

#### **Scenario Model** (Enhanced from UX project)
```typescript
interface Scenario {
  id: string;
  name: string;
  description?: string;
  
  // Scenario classification (from UX enhancement)
  type?: ScenarioType;              // TECHNOLOGY | ECONOMIC | GEOPOLITICAL
  timeline?: string;                // "2-5 years", "5-10 years"
  probability?: number;             // 0.0-1.0 probability score
  
  // Access control
  userId: string;
  isPublic: boolean;
  
  // Relationships
  themes: Theme[];
  matrixResults: MatrixAnalysisResult[];
  
  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

enum ScenarioType {
  TECHNOLOGY = "TECHNOLOGY"
  ECONOMIC = "ECONOMIC"
  GEOPOLITICAL = "GEOPOLITICAL"
}
```

#### **Matrix Analysis Model**
```typescript
interface MatrixAnalysisResult {
  id: string;
  assetId: string;
  scenarioId: string;
  
  // Analysis results
  impactScore: number;              // -5 to +5 impact rating
  growthProjection?: number;        // Projected growth percentage
  riskAssessment?: number;          // Risk factor (0.0-1.0)
  confidenceScore?: number;         // Analysis confidence (0.0-1.0)
  
  // AI insights
  reasoning?: string;               // AI-generated explanation
  evidence?: any;                   // Supporting evidence (JSON)
  
  // Job tracking
  jobId?: string;                   // BullMQ job identifier
  status: string;                   // 'pending' | 'completed' | 'failed'
  
  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### **Theme-Card-Chunk Hierarchy**
```typescript
// Complex evidence capture system (preserved from original)
interface Theme {
  id: string;
  name: string;
  description?: string;
  category: string;
  themeType: ThemeType;            // STANDARD | GROWTH | PROBABILITY
  
  // Parent relationship (exclusive)
  assetId?: string;                // Either belongs to asset
  scenarioId?: string;             // Or belongs to scenario
  
  // Value calculation
  calculatedValue?: number;        // AI-computed value
  manualValue?: number;            // User override
  useManualValue: boolean;         // Use manual vs calculated
  
  cards: Card[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface Card {
  id: string;
  title: string;
  content: string;                 // Rich text content
  importance?: number;             // 1-5 importance rating
  source?: string;                 // Source URL or reference
  
  themeId: string;
  theme: Theme;
  chunks: Chunk[];                 // For vector search
  
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface Chunk {
  id: string;
  content: string;                 // Chunked content for embeddings
  embedding?: number[];            // Vector embedding
  cardId: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

---

## 🔄 **Background Job System**

### **Worker Architecture**
The system uses BullMQ for background processing with Redis as the message broker.

#### **Matrix Analysis Worker**
```typescript
// workers/matrixWorker.ts
interface MatrixJob {
  assetId: string;
  scenarioId: string;
  userId: string;
}

// Processes asset vs scenario impact analysis
// Emits SSE events for real-time updates
// Uses AI to generate impact scores and reasoning
```

#### **Growth Analysis Worker**
```typescript
// workers/growthWorker.ts
interface GrowthJob {
  assetId: string;
  timeframe?: string;
}

// Analyzes growth projections for assets
// Considers technology trends and market factors
// Updates asset growthValue field
```

#### **Technology Categorization Worker**
```typescript
// workers/technologyCategorizationWorker.ts
interface CategorizationJob {
  assetId: string;
  assetName: string;
  description?: string;
}

// Auto-categorizes assets into technology verticals
// Generates confidence scores and insights
// Updates asset category fields
```

---

## 🌐 **API Endpoints Reference**

### **Asset Management**
```typescript
// Complete CRUD operations (from UX enhancement)
GET    /api/assets              // List with pagination, search, filtering
POST   /api/assets              // Create with full validation
GET    /api/assets/[id]         // Individual asset details
PUT    /api/assets/[id]         // Update with access control
DELETE /api/assets/[id]         // Delete with cascade protection

// Template operations
POST   /api/assets/[id]/template // Convert asset to template
GET    /api/templates           // List available templates
```

### **Scenario Management**
```typescript
// Complete CRUD operations (from UX enhancement)
GET    /api/scenarios           // List with type filtering
POST   /api/scenarios           // Create with validation
GET    /api/scenarios/[id]      // Individual scenario details
PUT    /api/scenarios/[id]      // Update with validation
DELETE /api/scenarios/[id]      // Delete with impact checks

// Technology scenarios
GET    /api/scenarios/technology // Technology scenario templates
```

### **Matrix Analysis**
```typescript
GET    /api/matrix              // Matrix analysis results
POST   /api/matrix/analyze      // Trigger matrix analysis job
GET    /api/matrix/insights     // Portfolio insights and concentrations
```

### **Real-time Updates**
```typescript
GET    /api/events              // SSE endpoint for job status updates
```

---

## 🎨 **UI Component System**

### **Enhanced Components** (from UX enhancement)
```typescript
// Professional CRUD modals
AssetEditModal.tsx              // Complete asset editing
AssetDeleteModal.tsx            // Safe deletion with confirmation
AssetTemplateModal.tsx          // Asset-to-template conversion
ScenarioEditModal.tsx           // Scenario management
ScenarioDeleteModal.tsx         // Scenario deletion

// UI Foundations
components/ui/dropdown-menu.tsx // Action menus
components/ui/dialog.tsx        // Modal system
components/ui/toast.tsx         // Notifications
components/ui/skeleton.tsx      // Loading states
```

### **Data Display Patterns**
```typescript
// Card layouts with professional styling
- Technology category badges with semantic colors
- Confidence meters (e.g., "87% AI/Compute")
- Growth indicators with formatted values
- Probability displays with color coding
- Action dropdowns (Edit/Delete/Template)
```

---

## 🔐 **Authentication & Access Control**

### **Clerk Integration**
```typescript
// Authentication flow
- JWT tokens in Authorization headers
- User context available in all API routes
- Automatic token refresh handling
- Sign-in/sign-up pages with Clerk components
```

### **RBAC System**
```typescript
// AssetAccess model for granular permissions
interface AssetAccess {
  id: string;
  assetId: string;
  userId: string;
  accessLevel: AccessLevel;      // VIEWER | EDITOR | ADMIN
  grantedBy: string;             // User who granted access
  createdAt: DateTime;
}

// SSE events filtered by user permissions
// Public/private asset and scenario sharing
```

---

## 🚀 **Server-Sent Events (SSE)**

### **Real-time Job Updates**
```typescript
// SSE endpoint: /api/events
interface JobEvent {
  type: 'matrix' | 'growth' | 'probability';
  jobId: string;
  status: 'queued' | 'started' | 'completed' | 'failed';
  timestamp: string;
  data?: Record<string, any>;
}

// Features:
- Authentication required
- RBAC event filtering
- Connection heartbeat (30s)
- Auto-reconnection handling
- Prometheus metrics
```

### **Client Integration**
```javascript
// Browser EventSource connection
const eventSource = new EventSource('/api/events');
eventSource.onmessage = (event) => {
  const jobEvent = JSON.parse(event.data);
  // Update UI based on job status
};
```

---

## 🧪 **Testing Strategy**

### **Test Types**
```typescript
// Contract tests (must pass for acceptance)
tests/contract/              // API contract validation
tests/unit/                  // Unit tests for services
tests/e2e/                   // End-to-end Playwright tests

// Specialized testing
tests/ragas/                 // AI quality evaluation
```

### **Key Testing Patterns**
- API endpoint contract validation
- Worker job processing verification
- Authentication and authorization testing
- Database migration testing
- SSE connection and event delivery

---

## 📊 **Performance Considerations**

### **Database Optimization**
- Pooled connections (`?pgbouncer=true`)
- Vector search with pgvector extension
- Proper indexing on foreign keys
- Pagination for large result sets

### **Frontend Performance**
- React Query caching (from modernization plan)
- Component code splitting
- Optimistic updates for mutations
- Skeleton loading states

### **Background Jobs**
- BullMQ concurrency controls
- Job priority and delay handling
- Redis memory optimization
- Worker failure recovery

---

## 🔧 **Development Workflow**

### **Quick Commands**
```bash
# Development
make dev                    # Full stack with UI + API + workers
npm run test:contract       # Contract tests (must pass)
make api                    # Generate OpenAPI routes
make db:seed               # Seed deterministic data
act -j ci                  # Verify CI locally

# Database
npx prisma migrate dev      # Apply migrations
npx prisma studio          # Database GUI
npx prisma generate         # Update Prisma client
```

### **Environment Setup**
```bash
# Required environment variables
DATABASE_URL=               # Pooled connection string
DIRECT_URL=                 # Direct connection for migrations
CLERK_SECRET_KEY=           # Clerk authentication
OPENAI_API_KEY=            # AI integration
REDIS_URL=                 # BullMQ job queue
```

---

This technical reference provides the complete foundation for understanding the current Finex v3 architecture and serves as a complement to the Frontend Modernization roadmap. 