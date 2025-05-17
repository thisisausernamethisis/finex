# Finex Roadmap v0.26

*Supersedes v0.25 • Snapshot tag `roadmap-sync-2025-05-20` • Last updated 2025-05-20*

## Current Tasks

| Task ID | Description | Action | Status |
|---------|-------------|--------|--------|
| T-320f | CI Playwright install/cache tweak | | ⏳ |
| **T-320g** | Stray BOM in `docs/esm-gap-report.md` | remove | 🔜 |
| **T-320h** | Rate-limit bug (tokens not decremented) | patch middleware | 🔜 |
| **T-320i** | SSE client doc status mismatch | update example | 🔜 |
| **T-320j** | Skipped matrix worker startup test | implement mock & enable | 🔜 |

## Patch Schedule

1. **Patch J (House-keeping 1)** — delete orphans, prune migrations, purge env, CI fix.  *ETA May-22.*
2. **Patch K (Bug-fix bundle)** — BOM removal, rate-limit fix, SSE doc update, enable matrix-worker test (T-320g-j). *ETA May-24.*

(all other roadmap content unchanged)
