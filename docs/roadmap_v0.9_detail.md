# Finex Roadmap v0.9 - detail  (2025-05-10)

This annotated roadmap folds in **Deep-Research Phase-6 Audit** artefacts  
(outputs/finex_phase6_full_audit) and sets crisp gates for every sub-phase.

---

## 📍 Phase-6 track-map

| Sub-phase | Window | Outcome KPI | Primary engineer | Reviewer |
|-----------|--------|-------------|------------------|----------|
| **6.1 a — Green-CI Hot-Fix** | **14 – 15 May** | `npm run verify` exit-code 0 on `main`; line-coverage ≥ 68 % | Alex P. | CI-bot → Daniel |
| **6.1 b — Validation ＋ RBAC** ✔ | 15 – 16 May | All contract assertions pass; skipped tests = 0; coverage ≥ 72 % | Alex P. | Daniel |
| **6.2 — Injector / Alias ✔** | 17 – 23 May | 100 % routes use `Services` DI; Jest has **one** alias; type-cov ≥ 75 % | Michelle L. | Code-owners |
| **6.3 a — Module Registry bootstrap** | 24 May | Husky pre-push runs `verify`; ESLint nocheck-ban 0 hits | Michelle L. | Dev-Ex WG |
| **6.4 — Cost Guard-Rails** | 24 – 31 May | Token ceiling metadata in all funcs; weekly OpenAI bill Δ ≤ +5 % | Rahul T. | FinOps |
| **6.5 — RAG Quality** | 1 – 5 Jun | Golden-set recall ≥ 0.9; latency ≤ 500 ms | Rahul T. | Data-Sci |

---

## 6.1 a — Green-CI Hot-Fix 🚑

**Acceptance gates**

* `npm run verify` (see Phase 6.3) passes locally & CI  
* 11 previously failing contract tests green  
* Coverage ≥ 68 %  
* *No* file-wide `@ts-nocheck`

**Checklist (artefact → action)**

| Artefact | Action |
|----------|--------|
| `patch_repostub.diff` **(A)** | `git apply`; adds missing `jest.fn` stubs |
| `jest_paths_snippet.ts` **(G)** | Replace mapper block in `jest.config.js`; add `modulePaths` |
| `run_verify.sh` **(H)** | Copy to repo root; add `"verify"` NPM script; init Husky pre-push |
| `sync_seed_ids.ts` **(D)** | Run once; commit updated seeds & constants |
| **Direct code edits** | • Add rate-limit stub `lib/rateLimit.ts`<br>• Delete all rate-limit mocks & path based mappers |

---

## 6.1 b — Validation ＋ RBAC 🛡️

* **Validation helper** — import `ListParamsSchema` (`zod_list_params.ts` **B**) in every list/search route. ✔  
* Use OpenAPI ↔ Zod diff (**E**) to align max-length, required fields. ✔  
* Add guards where ✗ in RBAC heat-map (audit §2). ✔  
* Write three micro-tests from **C** → coverage ≥ 70 %. ✔  

---

## 6.2 — Injector / Alias Unification 🧩

Milestones  

1. `context.ts` exports `defaultServices`.  
2. 0 direct imports from infra (see `direct_imports.csv` **F**).  
3. Jest aliases generated from `tsconfig.paths` (`pathsToModuleNameMapper`).  
4. Path-based mocks deleted; tests inject stubs via `services`.  

---

## 6.3 — Scaffold Hardening 🛠️

* `npm run verify` = `eslint && tsc --noEmit && jest --passWithNoTests && c8 report && npm run esm:check` (script **H**).  
* Husky pre-push enforces verify.  
* Diff-driver script drops `git diff -U0` into `.agent-context`.  
* ESLint rule ban-ts-comment (`ts-nocheck`).

---

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-1 | VSCode alias drift | Medium | Dev UX | Ship workspace settings pointing to Jest mapper |
| R-2 | Verify hook slows pushes | Medium | Flow friction | Allow `SKIP_VERIFY=1` env override; CI still enforces |
| R-3 | Spec & validators drift again | Low | 400 bugs | Nightly cron: run OpenAPI ↔ Zod diff (artefact E) |
| R-4 | DI cold-start on Edge runtime | Low | Latency | Memoise `defaultServices` |

---

## Ticket tracker

| ID | Phase | Title | ETA |
|----|-------|-------|-----|
| T-176  | 6.1 a | Green-CI Hot-Fix           | 15 May |
| T-176c | 6.1 a | Add verify hook            | 15 May |
| T-176b | 6.1 a | Seed synchroniser applied  | 15 May |
| T-177  | 6.1 b | Validation + RBAC polish   | 16 May |
| T-177a | 6.1 b | Micro-tests (coverage)     | 16 May |
| T-177b | 6.1 b | OpenAPI spec sync          | 16 May |
| T-180  | 6.2 | Injector skeleton           | 18 May |
| T-181  | 6.2 | Alias unification           | 23 May |
| T-182  | 6.3 | Verify script & diff-driver | 24 May |
| T-183  | 6.4 | Token-ceiling guard-rails   | 31 May |
| T-184  | 6.5 | RAG quality benchmark       | 05 Jun |

---

*Document generated 2025-05-10*
