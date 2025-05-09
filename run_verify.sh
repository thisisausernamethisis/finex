#!/usr/bin/env bash
set -euo pipefail

echo "🔍  Running Finex verify pipeline…"

npm run lint
npm run typecheck -- --noEmit
npm run test -- --passWithNoTests
npm run coverage -- --reporter=text
npm run esm:check

echo "✅  verify complete"
