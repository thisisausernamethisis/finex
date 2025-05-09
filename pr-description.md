# Deterministic Database Seeding - T-175a

This PR implements deterministic database seeding using nanoid + seedrandom to ensure consistent IDs across runs with the same seed.

## Changes

- Added `.npmrc` pointing to public registry
- Updated dependencies in `package.json`:
  - Added `nanoid` and `seedrandom` 
  - Removed `cuid2` (replaced by nanoid)
- Modified `prisma/seed.ts` to implement deterministic ID generation
- Created `docs/seed-readme.md` with comprehensive documentation

## Implementation Details

- Replaced `cuid2.createId()` with a custom deterministic ID generator that uses nanoid + seedrandom
- Added a counter to ensure unique IDs even with the same seed
- Configured dayjs for UTC timezone and English locale for timestamp consistency

## Deterministic Behavior Evidence

When running with the same seed, the ID generator produces consistent results:

```
ID with seed 'alpha', counter 0: 9141EVhUxIbQf3gmOaVmJ0IY
ID with seed 'alpha', counter 0: 9141EVhUxIbQf3gmOaVmJ0IY
```

Different seeds or counters produce different IDs:

```
ID with seed 'alpha', counter 0: 9141EVhUxIbQf3gmOaVmJ0IY
ID with seed 'alpha', counter 1: QCLIWVk5IZjaH1LXPyj4n8fa
```

With `DEBUG_SEED=true`:

```
Seeding with deterministic IDs (SEED_UID=ci)
Timezone: UTC, Locale: en
Locale: en
Database has been seeded!
```

## Notes

- Template library search fixes were intentionally excluded (will be addressed in a separate PR)
- All TypeScript, linting, and ESM compatibility checks pass
- Documentation includes clear examples for verifying determinism

## Testing Instructions

1. Run with deterministic seeding: `SEED_UID=test npm run db:seed`
2. Run again and verify the generated IDs are consistent
3. Run the contract tests: `npm run test:contract -- template_library_search`
