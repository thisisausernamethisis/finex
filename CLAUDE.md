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

## Architecture Overview

### System Purpose
Finex v3 is a **scenario-based impact analysis platform** that creates systematic frameworks for evaluating how potential future events impact assets through AI-powered analysis. The core workflow follows 4 phases:

1. **Asset Research** - Define assets with themes and supporting cards
2. **Scenario Planning** - Create future variables to test against assets  
3. **Matrix Generation** - AI analyzes each Asset × Scenario intersection
4. **Strategic Analysis** - Interpret results for decision-making

### Core Data Model
- **Assets** (matrix rows) - Things to analyze (companies, investments, strategies)
- **Scenarios** (matrix columns) - Future events/variables that could impact assets
- **Themes** - Analytical categories for organizing asset research
- **Cards** - Research documents, data points, and evidence within themes
- **MatrixAnalysisResult** - AI-generated impact scores (-5 to +5) for Asset × Scenario pairs

### Technology Stack
- **Frontend**: Next.js 14 with React Query, Radix UI components, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM and PostgreSQL
- **Authentication**: Clerk for user management
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
1. Users create Assets with Themes containing research Cards
2. Users define Scenarios representing future variables
3. Matrix analysis processes each Asset × Scenario combination via AI workers
4. Results stored as impact scores with confidence levels and reasoning
5. UI displays matrix grid for strategic analysis

### Important Implementation Notes
- Always run `npm run typecheck` and `npm run lint` before committing changes
- API types are auto-generated from `openapi/finex.yaml` - don't edit `types/api/` manually
- Use React Query for all data fetching with proper error boundaries
- Follow existing patterns in components for consistent UI/UX
- Matrix calculations happen asynchronously via BullMQ workers

### System Identity
This is NOT a simple portfolio tracker or document management system. It's specifically designed for systematic future scenario analysis with AI-powered impact assessment to enable data-driven strategic planning.