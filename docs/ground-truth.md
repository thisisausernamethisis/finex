# Finex Bot • Single‑Source‑of‑Truth

For autonomous coding agents

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

Finex Bot is an AI‑powered research workspace that lets analysts:

- curate Assets (e.g. $NVDA, US 10‑year, BTC),
- define Scenarios ("Global Recession", "China invades Taiwan", …),
- capture evidence in hierarchical Themes → Cards → Chunks,
- view a Matrix of Impact (−5…+5) vs Growth % vs Risk, and
- share templates with other analysts via the Template Library.

Large‑language‑model pipelines (Retrieval‑Augmented Generation, "RAG") compute:

- Impact per asset–scenario pair
- Growth % per asset
- Probability % per scenario
- Explanations + linked evidence

Multi‑user: sharing with RBAC (VIEWER, EDITOR, ADMIN).

## 2 · Operating Principles for Agents

**UI‑First → Contract‑First**  
Implement backend only to satisfy the OpenAPI contract derived from the validated UI (repo github.com/kiranism/next-shadcn-dashboard-starter forked to /frontend).

**Phase‑locked (see §8)**  
Never start tasks from a future phase without an explicit new YAML.

**Fail‑fast tests drive acceptance**  
Every endpoint & worker has a failing Jest test stub. Your job: make them pass while keeping contract unchanged.

**Ask before guessing**  
Emit `CLARIFICATION NEEDED:` once per ambiguity—no silent assumptions.

## 3 · Tech Stack Snapshot

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 14 App Router · Shadcn UI · Tailwind v4 | already validated |
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
├─ app/                ← Next.js pages & API routes
├─ prisma/
│   ├─ schema.prisma
│   └─ seed.ts
├─ lib/
│   ├─ services/
│   │   ├─ accessControlService.ts
│   │   ├─ growthRiskService.ts
│   │   ├─ searchService.ts
│   │   └─ contextAssemblyService.ts
│   └─ hooks/
├─ workers/
│   ├─ matrixWorker.ts
│   ├─ growthWorker.ts
│   └─ probabilityWorker.ts
├─ openapi/
│   └─ finex.yaml      ← **authoritative contract**
├─ tests/
│   ├─ contract/…      ← MUST PASS
│   ├─ unit/…
│   └─ e2e/…
├─ tasks/              ← YAML task manifests (one per ticket)
└─ docs/
    └─ runbooks/…
```

## 5 · Database Canonical Schema (Prisma)

Always migrate via `prisma migrate dev` using DIRECT_URL locally and pooled DATABASE_URL in runtime.

```prisma
enum AssetKind { REGULAR TEMPLATE }

model Asset {
  id              String   @id @default(cuid())
  name            String
  description     String?
  growthValue     Float?
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String
  kind            AssetKind @default(REGULAR)
  sourceTemplateId String?
  themes          Theme[]
  matrixResults   MatrixAnalysisResult[]
  accesses        AssetAccess[]
  isPublic        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
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

## 6 · OpenAPI Contract (excerpt)

```yaml
openapi: 3.1.0
info:
  title: Finex Bot API
  version: "0.1.0"
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
  /assets/{assetId}:
    get: …
    put: …
    delete: …
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Asset: …
    AssetCreate:
      type: object
      required: [name]
      properties:
        name: { type: string, maxLength: 100 }
        description: { type: string, maxLength: 500 }
    PaginatedAssets:
      type: object
      properties:
        items: { type: array, items: { $ref: "#/components/schemas/Asset" } }
        total: { type: integer }
        hasMore: { type: boolean }
```

The full file lives at [openapi/finex.yaml](../openapi/finex.yaml) and is the source of truth; regenerate TS types with `make api`.

## 7 · Services & Algorithms (only the signatures)

```typescript
// lib/services/accessControlService.ts
export function hasAssetAccess(
  userId: string, assetId: string, required: AccessRole
): Promise<boolean>

// lib/services/growthRiskService.ts
export async function updateAssetGrowthValue(assetId: string): Promise<void>

// lib/services/searchService.ts
export async function hybridSearch(opts: {
  query: string
  assetId?: string
  scenarioId?: string
  limit?: number
}): Promise<Array<{ id: string; score: number }>>

// lib/services/contextAssemblyService.ts
export async function assembleMatrixContext(
  assetId: string, scenarioId: string, tokenLimit: number
): Promise<string>

// lib/services/templateService.ts
export async function cloneAssetFromTemplate(
  templateId: string, userId: string
): Promise<string>

export async function cloneThemeTemplate(
  templateId: string, assetId: string, userId: string
): Promise<string>

export async function hasTemplateAccess(
  userId: string, templateId: string, role: AccessRole
): Promise<boolean>
```

NOTE: searchService executes two raw SQL queries (tsvector & pgvector) and fuses them via RRF.

## 8 · Phased Road‑map & Task Seeds

| Phase | Key deliverables | Example task YAML |
|-------|------------------|------------------|
| 1 – Auth + Base UI | Clerk integration, layout scaffold, seed data | T‑001_add_clerk_middleware.yml |
| 2 – UI Prototype + OpenAPI | All CRUD UI with mock data, openapi/finex.yaml, failing contract tests | T‑023_generate_openapi_stub.yml |
| 3 – DB + Core API | Prisma schema, /assets, /themes, /cards routes, pass contract tests | T‑041_implement_GET_assets.yml |
| 4 – AI Pipelines | chunking, embeddings, hybrid search, workers, analysis routes | T‑083_matrix_worker_basic.yml |
| 5 – Sharing + SSE | RBAC enforcement, share endpoints, SSE for job updates | T‑112_sse_endpoint.yml |
| 5b – Template Library | Template publishing, browsing, and cloning between analysts | T‑156_update_ground_truth_for_template_library.yml |
| 6 – Optimisation & RAG eval | RAGAS reports, performance budgets, cost guard, monitoring hooks | T‑130_ragas_ci_job.yml |

Each YAML contains:

```yaml
id: T-041
title: "Implement GET /assets (Phase 3)"
phase: 3
acceptance:
  - ci passes
  - openapi unchanged
  - tests/contract/assets.test.ts green
files_touched:
  - app/api/assets/route.ts
  - lib/repositories/assetRepository.ts
```

## 9 · Validation & Testing

- **Unit**: services & utilities (Vitest).
- **Contract**: Jest generates calls from openapi/finex.yaml and asserts status + schema.
- **E2E**: Playwright seeds DB, logs in via Clerk test user, exercises UI flows.
- **RAG**: npm run rag:eval produces CSV of precision/recall/faithfulness for 50 curated Q‑A.
- **CI** (.github/workflows/ci.yml) must stay green.

## 10 · Security & Quality Gates

- All mutations must pass zodParse(bodySchema).
- Edge routes must use @prisma/adapter-neon and never fs.
- Rate‑limit per‑IP (/middleware/rateLimit.ts placeholder).
- Never store secrets in code – environment variables only.
- Coverage target ≥ 80 % lines for lib/services & API routes.
- Worker-job prompt budgets: Theme ≤400 tokens, Board ≤300 tokens, Impact ≤500 tokens.
- JSON outputs (ImpactExplain) must pass schema validation ≥99.5 % and RAGAS faithfulness ≥0.8.

## 11 · Seed Data (prisma/seed.ts)

```typescript
await prisma.asset.create({
  data: {
    name: 'NVIDIA',
    userId,
    themes: {
      create: [
        { name: 'Growth', themeType: 'GROWTH', manualValue: 25.0 },
        { name: 'Default Theme' }
      ]
    }
  }
})
// … Tesla, Bitcoin, scenarios, cards, chunks …

// DEMO TEMPLATE ASSET
```

Running `make db:seed` must leave the Matrix page fully populated.

## 12 · Runbooks & Monitoring (stubs)

- [docs/runbooks/worker.md](./runbooks/worker.md) – restart procedure, DLQ drain, metric names (bullmq.active, bullmq.failed).
- [docs/runbooks/db.md](./runbooks/db.md) – Neon connection limits, how to use psql+pgvector.
- Alerting: sample Prometheus rules in [ops/prometheus-rules.yml](../ops/prometheus-rules.yml).

## 13 · Style & Lint

- ESLint + Prettier configs pre‑committed.
- `npm run lint:fix` before pushing.
- Commit messages: `feat(api): implement DELETE /themes/:id`.
- Branch naming: `phase3/T-041_get_assets`.

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

## 16 · Definition of Done (per task)

- All referenced tests green.
- openapi/finex.yaml unchanged unless task says "modify contract".
- Lint & typecheck pass.
- No TODOs or console.log in changed lines.
- At least one new unit test when fixing a bug.

ONE MORE TIME:
If anything above is ambiguous, output exactly:

```
CLARIFICATION NEEDED: <question>
```

Otherwise, run the failing tests, implement, commit, push, and we're done.

Happy shipping 🛫
