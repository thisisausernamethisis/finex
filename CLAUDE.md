# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `make dev` - Spin up full stack development environment
- `npm run build` - Build application (includes Prisma generate)
- `npm run lint` - Run Next.js linting
- `npm run typecheck` - Type checking with TypeScript
- `npm test` - Run all tests (unit + contract)

### Testing
- `npm run test:unit` - Run Vitest unit tests
- `npm run test:contract` - Run Jest contract tests
- `npm run test:e2e` - Run Playwright end-to-end tests

### Database & API
- `make db:seed` - Seed database with test data
- `npm run api:generate` - Generate TypeScript API client from OpenAPI spec
- `npx prisma migrate dev` - Apply database migrations
- `npx prisma generate` - Generate Prisma client

### Deployment Validation
- `npm run lint && npm run typecheck` - Pre-deployment validation
- `npm run build` - Verify production build succeeds

## Architecture Overview

### System Purpose
Finex v3 is a **scenario-based impact analysis platform** that creates systematic frameworks for evaluating how potential future events impact assets through AI-powered analysis. The core workflow follows 3 phases:

1. **Asset Management** - Create assets with nested themes and research cards (become matrix rows)
2. **Scenario Planning** - Define future variables with themes and evidence (become matrix columns)  
3. **Matrix Analysis** - AI analyzes each Asset × Scenario intersection with impact scoring (-5 to +5)

### Core Data Model
- **Assets** (matrix rows) - Things to analyze (companies, investments, strategies)
- **Scenarios** (matrix columns) - Future events/variables that could impact assets
- **Themes** - Analytical categories for organizing asset research
- **Cards** - Research documents, data points, and evidence within themes
- **MatrixAnalysisResult** - AI-generated impact scores (-5 to +5) for Asset × Scenario pairs

### Technology Stack
- **Frontend**: Next.js 14 with React Query, Radix UI components, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM and PostgreSQL
- **Authentication**: Clerk with production-ready Edge Runtime middleware, comprehensive security monitoring
- **AI Processing**: OpenAI integration with BullMQ job queues for matrix calculations
- **Testing**: Vitest (unit), Jest (contract), Playwright (e2e)

### Key Service Layer
The `lib/services/` directory contains the core business logic:
- `matrixAnalysisService.ts` - AI-powered asset-scenario impact analysis
- `contextAssemblyService.ts` - Gathers comprehensive context for AI analysis
- `evidenceRankingService.ts` - Scores and ranks supporting evidence
- `hybridSearchService.ts` - Semantic and keyword search across research data

### Directory Structure
- `app/` - Next.js 14 app router pages and API routes
- `components/` - React components organized by feature
- `lib/` - Core business logic (services, repositories, utilities)
- `types/api/` - Auto-generated TypeScript types from OpenAPI spec
- `prisma/` - Database schema and migrations
- `tests/` - Unit, contract, and e2e tests

### Data Flow
1. Users create Assets with Themes containing research Cards (accordion structure)
2. Users define Scenarios with Themes and evidence Cards (mirroring asset structure)
3. Matrix analysis processes each Asset × Scenario combination via AI workers
4. Results stored as impact scores with confidence levels and reasoning
5. UI displays tabbed interface: Assets | Scenarios | Matrix with basic impact scoring

### Important Implementation Notes
- Always run `npm run typecheck` and `npm run lint` before committing changes
- API types are auto-generated from `openapi/finex.yaml` - don't edit `types/api/` manually
- Use React Query for all data fetching with proper error boundaries
- Follow existing patterns in components for consistent UI/UX
- Matrix calculations happen asynchronously via BullMQ workers

### Deployment Architecture
- **Production Environment**: Vercel with Edge Runtime optimizations
- **Database**: Neon PostgreSQL with connection pooling
- **Authentication**: Clerk with simplified Edge Runtime middleware
- **Environment Variables**: Critical validation at build time for missing variables
- **Build Process**: Prisma generation → TypeScript compilation → Next.js build
- **Edge Runtime Compatibility**: Middleware simplified for serverless functions

### UX Implementation & Component Architecture
The system implements a **minimalist, workflow-focused interface** with three core phases:

#### **Primary Navigation**: Tabbed Interface (`/components/layout/MainTabs.tsx`)
- **Assets | Scenarios | Matrix** - Clean three-phase progression
- **Workflow Managers**: AssetWorkflowManager and ScenarioWorkflowManager provide identical UX patterns

#### **Phase 1: Asset Management** (`/components/features/AssetWorkflow/`)
- **Accordion Structure**: Assets → Themes → Cards hierarchy
- **Inline Creation**: Add/delete themes and cards with confirmation dialogs
- **Auto-Theme Creation**: Growth theme (manual value) + Default theme (AI-computed)

#### **Phase 2: Scenario Management** (`/components/features/ScenarioWorkflow/`)
- **Mirrored UX**: Identical accordion pattern as assets
- **Scenario Types**: Technology/Economic/Geopolitical/Regulatory/Market with color coding
- **Auto-Theme Creation**: Probability theme (percentage) + Default theme (evidence-based)

#### **Phase 3: Matrix Analysis** (`/components/matrix/`)
- **Grid Layout**: Assets as rows, scenarios as columns (proper matrix orientation)
- **Impact Scoring**: Basic -5 to +5 impact analysis for Asset × Scenario pairs
- **Cell Interactions**: Analysis dialogs with evidence display
- **Processing Status**: Matrix recalculation with job queue status

### System Identity
This is a **core CRUD system** for Asset/Scenario/Theme/Card management with basic AI matrix impact scoring. 

**CORE SCOPE ONLY**: See [CORE_SCOPE.md](CORE_SCOPE.md) for definitive scope limitations.

**NOT INCLUDED**: Advanced analytics, portfolio intelligence, strategic insights, correlation analysis, or any "enhanced" features beyond basic matrix scoring.