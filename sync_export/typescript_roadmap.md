# TypeScript Improvement Roadmap

This document outlines the plan to systematically improve TypeScript coverage and type safety across the Finex codebase.

## Overview

Current status: 15 files still contain `@ts-nocheck` banners which need to be removed in a controlled, phased approach.

## Phases

### Phase 5b: Seed Hardening (T-175)

**Branch:** `phase5b/T-175_seed_hardening`

**Goal:** Create a stable foundation for testing by ensuring deterministic database seeding.

**Key tasks:**
- Add deterministic ID generation with cuid2
- Set dayjs to UTC timezone and English locale
- Create db:seed:ci script for CI environment
- Update CI workflow to use deterministic seeding
- Replace dynamic ID expectations with deterministic ones in tests

**Deliverable:** Fixed flaky tests and consistent test environment across different machines.

**Completion marker:** Tag v0.5.0-hardening

### Phase 6.1: Production Code Type Safety (T-176)

**Branch:** `phase6.1/T-176_remove_nocheck_batch1`

**Goal:** Remove @ts-nocheck from 6 production code files and reach ≥70% type coverage.

**Files to address:**
- app/templates/page.tsx
- components/TemplateCard.tsx
- components/TemplateSearchBar.tsx
- lib/repositories/cardRepository.ts
- lib/repositories/matrixRepository.ts
- lib/repositories/scenarioRepository.ts

**Acceptance criteria:**
- All files compile without banners
- Global type coverage ≥70%
- No remaining @ts-nocheck in production code
- All CI gates pass

### Phase 6.2: Test Infrastructure Type Safety (T-177)

**Branch:** `phase6.2/T-177_remove_nocheck_batch2`

**Goal:** Remove @ts-nocheck from 9 test files and reach ≥80% type coverage.

**Files to address:**
- tests/jest.setup.ts
- tests/contract/template_library.test.ts
- tests/contract/template_library_search.test.ts
- tests/contract/template_library_visibility.test.ts
- tests/mocks/prisma.ts
- tests/unit/workers/matrixWorker.test.ts
- tests/_setup/contractTestUtils.ts
- tests/_setup/prismaTestEnv.js
- tests/_setup/prismaTestEnv.mjs

**Acceptance criteria:**
- All files compile without banners
- Global type coverage ≥80%
- All tests pass
- Zero @ts-nocheck banners remain anywhere in codebase

## Code Export Tools

The `sync_export` directory contains tools for creating code snapshots that can be shared with ChatGPT for review during implementation:

```powershell
# Export entire project (excluding node_modules, etc.)
$timestamp = Get-Date -Format 'yyyyMMddTHHmmss'
$output_file = "sync_export/finex_export_full.$timestamp.zip"
$exclude = @("node_modules", "sync_export", ".git", ".next")
Get-ChildItem -Path . -Exclude $exclude | Compress-Archive -DestinationPath $output_file
```

## Implementation Strategy

1. Complete T-175 seed hardening first to establish stable testing environment
2. Address production code (Batch 1) before test infrastructure (Batch 2)
3. Use sync_export tools to get AI assistance during implementation
4. Focus on incremental progress and maintain test coverage throughout
