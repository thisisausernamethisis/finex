# Database Seeding Guide

This document outlines the deterministic database seeding process for Finex V3, primarily focused on providing consistent test data.

## Deterministic Seeding

Finex V3 supports both standard and deterministic database seeding, with the latter being critical for CI environments and reproducible tests.

### Deterministic Mode

When the `SEED_UID` environment variable is set, the seeding process becomes deterministic, generating consistent IDs and timestamps:

- All generated IDs use `nanoid` with a seeded random number generator
- All timestamps are created using UTC-based `dayjs()` instances
- Locale is fixed to 'en' for consistent formatting

### How to Use

#### Standard Seeding (Development)

For local development with random IDs:

```bash
npm run db:seed
```

#### Deterministic Seeding (CI/Testing)

For CI environments or when you need predictable test data:

```bash
npm run db:seed:ci
# Equivalent to: cross-env SEED_UID=ci ts-node prisma/seed.ts
```

You can also specify a custom seed identifier:

```bash
cross-env SEED_UID=custom_value ts-node prisma/seed.ts
```

### Under the Hood

The seeding process uses several techniques to ensure determinism:

1. **Fixed ID Generation**: When `SEED_UID` is set, we use a custom deterministic ID generation function that combines the seed value with a counter to create unique, reproducible IDs across runs:
   ```javascript
   function createDeterministicId(seed, counter) {
     // Create seeded RNG using seedrandom
     const rng = seedrandom(`${seed}_${counter}`);
     
     // Generate ID using the alphabet and RNG
     let id = '';
     for (let i = 0; i < 24; i++) {
       id += alphabet[Math.floor(rng() * alphabet.length)];
     }
     return id;
   }
   ```
2. **UTC Timestamps**: All dates are created using dayjs with UTC timezone:
   ```javascript
   dayjs.extend(utc)
   dayjs.extend(timezone)
   dayjs.tz.setDefault('UTC')
   ```
3. **Locale Consistency**: English locale is enforced:
   ```javascript
   import 'dayjs/locale/en'
   // Locale is 'en' when checked with dayjs.locale()
   ```

### Verifying Determinism

To verify the determinism of the seeding process:

1. Run `npm run db:seed:ci` twice
2. Export the database after each run with `pg_dump`:
   ```bash
   # First run
   npm run db:seed:ci
   pg_dump -h localhost -U postgres -d finex_dev > dump1.sql
   
   # Second run (after clearing the database)
   npm run db:seed:ci
   pg_dump -h localhost -U postgres -d finex_dev > dump2.sql
   
   # Compare dumps (should only show metadata differences like timestamps)
   diff -u dump1.sql dump2.sql | grep -v "^-- "
   ```

3. The only differences should be in metadata comments, not actual data

With `DEBUG_SEED=true`, additional diagnostics are logged:

```bash
cross-env SEED_UID=ci DEBUG_SEED=true ts-node prisma/seed.ts
```

This will output locale and timezone information to verify the configuration:

```
Seeding with deterministic IDs (SEED_UID=ci)
Timezone: UTC, Locale: en
Locale: en
Database has been seeded!
```

You can also use a simple JavaScript script to verify deterministic ID generation:

```javascript
// test-seed-determinism.js
const seedrandom = require('seedrandom');

function createDeterministicId(seed, counter = 0) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const rng = seedrandom(`${seed}_${counter}`);
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return id;
}

// Generate IDs with the same seed - should be identical
console.log("ID with seed 'alpha', counter 0:", createDeterministicId('alpha', 0));
console.log("ID with seed 'alpha', counter 0:", createDeterministicId('alpha', 0));

// Generate IDs with different counters - should be different
console.log("ID with seed 'alpha', counter 0:", createDeterministicId('alpha', 0));
console.log("ID with seed 'alpha', counter 1:", createDeterministicId('alpha', 1));
```

When run, this will produce consistent IDs given the same seed and counter values:

```
ID with seed 'alpha', counter 0: 9141EVhUxIbQf3gmOaVmJ0IY
ID with seed 'alpha', counter 0: 9141EVhUxIbQf3gmOaVmJ0IY
ID with seed 'alpha', counter 0: 9141EVhUxIbQf3gmOaVmJ0IY
ID with seed 'alpha', counter 1: QCLIWVk5IZjaH1LXPyj4n8fa
```

## Additional Considerations

### TypeScript Notes

The seed file currently uses `@ts-nocheck` to bypass type checking issues related to:
- Missing type declarations for external dependencies
- Schema fields not yet reflected in the Prisma client types

These issues will be addressed in ticket T-176.

### CI Integration

In CI environments, deterministic seeding is automatically triggered:

```yaml
- name: Seed database (deterministic mode)
  run: npm run db:seed:ci
```

### Running Tests

After updating the seed script, it's important to verify that tests depending on seed data still pass. In particular:

```bash
# Run the template library contract tests
npm run test:contract -- template_library_search

# Run the CI GitHub actions locally (if act is installed)
act -j ci
```

The template library search tests validate that:
1. Search functionality works correctly by finding templates matching a query in name/description
2. Filtering by ownership works (mine=true only shows templates owned by the current user)
3. Rate limiting headers are properly included in responses
4. Pagination works correctly with the configured page size

## Troubleshooting

### Common Issues

#### Missing Dependencies
If you encounter errors related to missing dependencies:
```
Error: Cannot find module 'cuid2'
```

Solution: Make sure to run `npm install` after pulling the latest code.

#### Prisma Schema Sync Issues
If you encounter errors with Prisma schema:
```
Error: Unknown field `createdAt` for model `User`
```

Solution: This is a known issue being tracked in T-176. The seed script currently uses @ts-nocheck to bypass these errors.

#### Inconsistent Data Between Runs
If deterministic seeding doesn't produce identical results:

1. Ensure you're using the exact same SEED_UID value for each run
2. Verify that all timestamps are using the UTC timezone
3. Check if any database triggers or schema changes are affecting the seeding

Run with `DEBUG_SEED=true` to verify locale and timezone settings:
```bash
cross-env SEED_UID=ci DEBUG_SEED=true ts-node prisma/seed.ts
```

#### CI Environment Issues
In CI environments, ensure that `cross-env` is properly installed and the environment variables are being passed correctly. The CI workflow should include:

```yaml
- name: Install dependencies
  run: npm install
  
- name: Seed database
  run: npm run db:seed:ci
```
