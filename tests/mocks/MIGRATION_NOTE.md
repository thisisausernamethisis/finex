# Mock Migration Note

## Duplicate Mock Resolution (T-244)

As part of the Security & Spec-Parity Sweep (v0.17.0), we've consolidated duplicate mocks 
to ensure consistent behavior across the test suite.

### Changes Made

1. Moved the rate-limit mock to `__mocks__/lib/rateLimit.ts` (from previous nested location at `__mocks__/lib/rateLimit/index.ts`)
2. Ensured the mock implementation matches the interface of the real implementation
3. Added unit tests to verify the correct behavior of the mock

### Best Practices for Future Mocks

- Place global mocks in the `__mocks__` directory at the root level, maintaining the same path structure as the real implementation
- Library-specific mocks should be placed in `__mocks__/` following the module name structure
- Internal module mocks should preserve the folder structure relative to the source code
- Create unit tests for mock implementations to ensure they behave as expected
- Document any deviations from the real implementation in the mock file

### Remaining Mocks to Consolidate

The following mocks may still need consolidation in future tasks:

- Repository mocks (between `tests/mocks/repositories.ts` and `tests/__mocks__/lib/repositories.ts`)
- Prisma mocks (between various locations)

When consolidating these mocks, take care to preserve the existing behavior and ensure all tests continue to pass.
