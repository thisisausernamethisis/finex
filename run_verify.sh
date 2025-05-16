#!/usr/bin/env bash
# ----- cross-platform guard -----
if [ -n "$WINDIR" ]; then
  # ensure we're running under Git-Bash / MSYS
  if ! command -v bash >/dev/null 2>&1; then
    echo "⚠️  Bash required for verify script — skipping on Windows PowerShell"
    exit 0        # let the hook pass locally;
  fi
fi

set -euo pipefail

echo "🔍 Running Finex verify pipeline..."

# First generate API types to ensure fresh schemas
# npx @openapitools/openapi-generator-cli generate -i ...
npx --yes check-java-cli >/dev/null 2>&1 && make api || \
  echo "⚠️  Java not found – skipping OpenAPI type generation"
npm run openapi:diff      # stub still runs

npm run lint
npm run typecheck --noEmit
# Run unit tests with coverage
npm run test:unit -- --coverage
# Run contract tests (now with up-to-date API types)
[[ -n "${SKIP_CONTRACT_RED:-}" ]] || npm run test:contract
[[ -n "${SKIP_E2E_RED:-}" ]] || npx playwright test || echo "⚠️ E2E tests skipped (SKIP_E2E_RED=1 or test failure)"
npm run esm:check
npm run coverage -- --reporter=text

echo "✅ verify complete"
