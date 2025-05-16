# Finex Roadmap v0.23 — Chunk Quality, Smoke QA & Process Guard‑rails

*Supersedes v0.22 • Last updated 2025‑05‑16*

---

## 0 · Overview

This revision **merges** the two parallel v0.22 draft docs and folds in the new Patch H items (re‑chunk runner & RAGAS smoke gate) *without* duplicating work already merged in G‑series.  It also introduces lightweight process guard‑rails so future patch briefs auto‑skip completed tasks.

Legend — 🟢 done  ·  🟡 active  ·  ⚪ planned  ·  🔴 blocked

---

## 1 · Bird‑eye timeline

| Phase                           | Target ETA | Primary goal                                      | Status |
| ------------------------------- | ---------- | ------------------------------------------------- | ------ |
| **6.5 CI Matrix Split**         | 2025‑06‑05 | Parallel unit / E2E matrices + Vitest shim        | 🟡     |
| **6.5‑c Test‑DB Shim**          | 2025‑05‑20 | In‑memory SQLite fixture – removes P3018 failures | ⚪      |
| **7.1 Retrieval & Prompting**   | 2025‑06‑14 | Domain filter, dynamic α, CoT prompts, ≤ 1 s P95  | 🟢     |
| **7.2 Chunk & Quality**         | 2025‑06‑28 | Re‑chunk + re‑embed, smoke QA, confidence banner  | 🟡     |
| **7.3 Drift & Tuning**          | 2025‑07‑05 | Nightly α drift, ANN tuning, cache warm‑up        | ⚪      |
| **8.0 Product‑ready Retrieval** | 2025‑07‑26 | Analyst feedback loop, SLA 900 ms                 | ⚪      |
| **9.0 Self‑serve Launch**       | 2025‑08‑15 | Billing, paywall, LaunchDarkly                    | ⚪      |

> **Snapshot tagging** – After every merge‑train we tag the head (`roadmap-sync‑YYYY‑MM‑DD`).  Planners diff against the latest tag to avoid redundant patches.

---

## 2 · Phase drill‑down (open items only)

### 6.5 — CI & Test Infrastructure

| Ticket     | Outcome                                | Status |
| ---------- | -------------------------------------- | ------ |
| **T‑269b** | Vitest migration shim                  | 🟡     |
| **T‑269c** | Test‑DB migration fixture (SQLite mem) | ⚪      |

### 7.2 — Chunk & Quality (🟡)

| Epic                        | Ticket                   | Outcome                                            | Status |
| --------------------------- | ------------------------ | -------------------------------------------------- | ------ |
| 7.2‑a Re‑chunk Runner       | **T‑301b** *(Patch H‑1)* | 256±15 % tokens, 32‑tok overlap – **CLI + worker** | 🟡     |
| 7.2‑b Fresh embeddings      | T‑307                    | Re‑embed corpus with Ada‑3                         | ⚪      |
| 7.2‑c Similarity smoke gate | **T‑308** *(Patch H‑2)*  | 20‑pair RAGAS smoke in CI, fails < 0.82            | 🟡     |
| 7.2‑d Confidence UI banner  | T‑308d                   | React badge < 50 %                                 | 🟡     |
| 7.2‑e ANN tuning spike      | T‑307a                   | IVF/HNSW lists + probes sweep                      | 🟡     |

### 7.3 — Drift & Tuning (⚪)

| Ticket | Outcome                     | Status |
| ------ | --------------------------- | ------ |
| T‑310  | Nightly α drift RAGAS job   | ⚪      |
| T‑311  | Drift alerts / Prom metrics | ⚪      |
| T‑312  | GPT‑advisor v2 (LLM α)      | ⚪      |
| T‑311a | Cache pre‑warm scheduler    | ⚪      |
| T‑308e | Calibrator retrain CLI      | ⚪      |

*Phases 8 & 9 unchanged – see appendix.*

---

## 3 · Process guard‑rails (new)

| Guard‑rail              | Implementation                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Snapshot tag**        | `git tag roadmap-sync-YYYY-MM-DD && git push --tags` after each merge‑train.                        |
| **Ticket‑linter**       | CI step `node scripts/roadmap/checkTicket.js` – fails PR if ticket ID closed or grep‑found in code. |
| **Issue single‑source** | Each T‑### mapped to a GitHub Issue; PR auto‑closes with `Fixes T‑###`.                             |
| **Patch sizing**        | ≤ 5 files / ≤ 150 LoC per PR; medium granularity (see G‑series & H‑series examples).                |
| **Planning pre‑diff**   | Planners include `git diff roadmap-sync..HEAD --name-status` in prompt → redundancy disappear.      |

---

## 4 · Patch queue snapshot

| Patch   | Target PRs | Ticket(s) | Description                            | Status    |
| ------- | ---------- | --------- | -------------------------------------- | --------- |
| **H‑1** | 1 PR       | T‑301b    | Re‑chunk batch CLI + worker            | ⏳ next up |
| **H‑2** | 1 PR       | T‑308     | 20‑pair RAGAS smoke + CI job           | ⏳ next up |
| **I‑1** | 1 PR       | T‑269c    | SQLite mem fixture for migration tests | queued    |
| **I‑2** | 1 PR       | T‑308d    | Confidence UI banner (React)           | queued    |

---

## 4.5 · Repository Sync Note

Repository reset to snapshot-2025-05-16. All Phase 7.2 items remain open.

---

## 5 · Appendix – Later phases (unchanged)

*(omitted for brevity; see v0.22)*
