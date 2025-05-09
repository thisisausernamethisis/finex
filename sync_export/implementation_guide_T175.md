# T-175 Seed Hardening Implementation Guide

This document provides comprehensive implementation guidance for task T-175: creating deterministic seeds and standardizing on UTC timestamps.

## Overview

Implementing this task involves:
1. Adding new dependencies for deterministic ID generation and time handling
2. Modifying the seed script to use deterministic IDs when needed
3. Setting up dayjs with proper timezone handling
4. Creating a CI-specific seeding script
5. Updating tests to use deterministic IDs instead of dynamic matchers

## Implementation Steps

### 1. Add Required Dependencies

```bash
npm i cuid2 dayjs @types/dayjs
```

### 2. Update package.json

Add a new script for CI seeding:

```json
"scripts": {
  "db:seed": "ts-node prisma/seed.ts",
  "db:seed:ci": "cross-env SEED_UID=ci ts-node prisma/seed.ts"
}
```

### 3. Update prisma/seed.ts

Add imports and configure dayjs:

```typescript
import { createId } from 'cuid2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/en';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('UTC');

// Create deterministic ID helper
const mkId = process.env.SEED_UID ? (() => createId({ length: 24 })) : undefined;
```

Use the ID helper in entity creation:

```typescript
const theme = await prisma.theme.create({
  data: {
    id: mkId?.(), // Will be deterministic when SEED_UID is set
    name: 'Default Theme',
    // other fields...
  }
});
```

### 4. Update CI Workflow

Add a step to run the deterministic seed before tests:

```yaml
- name: Seed database with deterministic data
  run: npm run db:seed:ci
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    SEED_UID: ci
```

### 5. Update Contract Tests

Replace dynamic ID expectations with deterministic ones by creating a constants object:

```typescript
// Expected deterministic IDs from seeded data
const expectedIds = {
  template1: 'tmpl_ehpicc4emkl73uy2gyyljkgm',
  assetNvidia: 'asset_NVDA_8f5c20c760f9e6aab986',
  // etc.
};

// Then replace expect.any(String) with actual IDs:
expect(template).toEqual({
  id: expectedIds.template1, // instead of expect.any(String)
  // other fields...
});
```

### 6. Create Documentation

Add `docs/seed-readme.md` explaining:
- How deterministic seed generation works
- Why UTC timezone and English locale are important
- How to use the seeding scripts in different environments

## Validation

1. Check determinism:
```bash
SEED_UID=alpha npm run db:seed
pg_dump > dump1.sql
SEED_UID=alpha npm run db:seed
pg_dump > dump2.sql
diff dump1.sql dump2.sql  # Should output nothing
```

2. Verify locale and timezone:
```bash
# Add debug output to seed.ts
console.log(`Timezone: ${dayjs.tz.guess()}, Locale: ${dayjs.locale()}`);
# Should show "Timezone: UTC, Locale: en"
```

3. Run tests:
```bash
npm run test:contract
npm run lint && npm run typecheck && npm run esm:check
```

## Next Steps After T-175

1. Tag the repo as `v0.5.0-hardening`
2. Begin work on T-176 for removing @ts-nocheck banners from production code
