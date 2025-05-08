# Finex Bot Testing Guide

This document provides information about testing practices and setup for the Finex Bot application.

For a high-level overview of validation and testing approaches, see the [Validation & Testing section](../ground-truth.md#9--validation--testing) in the ground-truth documentation.

## Mock Prisma Test Harness

The application includes a mock Prisma test harness for running tests without requiring a live database connection. This is particularly useful for:

- CI/CD environments where database setup is complex
- Running contract tests in isolation
- Fast test execution without database latency
- Avoiding test data pollution in shared databases

### How It Works

The mock system consists of:

1. **Mock Prisma Client** (`tests/mocks/prisma.ts`): Uses jest-mock-extended to create a mock implementation of the Prisma client.
2. **Mock Repositories** (`tests/mocks/repositories.ts`): Extended versions of the repository classes that use the mock Prisma client.
3. **Jest Setup** (`tests/jest.setup.ts`): Configures Jest to use the mock implementations only in test environments.
4. **Environment Configuration** (`.env.test.local`): Contains test-specific environment variables.

### When Mocks Are Used

Mocks are only activated when:
- `NODE_ENV=test` is set
- Tests are running through Jest with the configured setup

Regular application operation (development, production) will still use the real database connection.

### Setting Up Test Environment

1. Create a `.env.test.local` file with test configuration:
   ```
   DATABASE_URL="postgresql://mock:mock@localhost:5432/finex_test?schema=public"
   DIRECT_URL="postgresql://mock:mock@localhost:5432/finex_test?schema=public"
   OPENAI_API_KEY="sk-mock"
   CLERK_SECRET_KEY="sk_test_mock"
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   ```

2. Ensure Jest is configured to use the setup file:
   ```js
   // jest.config.js
   module.exports = {
     // ...
     setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts']
   };
   ```

### Running Tests

Run contract tests with the mock setup:

```bash
npm run test:contract
```

This will execute tests using the mock Prisma client instead of connecting to a real database.

### Extending the Mocks

To add new mock behavior:

1. Add mock implementations to `tests/mocks/prisma.ts`:
   ```typescript
   prisma.newModel.create.mockImplementation(async (params) => {
     const id = `mock-newmodel-${Math.random().toString(36).substring(7)}`;
     return {
       id,
       ...params.data,
       createdAt: new Date(),
       updatedAt: new Date(),
     };
   });
   ```

2. If needed, create mock repositories for the new models:
   ```typescript
   export class MockNewModelRepository extends NewModelRepository {
     constructor() {
       super();
       // Override the prisma instance with our mock
       Object.defineProperty(this, 'prisma', {
         value: prisma,
         writable: false
       });
     }

     // Override methods as needed
   }
   ```

### Troubleshooting

**Issue**: Tests fail with "Mock not found for..."
**Solution**: Add the appropriate mock implementation to `tests/mocks/prisma.ts`

**Issue**: Cannot connect to database during tests
**Solution**: Check that `setupFilesAfterEnv` is correctly configured in `jest.config.js`

**Issue**: Tests work in isolation but fail in CI
**Solution**: Ensure CI environment has `NODE_ENV=test` set when running tests

## API Type Generation & Drift Checking

Finex Bot uses OpenAPI Generator to maintain TypeScript types that accurately reflect the OpenAPI specification. This ensures that the frontend and backend share the same type definitions.

### Requirements

- Docker must be installed and running
- The OpenAPI schema must exist at `openapi/finex.yaml`

### Generating API Types

To regenerate the TypeScript API types:

```bash
npm run api:generate
```

This command:
1. Detects your operating system (Windows/macOS/Linux)
2. Runs the appropriate script (PowerShell on Windows, Bash on others)
3. Uses Docker to execute OpenAPI Generator
4. Outputs generated TypeScript files to `types/api/`

### Fixing a Failing API-Types Drift Check

If the CI step "API Types Check" fails, it means the generated API types are out of sync with the OpenAPI schema. This typically happens when:

1. Changes were made to `openapi/finex.yaml` without regenerating the types
2. Someone modified the generated types directly (which should never be done)

To fix this issue:

1. Pull the latest code from the repository
   ```bash
   git pull origin main
   ```

2. Regenerate the API types
   ```bash
   npm run api:generate
   ```

3. Review the changes to ensure they match the expected updates to the OpenAPI schema

4. Commit and push the changes
   ```bash
   git add types/api/
   git commit -m "chore: regenerate API types from OpenAPI schema"
   git push
   ```

### Troubleshooting API Type Generation

**Issue**: `npm run api:generate` fails with Docker error
**Solution**: Ensure Docker is installed and running (`docker --version`)

**Issue**: Generated types don't include new endpoints/models
**Solution**: Verify the OpenAPI schema has been correctly updated

**Issue**: Error about Docker mount path on Windows
**Solution**: Try using a Windows path without special characters or spaces
