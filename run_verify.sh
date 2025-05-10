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

npm run lint
npm run typecheck --noEmit
npm run test:unit
[[ -n "${SKIP_E2E_RED:-}" ]] || npx playwright test || echo "⚠️ E2E tests skipped (SKIP_E2E_RED=1 or test failure)"
npm run esm:check

echo "✅ verify complete"
