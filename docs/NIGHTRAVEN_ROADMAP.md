# NightRaven — Forward Roadmap

**Whole-platform** forward-looking horizon plan, established 2026-07-02 from a full repo sweep after the NightRaven Orchestrator shipped (`apps/planner` Phase 2 — LM Studio brain, Builder agent, manifest-driven coordination, cross-project tracker).

**Scope:** this repo's app memory (Bible §2.6). Routes to and cross-links portable law and existing docs — does not duplicate their prose.

---

## 0. Disambiguation (read first)

This is **not** the only "roadmap"-named artifact in the repo. Three exist, each scoped differently — do not conflate them:

| Doc | Scope |
|-----|-------|
| **This doc** (`NIGHTRAVEN_ROADMAP.md`) | Whole-platform — every app, the orchestrator, taxonomy/naming decisions, cross-repo items |
| [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §9 "Phased roadmap" | **Adoption-phase roadmap for a new adopter repo** bootstrapping NightRaven memory itself (Phase 1 doc-only → Phase 2 hooks+MCP → Phase 3 gates) — not this platform's feature roadmap |
| [`apps/compass/docs/MVP_ROADMAP.md`](../apps/compass/docs/MVP_ROADMAP.md) | **Compass app only** — its own 9-phase build-out (Phase 0 scope → Phase 8 loop detector) |

---

## 1. Arc overview

| Arc | Goal | Status |
|-----|------|--------|
| **Arc 1 — Prove the model** | Validate the Orchestrator's manifest/coordination/LM-Studio model actually works, close its immediate loose ends | In progress |
| **Arc 2 — Consolidate the orchestration surface** | Resolve the taxonomy sprawl, give Compass live visibility into runs | Not started |
| **Arc 3 — Platform** | Promote the proven pattern to a default, merge/rename what's still external or ambiguous | Not started |

---

## 2. Arc 1 — Prove the model (Now)

### 2.1 True concurrent multi-stream dispatch
`orchestrate.ts` runs one stream per invocation today. The claim-file and serialized-path machinery is proven — unit and integration tested against a mocked LLM brain — but nothing yet drives multiple streams concurrently from one process. See [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) "Gap status update (2026-07-02) — orchestrator app".

### 2.2 Live LM Studio integration test
No LM Studio server has been available in any sandbox this shipped in. `apps/planner/src/llm/lmStudioClient.ts` is built strictly to the documented `/v1/models` + `/v1/chat/completions` contract (same contract `scripts/lmstudio-division-improve.sh` already uses successfully) but has never been exercised against a real running model. See handoff Recent sessions, 2026-07-02 Orchestrator entry.

### 2.3 HimFLer `UI_DESIGN_SPEC.md`
Long-recurring item, first flagged in handoff Recent sessions on 2026-06-11 and reasserted every session since. Blocks Codex from building HimFLer per the documented Claude → Codex → Antigravity role split.

### 2.4 `gh auth`
Tied to 2.3 — blocks pushing HimFLer to `brennin0820/HimFler`. Same recurring pattern.

> **Closed as part of this roadmap's own creation:** `NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md` §6 covered only the review/improve script and risked being conflated with the new live orchestrator brain (`apps/planner/src/llm/`) — added a disambiguation note distinguishing the two LM Studio integrations; see that section.

---

## 3. Arc 2 — Consolidate the orchestration surface (Next)

### 3.1 Division taxonomy reconciliation — **decision needed from Brent**

Four taxonomies currently coexist, none collapsed into another per explicit repo law (Bible line ~631–633; overlay §1 rows "Division taxonomy scope", "Architect Division", "Execution-path combos"):

| Taxonomy | Where it lives |
|---|---|
| Runtime execution combos (Planning/Design/Research/Builder/Auditor, 8 builder-agent + 8 auditor-agent subtypes) | `.claude/skills/nightraven/SKILL.md` |
| Pipeline divisions (Planner/Researcher/Architect/Builder/Auditor/Greenfield) | `apps/planner/src/agents/*.ts`, `docs/DIVISION_REGISTRY.md` |
| Six virtual teams (Architecture/Engineering/Design-UX/QA/Product/Tier C) | Bible §9 improvement loop |
| 11-division proposal (Product, Research, Architect, Builder, Design, QA, Security, Auditor, Documentation, DevOps + Core) | overlay §1 "Architect Division" row |

**Options** (tradeoffs only — no default chosen):

- **Keep all four separate** — lowest risk, zero migration cost; cost is ongoing cognitive overhead reading four vocabularies for what's conceptually one idea.
- **Collapse to the pipeline taxonomy** (since it's the only one with real, tested code behind it via `apps/planner`) — gives the clearest "this is what actually runs" story; risk is losing nuance the other three encode (e.g. the runtime combos' UI-domain routing rule, the 11-division proposal's Security/DevOps/Documentation roles that pipeline doesn't cover yet).
- **Publish an explicit mapping table** (no collapse, just a Rosetta stone cross-referencing all four) — preserves everything, adds one more doc to maintain, doesn't reduce the underlying complexity.

### 3.2 Compass reads live status/ledgers
Compass currently reads handoff/overlay only. `orchestrate.ts` now produces real `PARALLEL_RUN_STATUS.md` and `docs/ledgers/*.md` entries when it runs — Compass has no wire to either yet. Natural follow-on once 2.1/2.2 give it real data to show instead of a fixture.

### 3.3 Project inventory refresh — logged, not executed
[`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) was last scanned 2026-06-10 and doesn't reflect `docs/35_FAST_START.md`/`36_PROJECT_ISOLATION.md`/`USER_CONTEXT_PROTOCOL.md` (created in the manifest+repair PR) or HimFLer's presence in the registry. Refresh via `./scripts/scan-nightraven-projects.sh --markdown` — **must run on a machine where the registered paths actually exist** (Mac `/Users/brentlenninorlanda/...`, Windows `E:/NightRaven/...`); none exist in a sandbox, and running it here would write false "0/16 artifacts" data into an L0-git-truth doc.

---

## 4. Arc 3 — Platform (Later)

### 4.1 `install.sh`/bootstrap ships manifest + coordination as default
Gated on Bible §2.7 ("promote universal to standard" fires once 2+ apps prove a pattern) — currently only LinenFlow has a manifest, and it hasn't been run for a real build yet. Depends on 2.1/2.2 landing first.

### 4.2 iOS app merge into `apps/ios/`
Per [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) merge-status table: "Not on this machine — add as `apps/ios/` or submodule when repo available."

### 4.3 GitHub repo rename — **decision needed from Brent**

Per [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) "GitHub rename (deferred — Brent decision)".

**Options:**
- **Rename now** (`brennin0820/nightraven` → `NightRaven` or `nightraven-platform`) — closes the brand/repo-name gap immediately; risk is breaking every existing clone/fork/link and the `install.sh` MCP launcher's hard-coded path assumptions until adopters re-clone.
- **Rename after iOS app merge (4.2)** — one rename event instead of two; keeps the current gap open longer.
- **Keep as-is indefinitely** — zero migration cost; the umbrella brand and the git remote name stay permanently mismatched (already true today and not currently causing operational problems).

### 4.4 Naming collision — **decision needed from Brent**

Per [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) consumer-app row: "NightRaven" is simultaneously the framework, the umbrella brand, *and* the consumer iOS gambling-tracker app (ship name "NightRaven", Xcode target still "OneDayMillionaire", repo folder formerly "BankrollCalendar").

**Options:**
- **Rename the consumer app** to something distinct from the framework — clears the collision at its source; costs an App-Store-facing rename if already shipped/named publicly.
- **Rename the framework/umbrella instead** — leaves the consumer product name untouched; costs re-branding this entire published repo, docs, and every adopter install.
- **Leave both as "NightRaven," rely on context** — zero cost now; the ambiguity the project's own docs already flag (`NIGHTRAVEN_UNIFIED_STACK.md` §13: "explicit instruction not to rename the Bible or +# chain to 'NightRaven memory'") persists indefinitely.

---

## 5. Brent-decision index

| # | Decision | Section | Status |
|---|---|---|---|
| 1 | Division taxonomy reconciliation | §3.1 | Open |
| 2 | GitHub repo rename | §4.3 | Open |
| 3 | Naming collision (framework vs. consumer app vs. umbrella) | §4.4 | Open |

---

## 6. Cross-links

| Topic | Doc |
|---|---|
| Division taxonomies, known gaps | [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) |
| Local vocabulary, TBD rows | [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §1 |
| Umbrella brand, monorepo layout, merge status | [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) |
| LM Studio / cloud execution design | [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) |
| Cross-repo adoption inventory | [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) |
| Adoption-phase roadmap (new adopter repos) | [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §9 |
| Compass build-phase roadmap | [`apps/compass/docs/MVP_ROADMAP.md`](../apps/compass/docs/MVP_ROADMAP.md) |
| Current session state | [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) |

---

## 7. Update law

Not append-only handoff-style prose. The Arc tables above are the frozen baseline established 2026-07-02. Status changes append a new dated subsection below — never silently rewrite a row (same convention `DIVISION_REGISTRY.md`'s dated "Gap status update" subsections already use).

---

*Established 2026-07-02.*
