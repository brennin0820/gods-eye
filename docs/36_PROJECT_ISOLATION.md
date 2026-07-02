# Project isolation — experience vs app memory

**Purpose:** the no-cross-repo-bleed card referenced by Tier 0 and the Bible. Canonical law: [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) **§2.6** — this doc routes and summarizes, it does not fork the law.

---

## Two memory classes

| Class | Scope | Examples | Travels? |
|-------|-------|----------|----------|
| **Experience** | Portable — how to work well | Intent ladder, `+#` only, dedup, parallel reads, Tier C craft | Yes — Bible, global rule, install defaults |
| **App memory** | **Current repo only** — what this project is | Handoff, changelog, learning log, overlay vocabulary, locks, feature state | **Never** |

## Rules

- Read **this repo's** `docs/14_SESSION_HANDOFF.md` only — another app's handoff, paths, locks, "Already done", or transcripts are **not binding** here and must not be imported.
- Master (BAIC/UAIPOS) handoff binds only when the working directory **is** the master repo.
- Cross-repo continuity happens only when Brent explicitly requests it — then cite the source repo and scope.
- Inventory ([`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md)) aggregates **metadata only**; agents still read each workspace's local chain.
- Upstream flow: generalized **principles** may be promoted to the framework (Bible §2.7) — never app facts.
- QA/loop audits flag cross-repo references in memory docs as regressions.

**Canonical law:** Bible §2.6 · §2.7. Worked boundary examples: [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §2.
