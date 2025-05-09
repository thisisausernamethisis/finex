# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Removed
- Legacy helper modules (T-174)
  - Removed unused `lib/helpers/objectHelpers.ts` module with deprecated utility functions
  - Functions that were removed: `clone`, `pick`, `omit`, `merge`
  - For these operations, use lodash-es equivalents (`cloneDeep`, `pick`, `omit`, `merge`)
  - See `docs/legacy-helper-inventory.md` for full details

### Migration Guide
```typescript
// OLD: Using legacy helpers
import { clone, pick, omit, merge } from 'lib/helpers/objectHelpers';

// NEW: Using lodash-es
import { cloneDeep } from 'lodash-es/cloneDeep';
import { pick } from 'lodash-es/pick';
import { omit } from 'lodash-es/omit';
import { merge } from 'lodash-es/merge';
```
