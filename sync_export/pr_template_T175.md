## PR: feat(db): deterministic seed & UTC default (T-175a)

### What
* Fixed IDs via cuid2 + SEED_UID
* Locked timestamps to UTC (dayjs timezone plugin)
* Standardized on English locale for consistent date formatting
* Updated contract tests and CI seed script

### Evidence
- `diff dump1.sql dump2.sql` → no diff
- All CI gates green
- Confirmed dayjs.locale() returns "en" during seed run (ensures month/weekday strings are stable across runners)
- rg "@ts-nocheck" unchanged (handled in future tickets)

Linked task: tasks/T-175_seed_hardening.yml
