# Engineering changelog — NightRaven framework repo

Append-only (`+#`). Corrections use **Supersedes** lines — never delete history.

---

## 2026-07-02

### Improvement Loop cycle — broken `templates/` path fixed to `docs/`

- +# Brent **improve** — ran one NightRaven Improvement Loop cycle (Bible §9–§10): Tier C opened, five support audits ran, Architecture supplied the winning constraint (broken pointer)
- +# Found: the Improvement Loop's own authoritative cycle prompt is at `docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md`, but **9 citations across 5 files** — `docs/37_NIGHTRAVEN.md` (×6: §0 glance row, §6 anti-pattern table, §9 "Runnable automation" table, §9 direct-execution line, §9 hard-law table ×2, §10 AI-universe-form line), `AGENTS.md`, `docs/NIGHTRAVEN_PROJECT_INVENTORY.md`, and `examples/appendix/USER_CONTEXT_PROTOCOL.example.md` — still pointed at a nonexistent `templates/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md`, including the cycle prompt's own self-reference (Cycle 0 read-list item 4, "this file")
- +# Fixed all 9 occurrences to `docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md` — mechanical path correction only, no semantic change; verified zero remaining `templates/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT` hits repo-wide
- +# **Deferred** (Architecture, second candidate): `docs/32_BIGBROTHER_OVERSIGHT.md` is cited in 4 files (`AGENTS.md`, `docs/37_NIGHTRAVEN.md`, `docs/NIGHTRAVEN_PROJECT_INVENTORY.md`, the cycle prompt's Cycle 0 read list) but has never existed in this repo — out of scope for one cycle (creating the doc is a multi-file/large-content task, not a "smallest durable step"; scoping the right fix — create vs. redirect vs. mark-not-yet-created — needs its own pass)
- +# **Deferred** (Engineering, third candidate): overlay §1 row **"Nightrave core"** is missing the 'n' (should read "NightRaven Core") — cosmetic, low friction, lowest leverage of the three candidates found this cycle

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §0 · §6 · §9 · §10 · [`AGENTS.md`](../AGENTS.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md`](NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

---

## 2026-07-02

### Forward roadmap — `docs/NIGHTRAVEN_ROADMAP.md`

- +# Brent **generate next road map** (Plan Mode) — full memory-chain sweep wiring a 13-item repo-wide inventory into a whole-platform forward plan
- +# Shipped `docs/NIGHTRAVEN_ROADMAP.md` — Arc 1 (prove the model) · Arc 2 (consolidate orchestration surface) · Arc 3 (platform); §0 disambiguates up front against `NIGHTRAVEN_UNIFIED_STACK.md` §9 (adoption-phase roadmap for new adopter repos) and `apps/compass/docs/MVP_ROADMAP.md` (Compass build-phase roadmap) — neither of which is whole-platform, both pre-existed and could otherwise be confused for this doc
- +# Cross-links only — no duplicated prose from `DIVISION_REGISTRY.md`, `NIGHTRAVEN_UNIFIED_PRODUCT.md`, `NIGHTRAVEN_REPO_OVERLAY.md`, or `NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`
- +# Division taxonomy reconciliation · GitHub repo rename · naming collision (framework/consumer-app/umbrella) flagged **decision needed from Brent** in a §5 index — options with tradeoffs presented, none chosen, per the existing overlay "TBD (do not decide for Brent)" precedent
- +# **Bundled fix:** `NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md` §6 gained a disambiguation note — two distinct LM Studio integrations now exist (`scripts/lmstudio-division-improve.sh` review/improve script vs. the new live orchestrator brain `apps/planner/src/llm/`) and the section only covered the former. The original plan assumed the doc's routing table was stale ("Builder listed unimplemented"); on inspection the table's advice was still correct (route large-scale implementation to cloud regardless of BuilderAgent shipping) — the actual gap was the missing cross-reference, not incorrect content
- +# Fixed handoff Current-state/focus staleness — "review + merge this PR" (PR #5) superseded a third time; confirmed merged `be4000e`, tree clean
- +# Wired: `AGENTS.md` Reference row · overlay §1 vocab row + §3 Connected chain row
- +# **Not done this pass:** `NIGHTRAVEN_PROJECT_INVENTORY.md` refresh — registry paths (`/Users/brentlenninorlanda/...`, `E:/NightRaven/...`) are absent from this sandbox; running the scan here would write false "0/16 artifacts" data into an L0-git-truth doc — logged as roadmap §3.3 instead of executed
- +# **Deliberately not wired:** `README.md` — the roadmap surfaces internal indecision (taxonomy, naming, rename) that doesn't belong in public copy; matches how `DIVISION_REGISTRY.md` itself isn't README-linked today

**Cross-links:** [`NIGHTRAVEN_ROADMAP.md`](NIGHTRAVEN_ROADMAP.md) · [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) · [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-07-02

### NightRaven Orchestrator — Planner Phase 2 ("make this an app")

- +# Brent **make this an app** — clarified via AskUserQuestion to **orchestration engine + project tracker, LM Studio as its brain**; closes DIVISION_REGISTRY's own "no LLM dispatch loop yet (Phase 2)" gap and the missing Builder TS agent
- +# **`apps/planner/src/llm/`** — `lmStudioClient.ts` (OpenAI-compatible; `NIGHTRAVEN_LMSTUDIO_URL` default `localhost:1234/v1`; model auto-resolve from `/v1/models` mirroring `scripts/lmstudio-division-improve.sh`; single-slot serial queue — concurrent `chat()` calls never run in parallel, encoding the local-mode "never parallel under LM Studio" law in code) · `llmBrain.ts` (loads `.claude/skills/divisions/<name>/SKILL.md` as system-prompt context, extracts + zod-validates JSON output) · `schemas.ts` · `findRepoRoot.ts` (Bible-marker walk-up, shared with `mcp-server`'s convention)
- +# **Planner/Researcher/Architect agents** — LLM-backed via optional constructor param; on `LmStudioUnreachableError`/`LlmBrainOutputError` fall back to the *exact* prior deterministic logic (extracted, not rewritten) — `index.ts`/`run:flow` behavior is unchanged when no client is passed. `ReviewAgent` deliberately stays deterministic-only: the quality gate is compile-visible enforcement, not model judgment
- +# **`BuilderAgent.ts`** (new, closes the Builder-agent gap) — full tool belt (bash/file_read/file_write/file_edit/glob/grep); LLM proposes `FileChangeProposal[]`; applies only with `approve:true`; without a reachable brain, proposes nothing and reports why (no invented scaffold code)
- +# **`manifest/`** — generalized Unified Manifest zod schema (`types.ts`) + YAML loader (`loadManifest.ts`), validated against the committed `examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml`; app-specific fields (e.g. `invoke` prompts) survive in `raw` even though the schema doesn't model them
- +# **`coordination/`** — `claimFile.ts` (append-only claim log; `claimPath`/`releasePath`; a path held by another stream is refused, not overwritten — Bible §2.4 "one file → one writer" as executable logic) · `statusDoc.ts` (renders `monitor.status_doc`, full-rewrite snapshot) · `ledger.ts` (append-only, entry format matches `docs/ledgers/BUILD_LEDGER.md`/`AUDIT_LEDGER.md` exactly)
- +# **`tracker/`** — `registry.ts` (parses `scripts/nightraven-projects.conf`) + `projectStatus.ts` (per-project rollup: availability, handoff focus, manifest presence, ledger entry counts — metadata only, Bible §2.6, same discipline as `NIGHTRAVEN_PROJECT_INVENTORY.md`)
- +# **`orchestrate.ts`** + **`status.ts`** CLIs (`npm run orchestrate -- --manifest <path> [--approve]`, `npm run status`); Builder's writes wired through claim hooks end-to-end in `orchestrate.ts`
- +# **Verified:** 32/32 vitest pass (12 new — `lmStudioClient` serial-queue + unreachable-error, `loadManifest`, `claimFile`, `statusDoc`, `ledger`, `registry`, `BuilderAgent` integration with a mocked LM Studio response proving proposal→claim→write→release and claim-denial blocking a write); `tsc --noEmit` + `tsc` build clean; manual `orchestrate.ts` dry-run and `--approve` run against a fixture project — honest zero-proposal report when LM Studio is unreachable
- +# **Not done:** true concurrent multi-stream dispatch (one stream per `orchestrate.ts` invocation today); no live LM Studio server available in this sandbox to test the real chat-completion path — client built strictly to the documented API contract
- +# **Bug found + fixed in the same pass:** `apps/planner/tsconfig.json` only excluded `node_modules`/`dist`, so `tsc` compiled `*.test.ts` into `dist/**/*.test.js`; running `npm test` after `npm run build` silently doubled every test file/count (9→18 files, 32→64 tests) with no failure signal. Fixed by excluding `src/**/*.test.ts` from the build; verified `dist/` now contains zero `.test.js` files and counts are back to 9/32
- +# Wired: `apps/planner/AGENTS.md` full rewrite (5-phase table, new directory map, laws) · README + `apps/README.md` Planner status line · `DIVISION_REGISTRY.md` second gap-status table · overlay §1 **NightRaven Orchestrator (Planner Phase 2)** row · handoff Supersedes + Recent sessions

**Cross-links:** [`apps/planner/AGENTS.md`](../apps/planner/AGENTS.md) · [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

---

## 2026-07-02

### Repair + gap-fill batch (PR #4 branch)

- +# Brent **repair and fill in the gaps** — redesign Q&A verdict was repair-not-redesign; batch on `claude/grab-concept-project-aex0sm`
- +# **Repairs:** removed dangling `night-raven` submodule gitlink (missing object, no `.gitmodules`) · `session-stop.sh:75` `=`→`+=` — Unix stop hook silently discarded the entire Touch 3 follow-up message · bootstrap **seed guard** — skips overlay/handoff/quickstart/README rewrite when handoff has live memory (dated Recent sessions / Bootstrap milestone), `--force` to override; closes the script's own `-#` violation · Compass `parseHandoff.ts` `\Z` (not a JS anchor) → `(?![\s\S])` — last handoff section no longer truncates at first capital Z · GE→NightRaven user-facing copy in Compass (AppShell, SettingsPage, NotNowPage, ReportsPage, MemoryFeedPage, buildSnapshot strings) + `session-stop.sh`/`after-file-edit.sh` headers · `install.sh` self-identical dedupe regex → second branch now matches legacy `gods-eye/session-start.sh` · `lib.sh` secret denylist `.aws/*` parity with `lib.ps1` · `mcp-server/src/memory.ts` duplicate default candidate removed · `.gitignore` duplicate `apps/*` block deduped
- +# **Gaps filled:** planner — DAG **cycle detection** (DFS, error finding per cycle) · `GrepTool` **glob honored** (basename vs path semantics) · **coverage gate un-inverted** (MVP scope = covered; warning only when empty) · **vitest** wired, `ReviewAgent` + `GrepTool` suites (7 tests pass) · `run:flow` → `tsx src/index.ts --approve` (was broken filename case, no runner) · Planner rows added to README + `apps/README.md` component tables · planner `AGENTS.md` directory map gains `src/tools/` · created [`35_FAST_START.md`](35_FAST_START.md) + [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) (phantom docs referenced since 2026-06-11) + [`USER_CONTEXT_PROTOCOL.md`](USER_CONTEXT_PROTOCOL.md) (16/16 scan artifacts) — all lean routers, law stays in Bible · [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) gap-status update table · handoff **Current state / focus** Supersedes block (stale "(uncommitted)")
- +# **Verified:** `apps/planner` `npm run lint` + `npm test` (7/7) + `npm run run:flow` end-to-end PASS coverage 100 · `apps/compass` `npm run build` pass · `bash -n` on all touched scripts · node regex probe (mid + last section extraction)
- +# **Not done (Phase 2, needs ship signal):** Builder TS agent · LLM dispatch loop

**Cross-links:** [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`35_FAST_START.md`](35_FAST_START.md) · [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) · [`USER_CONTEXT_PROTOCOL.md`](USER_CONTEXT_PROTOCOL.md)

### NightRaven Unified Manifest — add + overlay wire

- +# Brent **add or merge** — pasted **NightRaven Unified Manifest** (`version: 1`) added verbatim as [`examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml`](../examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml); no existing manifest/`.nightraven/` in repo → **add** + concept wire (not a merge target)
- +# Manifest genre: orchestrator (divisions planning/builder/auditor · MEDIUM) · claim file `AGENT_WORK_LOG.md` · serialized protected paths (one agent per Swift file · single-stream `project.pbxproj`) · build/audit ledgers · `PARALLEL_RUN_STATUS.md` status doc · invoke blocks (Cursor agent + `/nightraven`) · no commit without user approval
- +# First appearance of **LinenFlow** consumer app (Swift; instance manifest `.nightraven/linenflow-parallel.yaml` @ Mac `Developer/NightRaven`); registry root already covered by existing `nightraven-projects.conf` entry — no conf change

**Cross-links:** [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §1 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

---

## 2026-06-13

### Touch 3 AFTER — push close memory shipped (`52de8e5`)

- +# Brent **`commit` + `push`** — **`origin/main` @ `52de8e5`** records **`80b4e29`** push-landed batch in handoff · changelog · learning log
- +# LM Studio doc arc session-close on origin · push-latency §2.8 satisfied

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Session sync — push landed (`80b4e29`)

- +# Brent **commit + push** — **`origin/main` @ `80b4e29`** · LM Studio §6 runbook + mis-doc guards + zsh recipe + Personal Network + remote roster memory
- +# Batch **`6979747`…`80b4e29`** (4 commits) · noreply rebase before push (GH007) · push-latency §2.8 satisfied
- +# **Supersedes** prior uncommitted / autosync push-defer lines for this LM Studio doc arc

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6

### LM Studio zsh one-liner recipe (§6)

- +# Brent third external paste — **Supersedes** fake dry-run patch stats + “applies patches” live step + `git apply` sanity checks
- +# **`+#`** wired macOS **zsh** interactive + non-interactive recipes · expected dry-run/live/`git status` excerpts in [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

### LM Studio mis-doc pass 2 — dry-run / JSON review myths

- +# Brent second external paste — falsely claims `--dry-run` prints patches · targets `divisions/planner/` paths · stores **JSON** reviews with RFC 6902 · **`git apply failed`** troubleshooting
- +# **+#** expanded §6 mis-doc table (git apply N/A · dry-run output · `.md` not `.json`); canonical runbook unchanged — see **Step-by-step runbook**

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6

### LM Studio division script — canonical runbook (§6)

- +# Brent external walkthrough claimed JSON Patch · auto-commit — **incorrect**; appended **Step-by-step runbook (macOS)** to [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 — actual flow: one SKILL · `/v1/chat/completions` · `docs/lmstudio-reviews/` · manual **`+#`** after **code it**
- +# OpenAI models shape `data[].id` · dry-run · verify with `ls docs/lmstudio-reviews/` not `git log` auto-commit
- +# Wired overlay pitfall · learning log anti-pattern

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

### Touch 3 AFTER — LM Studio memory committed (`6979747`)

- +# Brent **`commit`** — local **`6979747`** ships Personal Network + remote roster wire (handoff · changelog · learning · local doc §6 · registry · overlay)
- +# **Push-latency §2.8** — **`main` 3 ahead** of `origin/main`; push **deferred** until Brent says **push** (noreply on commit)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### LM Studio remote model roster — division map (`DESKTOP-7FT26ER`)

- +# Brent remote models (gguf) — **GPT-OSS 20B** · **Gemma 4 E4B** (~7.5B) · **DeepSeek R1 0528 Qwen3 8B** · **Nomic Embed Text v1.5** (embeddings — not for chat/completions)
- +# Serial division map — 20B → planner · architect · greenfield · planning · builder (no 32B coder remote); DeepSeek 8B → auditor · researcher · research; Gemma → design; **exclude Nomic** from [`lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh)
- +# Wired — [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 remote roster table

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md)

### LM Studio Personal Network — Brent setup (Mac + remote 4080)

- +# Brent LM Studio **Network Devices** — Mac control surface · remote **`DESKTOP-7FT26ER`** RTX 4080 16 GB VRAM · **Set as preferred device ON** · **`GPT-OSS 20B`** (gguf) on remote
- +# **Script contract unchanged** — [`lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh) → Mac Local Server `http://localhost:1234/v1`; preferred remote handles GPU load — no separate remote `--base-url` unless server runs only on Windows
- +# Wired — [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 Personal Network subsection · overlay pitfall row

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

### Touch 3 AFTER — push landed memory committed (`0870b42`)

- +# Brent **`commit`** — local **`0870b42`** records push @ `32e6419` + GH007 batch-rebase learning in handoff · changelog · learning log
- +# **Push-latency §2.8** — **`main` 1 ahead** of `origin/main`; push **deferred** until Brent says **push** (noreply metadata on commit)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Session sync — push landed (`32e6419`)

- +# Brent **update repo** — committed Touch 3 LM Studio memory batch · rebased **12** ahead commits with noreply author **and** committer · **pushed** `origin/main` @ `32e6419`
- +# Batch includes — usage-friendly passive mode · multiphase handoff gate · ChatGPT Work with Apps memory · `scripts/lmstudio-division-improve.sh` + [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 · registry · overlay
- +# **Supersedes** prior **push pending** / autosync GH007 defer lines for this Jun 13 batch

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### LM Studio serial division improvement loop

- +# Brent **improve all divisions using lm studio** — [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh): serial OpenAI-compatible API to local LM Studio; one division per call; 9 keys (6 division SKILLs + 3 runtime sections in `nightraven/SKILL.md`)
- +# CLI — `--list` · `--dry-run` · `--division NAME|all` · `--model` · `--base-url`; output `docs/lmstudio-reviews/<division>-<timestamp>.md` (proposals only — apply with **`+#`** after ship signal)
- +# Docs — [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 (order · model hints · after-loop law) · [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) local table · overlay §1 **LM Studio division improve loop**
- +# **Fix:** dry-run skips LM Studio probe; resolve model once before loop (bash `set -e` + failed `curl` no longer silent-exits dry-run)
- +# **Law:** never parallel under LM Studio; Researcher/Research defer live web to cloud

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.9

### Repo hygiene — remove legacy root `nightraven` gitlinks

- +# Brent **delete all gods eye folder** — removed `nightraven` · `nightraven-1` at monorepo root (empty submodule entries · same `f3fbb55` gitlink · no `.gitmodules`)
- +# **Uncommitted** — `git status` shows `D nightraven` · `D nightraven-1`; say **commit** to finalize
- +# **Scope boundary** — NightRaven framework files (`docs/37_NIGHTRAVEN.md` · `.cursor/rules/` · scripts) **not** removed; aligns with [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) legacy nested-clone note

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md)

### Filename alignment — content-descriptive names (uncommitted)

- +# Brent **rename all filenames according to what they contain** — Bible/router/session/local/loop/composer docs renamed to match H1 content; scripts → `nightraven-projects.conf` · `scan-nightraven-projects.sh` · `install-nightraven-framework.sh` · `lint-framework-memory.sh`
- +# Rule + MCP + hooks paths — `nightraven-context-intent.mdc` · `run-memory-chain-mcp.*` · MCP id `nightraven-memory-chain` · user install `hooks/nightraven/` (legacy `nightraven/` detect kept in `install.sh`)
- +# **Parallel closeout** — `install.sh` · `mcp-server/package.json` · `memory.ts` default roots · `MCP_SETUP.md`; Compass `mockPhase78` · `compassApi` legacy migration · `buildSnapshot` label
- +# **`lint-framework-memory handoff`** passes · bulk `rg|perl` replace aborted (hung); Python pass + disjoint file edits completed
- +# **Uncommitted** — full rename batch + prior `D nightraven` · `D nightraven-1`; say **commit** · push deferred (email privacy hook on `2026-06-13`)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) · [`nightraven-projects.conf`](../scripts/nightraven-projects.conf) · [`apps/compass/AGENTS.md`](../apps/compass/AGENTS.md)

---

## 2026-06-11

### Compass — HimFLer default migration (`519da50`)

- +# Brent **make compass open on himfler** · **I'd like to see** — shipped fix after localStorage gotcha (`f307b28`)
- +# **`compass.himflerDefaultMigration.v1`** — one-time clear when stored pick is framework nightraven-1 · fall through to `PREFERRED_DEFAULT_PROJECT`
- +# **`ProjectContext`** — `selected` init `null` until bootstrap (no flash of stale project)
- +# `findHimFlerEntry` / fuzzy `himfl` label match · explicit user picks still persist post-migration
- +# Autosync pushed · `origin/main` @ `519da50`
- +# **Supersedes** “migration not shipped” on Compass default Q&A block below

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) · [`apps/compass/README.md`](../apps/compass/README.md)

### Compass — open on HimFLer (default selection Q&A)

- +# Brent **make compass open on himfler** — logic already in [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) (`ca783f2`): `PREFERRED_DEFAULT_PROJECT` → HimFLer path · fuzzy `himfler`/`himfl` label match
- +# **Persisted selection wins** — `localStorage` key `compass.selectedProject` restores last project; prior **nightraven-1** session blocks default until Settings switch or storage clear
- +# **Next (code):** one-time migration or ignore framework stored path — not shipped this close. **Superseded** by `519da50` migration entry above.
- +# Autosync handoff `4095fa7` · `origin/main` @ `4095fa7`

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`apps/compass/README.md`](../apps/compass/README.md) · [`nightraven-projects.conf`](../scripts/nightraven-projects.conf)

### HimFLer — external coder role wire (`5a50fa7`)

- +# Brent **HimFLer build spec** (linen room GY calculator) · **Claude UI first → Codex build → Antigravity** plan/audit
- +# Consumer docs `E:\NightRaven\HimFLer\docs\BUILD_ROLES.md` · `UI_DESIGN_BRIEF.md` — Codex blocked until design gate; framework overlay §1 pointer only (§2.6)
- +# Brent **iOS 26 SwiftUI** design ask — `UI_DESIGN_SPEC.md` **next on consumer repo**; no framework app code
- +# Autosync `5a50fa7` · `origin/main` @ `5a50fa7`

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · consumer [`BUILD_ROLES.md`](../../HimFLer/docs/BUILD_ROLES.md)

### Compass — agent docs + auto-refresh UI polish (`3fac525`)

- +# **`apps/compass/AGENTS.md`** · **`docs/ARCHITECTURE.md`** — Codex/Claude entry; framework cross-links (overlay · root AGENTS · CLAUDE_ADOPTION · NIGHTRAVEN_UNIFIED_PRODUCT)
- +# Auto-refresh UI — Live/Updated badges · tab-hidden poll pause · green banner (`AppShell` · `index.css`)
- +# **Supersedes** changelog “AGENTS.md deferred” on `82e4cff` block
- +# Autosync `3fac525` · pushed `origin/main`

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Compass — memory auto-refresh monitor (`82e4cff`)

- +# Brent: **monitor refresh when changes** — `/api/project/version` (mtime aggregate) · client poll **10s** when `settings.autoRefresh` + registry mode
- +# **`ProjectContext`** silent reload on version change · IndexedDB overrides preserved · `refreshStatus` for UI
- +# Watched memory paths: handoff · overlay · changelog · learning log · `AGENTS.md` · `.cursor/rules` · hooks
- +# Default `autoRefresh: true` in live snapshot build
- +# Brent: **Codex/Claude understand app** — requested; **`apps/compass/AGENTS.md` deferred** (packet docs in `apps/compass/docs/`)
- +# Autosync `82e4cff` · `origin/main` @ `82e4cff`
- +# **Supersedes** “poll not implemented” on `ca783f2` changelog bullet below

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`compassApiPlugin.ts`](../apps/compass/server/compassApiPlugin.ts)

### Compass — HimFLer default project (`ca783f2`)

- +# **`pickInitialProject()`** in [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) — new sessions default to **HimFLer (iOS app)** when no valid stored selection
- +# Registry label `HimFler (iOS app)` · README registry section
- +# Brent: **monitor refresh when changes** — requested; `autoRefresh` setting in UI only — **poll/hash refresh not yet implemented**
- +# Autosync `ca783f2` · `origin/main` @ `ca783f2`

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`apps/compass/README.md`](../apps/compass/README.md)

### Compass — full local product + HimFLer registry (`ce4afb3`)

- +# Brent: **fully functioning product** (not mock-only) — **`ProjectContext`** loads `fetchRegistry` / `fetchProjectSnapshot` · **`mergeSnapshot`** + **`enrichSnapshot`**
- +# **IndexedDB** (`persistence.ts`) — task/decision/blocker/audit/phase/settings overrides persist across refresh
- +# Phases 2–8 shipped — [`BUILD_REPORT_PHASES_2-8.md`](../apps/compass/docs/BUILD_REPORT_PHASES_2-8.md) · [`BUILD_REPORT.md`](../apps/compass/docs/BUILD_REPORT.md)
- +# Brent **put on himlfer** — `E:/NightRaven/HimFLer|HimFler|app` in [`nightraven-projects.conf`](../scripts/nightraven-projects.conf); Compass Settings project picker
- +# Autosync `ce4afb3` · `origin/main` @ `ce4afb3`
- +# **Supersedes** “persistence pending” / mock-only `ProjectContext` on `ea832ac` changelog block below

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`persistence.ts`](../apps/compass/src/services/persistence.ts)

### Compass — full nav + memory API (`ea832ac`; persistence pending)

- +# Brent: **not mock — fully functioning product** — shipped all sidebar routes + Phase 2–8 UI (`routeRegistry` · task cards · queues · prompts · auditor · progress · memory · loop · reports)
- +# **`compassApi.ts`** + **`server/compassApiPlugin`** — registry + project snapshot from `nightraven-projects.conf` · handoff/overlay parse (`npm run dev`)
- +# Enriched mock layers (`mockPhase2`–`78`) seed UI until live store wired
- +# **`ProjectContext` still `buildMockSnapshot()`** — next: connect fetch + local persistence for tasks/decisions/blockers
- +# Autosync `ea832ac` · `origin/main` @ `ea832ac`

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`compassApi.ts`](../apps/compass/src/services/compassApi.ts)

### Compass — Phase 1 mock consolidation + parallel phase build (partial)

- +# Brent **do all phases automatically** + **in parallel** — four workers for Phases 2–8 bundles; page components remain in `apps/compass/src/components/` tree
- +# **`1fd1c3f`** — `ProjectContext` · `buildMockSnapshot()` · dashboard-only `App.tsx` (strict Phase 1 routing); removed live-API loading path for static mock scope
- +# **`npm run build` + `npm run lint`** pass; sidebar lists Phases 2–8 routes but **non-dashboard views still placeholders** until route integrator wires `RoadmapPage`, queues, lists, etc.
- +# **Supersedes** changelog line claiming all Phase 2 nav pages fully live — components exist; routing gate still Phase 1

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Touch 3 — last-turn law (§2.8)

- +# Brent: **make touch 3 only do its turn last** — Touch 3 AFTER runs **only** on `session-stop` hook follow-up (agent final turn)
- +# **`session-stop.sh` / `session-stop.ps1`** — explicit final-turn message; no new work or subagents after follow-up
- +# **`after-file-edit`** — defer changelog/handoff/learning batch to session-stop; mid-session append only when Brent explicitly asks
- +# **`nightraven-context-intent.mdc` · `AGENTS.md`** — During work: no Touch 3 mid-session; subagents/workers never Touch 3
- +# **Bible §2.8** — last-turn law + anti-pattern row for mid-session Touch 3
- +# Shipped autosync `1fd1c3f` (hooks + memory + Compass mock consolidation)

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`AGENTS.md`](../AGENTS.md)

### Compass — Complete Build Packet (Phase 1 MVP + memory file API)

- +# Brent supplied **NightRaven Compass Complete Build Packet** and asked **in parallel** — worker implemented Phase 1 in `apps/compass/`
- +# **Phase 1 UI** — `project.ts` types · `mockProject.ts` · routing/progress/scopeWarnings/promptGenerator utils · AppShell · Sidebar · Dashboard cards (status · phase · next action · progress · blocker · decision · Not Now · prompt)
- +# **memory file wire (partial)** — Vite dev middleware (`compassApiPlugin.ts` · `buildSnapshot.ts` · `parseHandoff.ts`) reads `scripts/nightraven-projects.conf` · per-project `docs/14_SESSION_HANDOFF.md` · `docs/NIGHTRAVEN_REPO_OVERLAY.md`; monorepo root auto-registered
- +# **Phase 2 pages** — Roadmap · Priority Board · Task Queue · Next Prompt · Blockers · Decisions · Not Now · Progress · Memory Feed · Loop Detector · Settings (mock task data + live memory feed)
- +# Verified path: `cd apps/compass && npm run build && npm run lint`; live data requires `npm run dev`
- +# Autosync shipped `e6d44d6` (server/API) + `dac3313` (UI) · `origin/main` @ `dac3313`
- +# **Out of scope** — cloud sync · AI automation · repo auto-edit · database

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

### HimFler — iOS 26 product scope (consumer repo)

- +# Brent: GitHub repo **HimFler** — native **iOS 26** (widgets · Lock Screen · Watch · Dynamic Island · notifications · sounds · maps · calendar · location · HealthKit movement · integrations); **macOS/Xcode** build host
- +# Consumer memory in `E:\NightRaven\HimFLer` — `PRODUCT_SCOPE.md` · `DEVELOPMENT_ENVIRONMENT.md` · `create-github-repo.sh`; initial commit `75d35be`
- +# Framework wire: [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) · `scripts/nightraven-projects.conf` → `HimFler`; shipped `origin/main` @ `85ecfde`
- +# **Pending:** `gh auth login` → push to `brennin0820/HimFler`; Xcode scaffold on Mac after **code it**

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · consumer `E:\NightRaven\HimFLer\docs\PRODUCT_SCOPE.md`

### Compass — scope monitor live (Scope Map + Auditor Queue)

- +# Brent **in parallel MAKE IT WORK** — replace Scope Map / Auditor Queue placeholders with working UI
- +# **`scopeMonitor.ts`** — `buildScopeMonitorSnapshot` · per-task reports · `detectScopeCreep`
- +# **`ScopeMapPage`** — health % · in/out scope lists · phase constraints · task scope table
- +# **`AuditorQueuePage`** — pre-build scope gate · creep signals · pass/hold
- +# **Dashboard** — `ScopeMonitorCard` + link to Scope Map; nav **Phase 1** for scope-map · auditor-queue
- +# Verified `npm run build` + `eslint`; shipped `origin/main` @ `b3a2583`
- +# **Still mock** — no NightRaven handoff or git integration yet

**Cross-links:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### HimFLer — greenfield project bootstrap

- +# Brent asked to **put ready for use** new project **HimFLer**
- +# Shipped `scripts/bootstrap-nightraven-project.sh` — wraps `install-nightraven-framework.sh` + seeds overlay · handoff · README · `docs/PROJECT_QUICKSTART.md` · `.gitignore`
- +# Created `E:\NightRaven\HimFLer` — git init · full NightRaven + NightRaven Core stack
- +# Registry: `scripts/nightraven-projects.conf` · CURSOR_INSTALL · README · `NIGHTRAVEN_UNIFIED_PRODUCT.md`
- +# Autosync: extended safe paths to `apps/*` in hook libs
- +# Touch 3 AFTER: stop-hook shipped `origin/main` @ `044928a`; `.gitignore` app ignores committed in follow-up close

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### NightRaven monorepo — Compass merge

- +# Brent **merge all into NightRaven** — umbrella brand at public README; **NightRaven** remains portable memory framework (vocabulary layers preserved)
- +# **Compass merged** — `git subtree add --prefix=apps/compass` from sibling `nightraven-compass` @ `c91a315` (squash)
- +# **Docs** — [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) (layout · merge status · memory isolation); unified stack §13; overlay §1; [`apps/README.md`](../apps/README.md)
- +# **Deferred** — NightRaven iOS app into `apps/ios/` (repo not on machine); GitHub `nightraven` → `NightRaven` rename; archive sibling `E:\NightRaven\nightraven-compass`
- +# **Shipped** `origin/main` @ `a6a9ded` — subtree `213eaba` + wire/memory autosync; **local stragglers:** `.gitignore`, `apps/README.md`, `apps/compass/README.md` (outside autosync safe paths)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Hooks review + parallel gap-fill (post-review)

- +# Brent **REVIEW addition** — read-only review of Phase 2 hooks: after-file-edit fast path, session sync fast path, autosync conventional commit messages, bash/PS parity gaps
- +# Brent **in parallel** — executed review fixes without serial blocking: fail-open `session-stop.sh` (no `set -e`; defer append `|| true`; `nightraven_append_push_defer` awk/mv fail-open)
- +# **Unix project install** — `templates/hooks.project.unix.json` (`run-hook.sh` dispatchers); `install.sh` `hooks_os_is_windows()` picks PowerShell vs Unix manifest on project install
- +# **HOOKS_SETUP** — autosync safe-path commit on stop vs in-session "commit when asked" boundary documented
- +# **lib.sh parity** — per-file `git add` fallback when batch add fails (matches `lib.ps1`)
- +# **Copy** — `NightRaven` branding aligned in `after-file-edit` bash/PS
- +# Code shipped `e2094ec`; memory append this Touch 3 pass

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`install.sh`](../install.sh) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### NightRaven Compass Phase 1 sibling app

- +# Brent said **"in parallel"** after the Compass build packet; interpreted as execute Phase 1 with parallelized setup / implementation / verification workstreams.
- +# Created sibling app repo at `E:\NightRaven\nightraven-compass` using React + TypeScript + Vite + mock data only; committed local repo `c91a315` (`feat: build NightRaven Compass phase 1`).
- +# Built Phase 1 dashboard: app shell, sidebar placeholders, project status, current phase, next best action, progress, blocker, decision, Not Now, and recommended prompt card.
- +# Verification: `npm run build` pass · `npm run lint` pass · desktop/mobile Chrome screenshots checked; Vite watcher ignores `.codex` after temp-profile crash.
- +# No cloud remote configured for the new Compass repo this pass.
- +# Brent local full-folder backup `E:\NightRaven\nightraven-compass.rar` (2026-06-11) — includes `.git` + `node_modules` + `.codex`; prefer git remote or slim archive (exclude `node_modules`, `.codex`, `dist`) for portable backups.

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Repository backup — local + cloud (20260611-132907)

- +# Brent **make a backup** — synced `origin/main`; committed pending memory (Compass RAR Q&A) + this receipt
- +# **Cloud:** annotated tag `backup/20260611-132907` pushed to `origin`
- +# **Local:** `E:\NightRaven\nightraven-1-backup-20260611-132907.zip` (`git archive`, tracked source only) + `E:\NightRaven\nightraven-1-backup-20260611-132907.bundle` (full git history)
- +# Scope — operational backup only; no product/law behavior changes

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Repository backup — local + cloud

- +# Brent asked for a cloud and local backup of this repo; synced `main` with `origin/main`, then prepared a final pushed commit plus a timestamped local backup artifact and cloud tag.
- +# Scope — operational backup only; no product/law behavior changes.

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Polish + gap-fill — hooks, install, orchestration wire

- +# **Install parity** — `install.sh` copies `*.ps1` + `lib.ps1` alongside `*.sh`/`lib.sh` for project + `~/.cursor/hooks/nightraven/` user install
- +# **Session-start pull skip** — skip redundant pull when `.cursor/.autosync-session` recent + OK; `nightraven_should_skip_recent_pull` alias in `lib.sh`
- +# **Tier 0–1 cold start** — lean-read line in always-on rule + AGENTS **Tasking fast paths** table (non-/nightraven)
- +# **Multitask gate** — checklist polish in `templates/model-delegation-efficiency.user.mdc`
- +# **Division orchestration execute** — overlay §1 combos · NightRaven skill (pre-coding gate, Design Division, combo matrix, risk map, Final Report, fix-back loop) · Bible §9 runtime pointer; no new template scaffold
- +# **HOOKS_SETUP** — session-start pull skip, install parity, env var docs
- +# **lib.sh polish** — quoted porcelain paths; commit-msg parity with `lib.ps1`
- +# Verification — PS: after-file-edit `{}` fast path · commit-msg T2/T3 · session-start pull skip T4

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`.claude/skills/nightraven/SKILL.md`](../.claude/skills/nightraven/SKILL.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Division orchestration wire — plan (memory only)

- +# Brent supplied execution protocol — pre-coding gate (correct → intent → domains → division combos), Builder/Auditor/Design contracts, Core fix-back loop, adaptive combos, **NightRaven Final Report**
- +# Gap map — NightRaven has Builder/Auditor (+ UI auditor in `/audit`); missing Design Division, structured Builder/Auditor/Design reports, PASS/FAIL verdicts, test/typecheck gates, Final Report close
- +# Plan — phased wire: overlay §1 taxonomy + combos · Bible §9.x pointer · extend `nightraven` skill · new `design` skill · no new `templates/` scaffold; reconcile 4-combo table with TRIVIAL→CRITICAL matrix
- +# Execution deferred — plan mode; Brent says **code it** to ship

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.claude/skills/nightraven/SKILL.md`](../.claude/skills/nightraven/SKILL.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §9 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Tasking speed — hook + orchestration fast paths (`0e5c51e` partial)

- +# **Tasking** = agent work cycle (Cursor hooks Touch 1/3 + autosync, NightRaven Phase 0, §2.8 subagent discipline) — not a task queue
- +# Hook fast paths — `after-file-edit` early `{}` for non-memory paths; `session-stop` skip pull when session-start recent + clean tree; Touch3 cache; Tier 0–1 lean-read nudge in session-start; session marker + `NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC` in `lib.ps1`/`lib.sh`
- +# NightRaven skill — **Tasking fast paths** table (subagents inherit assessment; TRIVIAL/LOW condensed paths)
- +# Docs — [`HOOKS_SETUP.md`](HOOKS_SETUP.md) troubleshooting; `.gitignore` hook markers (`.cursor/.autosync-session`, `.cursor/.touch3-cache`)
- +# Verification — clean stop ~1.7s vs ~3.8s; hook test autosync committed+pushed hook batch (`0e5c51e`); **remaining uncommitted:** `.gitignore`, `.claude/skills/nightraven/SKILL.md`, handoff

### Touch 3 AFTER — tasking-speed push-latency close (`f4b6a9f`)

- +# **Supersedes** "remaining uncommitted" above — Brent "fix commit push"; session-stop hook autosync committed+pushed 5 files (`f4b6a9f`); `origin/main` clean; prior division-orchestration memory in `21d9cd2`

### Autosync conventional commit messages (session-stop)

- +# Brent asked descriptive autosync commits — replace generic `chore(sync): session autosync [cursor hook]` with path-aware conventional subjects (`docs` / `fix(hooks)` / `chore: session sync - …`) + optional file body
- +# `lib.ps1` — `Get-NightRavenAutosyncCommitMessage`; `lib.sh` — `nightraven_autosync_commit_message`; wired into `Invoke-GitSessionCommit` / `nightraven_git_session_commit`
- +# Docs — [`HOOKS_SETUP.md`](HOOKS_SETUP.md) stop hook + troubleshooting; fast path unchanged when nothing to sync

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md)

### Touch 3 AFTER — changelog orphaned MCP section fix (`3a0e23f`)

- +# Bug report lines 114–117 — **not orphaned** (belongs to Cursor Always Sync autosync hooks section)
- +# Fixed real orphan — MCP launcher bullets lacked `###` heading; added **MCP launcher automatic dependency installation**; corrected `.cursor/mcp/run-memory-chain-mcp.js` cross-link

**Cross-links:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Touch 3 AFTER — combined NightRaven + NightRaven installer (`276fe5e`)

- +# Shipped [`scripts/install-nightraven-framework.sh`](../scripts/install-nightraven-framework.sh) — wraps `install.sh`, adds NightRaven skill + ledgers + overlay/AGENTS cross-links
- +# Recommendation — stack both on app projects; `install.sh` only for generic repos
- +# Wired [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) + [`README.md`](../README.md)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Touch 3 AFTER — hook close (merge-to-one Q&A)

- +# Brent asked what if **NightRaven** and **NightRaven** become only one
- +# Core answered merge types (repo/brand/orchestrator/product), gains/losses, sane shapes (monorepo two boundaries, brand-only, absorption); recommended NightRaven-scoped runtime + portable standard **or** monorepo with `packages/nightraven` + `apps/ios`
- +# Do not collapse vocabulary layers; **Critical** governance if true product merge
- +# Hook stop — pull OK · no safe dirty · push skipped (not ahead); Q&A only; no code

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Touch 3 AFTER — hook close (NightRaven vs NightRaven Q&A)

- +# Brent asked relationship between **NightRaven** and **NightRaven**
- +# Core clarified — NightRaven = memory/oversight **framework repo** (Bible, adoption, `+#` chain); NightRaven = **consumer app** + NightRaven Core orchestration in separate repo (§2.6); three division maps remain vocabulary layers; portable vs NightRaven-scoped taxonomy **TBD** unchanged
- +# Hook stop — pull OK · no safe dirty · push skipped (not ahead); Q&A only; no code

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md)

### Touch 3 AFTER — hook close (Q&A division scope + clean tree)

- +# Brent asked whether portable standard vs NightRaven-scoped division maps and background subagent batches are "different versions"
- +# Core clarified — three division maps are **vocabulary layers** (NightRaven proposal · NightRaven runtime · Bible §9 virtual teams), not product forks; portable vs NightRaven-scoped is a **scope slot** (overlay §1 TBD), not a version split; sequential subagent commits are timeline, not competing versions
- +# Hook stop — pull OK · commit skipped (no safe dirty) · push skipped (not ahead); Q&A only; no code

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

### Touch 3 AFTER — strategic Q&A recommendations batch (execute all lanes)

- +# **Architect Division** — overlay §1 vocabulary; Bible §9 pointer (gap map, not seventh virtual team); AGENTS Reference wired
- +# **Repeated intentions (continuity engine)** — overlay §1 one-row Tier 1 summary; pointer handoff + Bible §3
- +# **Division taxonomy scope** — overlay §1 marked **TBD** (portable standard vs NightRaven-scoped); no decision for Brent
- +# **Claude adoption kit (#15)** — [`CLAUDE_ADOPTION.md`](CLAUDE_ADOPTION.md); CURSOR_INSTALL + README cross-links
- +# **Composer Brief §4** — refreshed current state (MCP shipped, autosync, pre-coding plan, division taxonomy memory)
- +# **Windows autosync fix** — `lib.ps1` `Invoke-GitSessionCommit` uses `Invoke-GitInRoot` batch add + per-file fallback; quoted path strip in `Get-SafeDirtyFiles`; `HOOKS_SETUP.md` troubleshooting (+#)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`CLAUDE_ADOPTION.md`](CLAUDE_ADOPTION.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Touch 3 AFTER — strategic Q&A session close (guidance only)

- +# Brent asked what's next for NightRaven — Core answered five priority lanes: #15 Claude adoption kit · Architect Division memory wire · repeated intentions → overlay · autosync Windows hardening · fresh thread at ~80%
- +# Ask mode — guidance only; execution deferred to follow-up agent run (`+#` only)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_CURSOR_COMPOSER_BRIEF.md`](NIGHTRAVEN_CURSOR_COMPOSER_BRIEF.md) §4

### Touch 3 AFTER — hook close (recommendations batch flush)

- +# Hook stop — pull OK · commit skipped (no safe dirty at stop) · push skipped (not ahead)
- +# **Unexpected** — prior background agent left safe-path batch uncommitted: `CLAUDE_ADOPTION.md`, Architect Division (Bible §9 pointer + overlay), repeated intentions overlay, composer brief, `lib.ps1` quoted-path fix, install/README cross-links
- +# On origin already — repeated intentions memory (`a5a9d1f`), autosync bash parity (`7aa4df3`), composer brief base (`cf5b3db`); Touch 3 agent flush commit+push this pass

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`CLAUDE_ADOPTION.md`](CLAUDE_ADOPTION.md) · [`NIGHTRAVEN_CURSOR_COMPOSER_BRIEF.md`](NIGHTRAVEN_CURSOR_COMPOSER_BRIEF.md)

### Touch 3 AFTER — session close (Final Report + autosync push `a5a9d1f`)

- +# Session exit — pre-coding NightRaven Final Report re-delivered; no implementation
- +# Autosync on stop succeeded — pull OK · commit 3 memory files · push `origin/main` (`a5a9d1f`)
- +# **Supersedes** changelog line below re push-skipped — memory batch now on origin

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Touch 3 AFTER — pre-coding orchestration + repeated intentions (memory only)

- +# Session close — pre-coding orchestration protocol applied (correct → intent → domains → divisions → Final Report); **repeated intentions** catalog extracted from handoff + Bible §3 for continuity engine
- +# Plan stored — `.cursor/plans/pre-coding_orchestration_report_830f7a0e.plan.md`; no code; next task awaits ship signal
- +# Autosync hook on stop — pull OK; commit skipped (`git add failed` fail-open); push skipped (not ahead)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Touch 3 AFTER — division taxonomy plan (memory only)

- +# Brent proposed **11-division** NightRaven structure — Product, Research, Architect, Builder, Design, QA, Security, Auditor, Documentation, DevOps + Core
- +# Gap map documented — NightRaven has 4 runtime divisions; Bible §9 has 6 virtual teams; **Architect Division** is top gap
- +# Phase 0 scope — overlay §1 + Bible §9.x memory wiring only; no code; open question: portable standard vs NightRaven-scoped

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §9 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

### Touch 3 AFTER — session close (division + autosync + settings check)

- +# Consolidated session record — division taxonomy plan, Always Sync PARTIAL verdict (pre-autosync), autosync hooks shipped (`ed7f200`, `7aa4df3`), workspace settings shipped (`4f7d808`)
- +# Handoff guardrails updated — Phase 2 hooks now document real git autosync on session boundaries

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Cursor/VS Code workspace editor settings (`4f7d808`)

- +# **User vs workspace split** — global Cursor user `settings.json` for cross-project prefs; repo `.vscode/settings.json` for NightRaven docs/memory workflow
- +# Workspace choices — `docs/` searchable; `mcp-server` build + secrets excluded; markdown no format-on-save (`+#` law); `.mdc` as markdown; PowerShell default terminal (matches Windows hooks); `git.autofetch` complements hook pull/push
- +# Added `.vscode/settings.json`, `extensions.json`, [`.vscode/README.md`](../.vscode/README.md); `HOOKS_SETUP.md` ↔ workspace settings cross-link

**Cross-links:** [`.vscode/README.md`](../.vscode/README.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Cursor Always Sync autosync hooks

- +# **Always Sync enforcement in hooks** — `session-start.ps1` runs `git pull --ff-only`; `session-stop.ps1` runs pull → safe-path stage/commit → `git push origin HEAD` (fail-open; never force push; no `--no-verify`)
- +# Added `.cursor/hooks/lib.ps1`, `session-start.ps1`, `session-stop.ps1`, `after-file-edit.ps1`; updated bash `lib.sh`, `session-start.sh`, `session-stop.sh`; added `run-hook.sh` Unix dispatcher
- +# Updated `.cursor/hooks.json` — PowerShell commands, 30s/60s timeouts for git network
- +# Safe commit scope: `docs/`, `.cursor/`, templates, examples, scripts, mcp-server, AGENTS.md, README.md; excludes `.env` and secret patterns
- +# Push failure appends defer line to `docs/14_SESSION_HANDOFF.md` Recent sessions (+# only)
- +# `docs/HOOKS_SETUP.md` — Always Sync autosync section, Windows vs Unix paths, troubleshooting

**Cross-links:** [`.cursor/hooks.json`](../.cursor/hooks.json) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Bible §2.9 — Always Sync + Governed Bypass + Local vs Cloud

- +# Added **§2.9** to `37_NIGHTRAVEN.md` as a new portable law section covering Always Sync, Governed Bypass protocol, and Local vs Cloud execution modes
- +# Updated ToC + §0 sixty-second glance table in Bible to reference §2.9
- +# Merged §2.9 laws into `AGENTS.md` Core Laws, Common Mistakes, and Reference
- +# Merged into `NIGHTRAVEN_UNIFIED_STACK.md` §1 cross-layer laws table + §10 Risks + Quick Ref card

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) · [`AGENTS.md`](../AGENTS.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md)

### Composer audit wiring pass (2026-06-11)

- +# `37_NIGHTRAVEN.md` §6 — appended three anti-pattern rows: Forgotten sync, Silent bypass, Local-mode subagents; updated ToC blurb
- +# `NIGHTRAVEN_LAYERED_SPEC_ROUTER.md` — added Execution mode row to layer table; `git pull`/`git push` to Before/After agent card rows; Execution mode blurb with link to LOCAL_VS_CLOUD
- +# `NIGHTRAVEN_SESSION_SPEC_TREES.md` — Always Sync wired into All-tiers law and Record Everything header
- +# `NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md` — Always Sync added to Laws; local vs cloud execution mode paragraph added
- +# `CURSOR_INSTALL.md` — Portable Bible row updated with §2.9 scope; Local vs Cloud clarification (framework-only; consumers get via vendored Bible)
- +# `MCP_SETUP.md` — Mode-agnostic operating rule + LOCAL_VS_CLOUD added to Related
- +# `HOOKS_SETUP.md` — `session-stop.sh` push nudge documented; Always Sync step added to bootstrap checklist; §2.9 citation
- +# `templates/nightraven-context-intent.user.mdc` — Always Sync, Governed Bypass, Local vs Cloud lines added
- +# `templates/docs/NIGHTRAVEN_REPO_OVERLAY.md` — starter vocabulary rows for four new terms
- +# `docs/04_LEARNING_LOG.md` — Governed Bypass pattern entry
- +# `docs/NIGHTRAVEN_CURSOR_COMPOSER_BRIEF.md` — self-contained Composer onboarding brief created

**Deferred:** `docs/35_FAST_START.md` and `docs/36_PROJECT_ISOLATION.md` are phantom docs (referenced in Bible but not yet created); creation deferred — larger scope.

**Cross-links:** Full wiring pass across `docs/` + `templates/` + AGENTS.md · commit `bb54d80` + `cf5b3db`

### MCP launcher automatic dependency installation

- +# Added automatic dependency installation (`npm install`) and compile build (`npm run build`) logic directly into Node MCP launcher
- +# Updated template (`templates/mcp/run-memory-chain-mcp.js`) and active workspace instance (`.cursor/mcp/run-memory-chain-mcp.js`)

**Cross-links:** [`templates/mcp/run-memory-chain-mcp.js`](../templates/mcp/run-memory-chain-mcp.js) · [`.cursor/mcp/run-memory-chain-mcp.js`](../.cursor/mcp/run-memory-chain-mcp.js) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Design local vs cloud execution modes


- +# Authored local vs cloud execution design spec ([`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md))
- +# Detailed hardware, context window, and concurrency constraints for LM Studio local sessions
- +# Documented parallel subagent loops, long-context continuity, and token-cost discipline for Cloud execution

**Cross-links:** [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### Always Sync changes workflow


- +# Added **Always Sync** rule to overlay vocabulary (`NIGHTRAVEN_REPO_OVERLAY.md`) and rule files (`nightraven-context-intent.mdc`)
- +# Configured workflow to run `git pull` followed by git add/commit/push on every change

**Cross-links:** [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### README gap-fill follow-up


- +# Saved follow-up backup branch `backup/pre-gap-fill-20260611-184524` at `2251fdf9a9859b6e8a1bed717eaa298acb018412` before edits
- +# Filled README decision gaps after polish feedback — added **Fit check** and **Normal agent session** sections so new readers can decide when to use NightRaven and see the concrete session loop before install
- +# Scope stayed public README + append-only memory; no law rewrite, no new templates, no implementation files

**Cross-links:** [`README.md`](../README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Tier C README polish + backup ref

- +# Saved pre-polish backup branch `backup/pre-polish-20260611-184206` at `73fd0b27dd670f485d9f995a8959fda3cec2acc5` before edits
- +# README first-minute polish — added **In 60 seconds** evaluation block, clarified project-work-not-people framing, renamed duplicate **How it works** heading to **Flow**, and tightened quick-start evaluation path
- +# Scope stayed public-copy/entry-path only; no framework-law rewrite, no new templates, no implementation files

**Cross-links:** [`README.md`](../README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### External candidate shortlist — adjacent "god-tier" coders

- +# Local registry remains limited to `nightraven`, `UAIPOS`, `NightRaven`, and `~/.cursor`; no new adopters found in-repo
- +# External shortlist for further hunting: memory layers (`Mem0`, `Letta`, `Memori`, `OpenViking`), git-native repo memory (`GitAgent`, `Agents Remember`, `AGENTS.md`), and coding agents (`OpenCode`, `Goose`, `Plandex`, `PR-Agent`)
- +# Use these as comparison points for the research map or future inventory expansion, not as local app memory
- +# NightRaven practical lane narrowed by Brent: **PR-Agent** for PR review automation; **Plandex / Goose** for coding-session execution workflows; defer memory-layer candidates

**Cross-links:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

## 2026-06-10

### Touch 3 — NightRaven adoption batch session close

- +# Session arc — inventory ship name → app oversight rebrand → repo folder + GitHub rename; nightraven orchestration only for path/registry (§2.6); app overlay/handoff in NightRaven repo
- +# **Shipped on origin:** `d4d47c5` · `f03a39a` · `53cd9f1` · `b654b68` — noreply author+committer; push-latency §2.8 satisfied
- +# **Open:** NightRaven app memory docs uncommitted locally; Xcode target rename until **code it**

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) §3 · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §12 · [`AGENTS.md`](../AGENTS.md) · [`scripts/nightraven-projects.conf`](../scripts/nightraven-projects.conf)

### NightRaven — repo folder + GitHub rename

- +# Brent — rename consumer app repo **BankrollCalendar → NightRaven** — local path `~/Developer/NightRaven`; GitHub `brennin0820/NightRaven` (private); `nightraven-projects.conf` + inventory §3 + unified stack §12 updated
- +# Xcode target **OneDayMillionaire** unchanged; historical handoff/changelog lines referencing BankrollCalendar kept (`+#` only)

**Cross-links:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) §3 · [`scripts/nightraven-projects.conf`](../scripts/nightraven-projects.conf)

### NightRaven — app repo local rebrand (orchestration)

- +# Brent — replace active **NightRaven / NightRaven** labels with **NightRaven** in BankrollCalendar agent chain; ship name + local oversight unified under NightRaven
- +# **Not in scope:** nightraven framework repo rename; Xcode target OneDayMillionaire; framework file paths (`NIGHTRAVEN_*`, `nightraven-context-intent.mdc`)
- +# Inventory §3 oversight row — NightRaven (was NightRaven in app repo)

**Cross-links:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) §3 · NightRaven `docs/NIGHTRAVEN_REPO_OVERLAY.md`

### NightRaven — consumer app ship name (inventory metadata)

- +# Brent updating product identity to **NightRaven** (BankrollCalendar adopter) — NGIA platform naming aligns with ship name; **Xcode target/scheme still OneDayMillionaire** until explicit app-repo rename
- +# Framework repo wired — `scripts/nightraven-projects.conf` label, `NIGHTRAVEN_PROJECT_INVENTORY.md` summary + §3 vocabulary layers; app overlay/handoff/changelog remain in BankrollCalendar (§2.6)

**Cross-links:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §12 · [`scripts/nightraven-projects.conf`](../scripts/nightraven-projects.conf) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`AGENTS.md`](../AGENTS.md)

### agent-skills plan — status Q&A session close

- +# Brent @-referenced merge-decision plan; agent verified wire already complete at `2fd264c` (unified stack §2·§6, overlay, `CURSOR_INSTALL.md`, `AGENTS.md`); no new vendor or wire this session — deferred items unchanged (install flag, research-map todos)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · `.cursor/plans/agent-skills_merge_decision_7be1bdd7.plan.md`

### agent-skills merge evaluation — reject core, optional L4

- +# Brent asked merge [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — 23 lifecycle skills (spec/build/test/review/ship) vs NightRaven oversight stack
- +# Verdict — **reject** git vendor/subtree into nightraven core; **Adapt (optional L4)** for consumer app repos **after** ship signal (`code it` / `implement` / `build`); NightRaven owns intent + memory (L0–L3), agent-skills owns implementation discipline when shipping
- +# Conflicts documented — agent-skills defaults spec/build-first vs Bible §2.8 intent ladder; `context-engineering` skill vocabulary collision with NightRaven §3; framework bloat vs Phase 1 lean bootstrap
- Plan artifact: `.cursor/plans/agent-skills_merge_decision_7be1bdd7.plan.md`; unified stack §2 row + CURSOR_INSTALL pointer **deferred** until Brent says execute plan
- +# **Supersedes (wire complete):** Plan executed — unified stack §2 **Adapt (optional L4)** row + §6 implementation-skills blurb; `CURSOR_INSTALL.md` optional section (upstream [cursor-setup.md](https://github.com/addyosmani/agent-skills/blob/main/docs/cursor-setup.md), not vendored; no `install.sh --with-engineering-skills` yet); overlay + AGENTS.md Reference cross-links verified

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · §6 · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

### GH007 — push blocked by GitHub private-email protection

- +# Diagnosed `git push origin main` rejection — remote **GH007**; unpushed commits `90dea74`, `6a2f405`, `b895162` all author `brentlennin0820@gmail.com` while GitHub **Keep my email private** / block CLI expose is enabled
- +# Remediation documented — (A) [github.com/settings/emails](https://github.com/settings/emails) allow push or public email; (B) rebase amend author to `172115324+brennin0820@users.noreply.github.com`; set `user.email` noreply for future commits
- +# Push-latency §2.8 — still **deferred** until Brent applies A or B (3 commits ahead; MCP `b895162` committed locally)
- +# **Supersedes (push landed):** Push-latency §2.8 — still **deferred** until Brent applies A or B (3 commits ahead; MCP `b895162` committed locally)
- +# **GH007 resolved** — rebase `origin/main..HEAD` with noreply author **and** `GIT_COMMITTER_EMAIL` on amend; pushed `614ff27` · `4bd993a` · `20adc26` to `origin/main`; author-only amend insufficient (committer still exposed Gmail)
- +# Follow-up — `origin/main` clean but `git config user.email` still private Gmail; agents must set noreply on commit (env or repo config) or GH007 returns on next push

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

### NightRaven NGIA — cross-repo R&D orchestration (plan + adopter pilot)

- +# Brent **NightRaven Global Interaction Architecture (NGIA)** — platform-wide editable-component interaction framework; R&D plan authored in nightraven workspace (`.cursor/plans/nightraven_ngia_r&d_283a8de5.plan.md`)
- +# **Implementation isolated to BankrollCalendar pilot** — `docs/NGIA/` (standards, gap matrix, HIG/Material/Fluent research, architecture, POC doc) + `OneDayMillionaire/NGIA/` (InteractionEngine, EditableContainer, NightRavenPlatformRoot); `EntryListItem` migrated; build + 38 tests pass — **not** nightraven framework code (§2.6 app memory)
- +# §2.7 defer — NGIA vocabulary stays adopter-local until 2+ apps prove universal; no overlay slot in this repo

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §2 · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.6 · §2.7 · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

### External research map — NightRaven positioning vs adjacent fields

- +# Online synthesis — no single paper/product matches NightRaven; closest partial overlaps: Intent Engineering, Intent Signal Theory (arXiv:2605.25058), Continuum Memory Architecture (arXiv:2601.09913), STITCH/MemGuide/MemFlow (intent-aware retrieval), RECAP (conversation→goal rewrite), Reflexion/MPR/Memento 2 (reflective compounding), git-native agent memory (AGENTS.md, agentsge, agent-memory)
- +# Distinctive NightRaven stack confirmed: interpretation engine (Bible §3) + compounding loop (§1) + intent ladder + `+#` epistemology + project isolation (§2.6) + git L0 truth — **project-evolution oversight**, not session-only agent memory
- Plan artifact: `.cursor/plans/nightraven_research_map_b4b6f06f.plan.md`; optional wire to overlay/unified stack §2 deferred
- +# Second-pass validation (continuation thread) — independent web search affirmed composed architecture; expanded citations (Goal-Mem, PRISM, GCC); proposed **GIRMA** (Governed Intent-Reconstruction Memory Architecture); overlay §1 vocabulary wired

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · §3 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

### Phase 2 MCP — memory-chain tools (stdio)

- +# `mcp-server/` — TypeScript stdio MCP: `nightraven_list_memory_slots`, `nightraven_get_read_order`, `nightraven_read_memory`, `nightraven_search_memory`, `nightraven_append_recent_session` (+# only on handoff)
- +# `.cursor/mcp.json` + `.cursor/mcp/run-memory-chain-mcp.sh` — Cursor registration; `install.sh` installs per project (`--no-mcp` to skip)
- +# `docs/MCP_SETUP.md` — build, enable, path resolution (`NIGHTRAVEN_PROJECT_ROOT`, `NIGHTRAVEN_INSTALL_ROOT`); git authoritative over any external index
- README layout + `docs/CURSOR_INSTALL.md` MCP verification step wired

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`MCP_SETUP.md`](MCP_SETUP.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §9 Phase 2 · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · `mcp-server/` · `install.sh`

### Update god's eye — lint green + UAIPOS §1/§3 vendor

- +# Handoff **Recent sessions** date-order fixed (#4) — newest-first; `nightraven-lint handoff` passes
- +# UAIPOS master `docs/37_NIGHTRAVEN.md` — cherry-pick §1 Identity + Continuous learning, §2.8 Task worthiness, §3 five-step / Understand before respond / Interpretation framework from published nightraven
- Snapshot sync verified; handoff Current state → `0258e44`
- Touch 3 AFTER: global rule refresh via `install.sh --user --force-rule`; lint all green; push deferred (GH007 private-email on origin)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · §2.8 · §3 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · `scripts/lint-framework-memory.sh`

## 2026-06-09

### Touch 3 session close — backlog batch on main

- Session exit: `ef017d9` pushed; push-latency §2.8 satisfied; snapshot lint OK; handoff #4 date-order deferred

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8

## 2026-06-09

### BACKLOG #1 #8 #2 #5 — push-latency, canonical scope, snapshot lint

- +# Bible §2.8 **push-latency law** — push before Touch 3 exit or explicit defer in Recent sessions
- +# `NIGHTRAVEN_PROJECT_INVENTORY.md` **Canonical Bible scope (#8)** — published nightraven canonical; UAIPOS upstream; snapshot not authoritative
- +# `scripts/sync-snapshot.sh` (LOOP step 7) + `scripts/lint-framework-memory.sh` (snapshot drift, handoff date-order heuristic)
- Touch 3 re-enabled — removed `.cursor/touch3.disabled` markers; `session-stop.sh` push reminder
- Loop workspace `README.md` + `LOOP_MODE.md` live-sources / authority pointers updated (outside repo)

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

## 2026-06-09

### Post-merge audit + safe polish

- Parallel audit: snapshot Bible/overlay/rule match live (680 lines); Bible §0 cherry-picks + §2.6 upstream pointer VERIFIED; hooks + `nightraven-flow.png` OK
- **Fix:** stale overlay/rule/handoff lines claimed stop hook removed — corrected to marker-only pause (post `e2c4885`)
- README identity paragraph → pointer-only (#11); inventory scan row refreshed

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md)

## 2026-06-09

### Merge prep executed — doctrine batch + hooks/assets (2 commits)

- Shipped uncommitted §1 Identity + Continuous learning & compounding; §3 Understand before respond + Interpretation framework
- Cherry-picked UAIPOS §0: loop cycle types glance row + canonical-card scope paragraph
- +# §2.6 master upstream pointer (UAIPOS §2.7 Upstream); kept published §2.7 promote-to-standard as canonical
- Restored default `stop` hook with `touch3.disabled` pause path; `.gitignore` local marker; README flow diagram at `docs/assets/nightraven-flow.png`
- Loop workspace snapshot sync (step 7) after push

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §0 · §1 · §2.6 · §3 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`README.md`](../README.md)

### NightRaven ecosystem benchmark — adopt/adapt/reject map (Q&A)

- Mapped NightRaven-adjacent repos (nightraven, UAIPOS, BankrollCalendar, Memory Bank variants, hooks/MCP tooling) against unified stack §2 layers
- **Adopt:** git-native memory chain, `+#` only, install.sh, optional hooks, project inventory metadata
- **Adapt:** per-repo overlay, consumer-app §2.8 task-worthiness, loop workspace snapshot (reference-only)
- **Reject:** cross-repo handoff bleed, surveillance framing, template spam per cycle, third canonical Agent card copies
- **Positioning:** confirms **git-native fourth camp** — durable repo memory vs chat-only, vs IDE rules-only, vs external KB SaaS

**Cross-links:** [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

## 2026-06-09

### Loop workspace audit — three-Bible drift + backlog prioritization (plan only)

- Read `~/NightRaven/LOOP_MODE.md`, `BACKLOG.md`, `NightRaven-Docs-extracted/` snapshot vs live `nightraven` chain
- **Finding:** snapshot frozen pre-§2.7/§2.8/§3 doctrine (509 lines); published `nightraven` Bible 675 lines (471 uncommitted); UAIPOS master 566 lines — §2.7 semantics differ (upstream vs promote-to-standard); loop workspace live-sources table omits published repo
- Prioritized 13 Brent-queued backlog items; suggested cycle order: ship batch → push-latency (#1) → date-order (#4) → single-source (#8) → lint cluster (#5+#2)
- **Blocked on:** Brent canonical-scope decision for #8 before sync/lint/version stamp

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §8 Phase 3 · `~/NightRaven/BACKLOG.md`

## 2026-06-09

### Bible §3 — Interpretation framework (AI answers intention)

- Brent context: interpretation engine — not Input→Response only; reconstruct vision from compressed fragments
- +# §3 **Interpretation framework** — 4 layers, pipeline, continuity, ambiguity resolver, usage protection, auto-prompt builder; links §1 compounding
- Wired rule, overlay, `AGENTS.md`; learning log + handoff

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md)

## 2026-06-09

### Bible §3 — Understand before respond (mental model)

- Brent context: understand concept/context/idea before suggestions — learn why not just what
- +# §3 **Understand before respond** — vocabulary table, short commands, NightRaven agent card; default meaning table row
- Wired rule, `AGENTS.md`; learning log + handoff

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`AGENTS.md`](../AGENTS.md)

## 2026-06-09

### Bible §1 — learning doctrine synthesis (+# enrichment)

- Brent refined doctrine prose — compounding intelligence layer, not memory-only storage
- +# §1: beyond storage (memory vs learning system loops), curious-human reflection prompts, "nothing static"; one-liner adds communicate
- Learning log pattern appended

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

## 2026-06-09

### Touch 3 fix — stacked AFTER passes (§2.8)

- Brent: fix Touch 3 — prior thread stacked multiple AFTER passes for learning-doctrine session (§2.8 anti-pattern)
- Canonical close consolidated in handoff **Recent sessions**; redundant stacked lines marked **Supersedes**
- Learning log pattern appended; one AFTER for this fix pass

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

## 2026-06-09

### Touch 3 AFTER — learning doctrine session close

**Supersedes:** stacked Touch 3 pass — canonical doctrine entry below; handoff consolidated per §2.8.

- Record Everything: handoff **Recent sessions**, changelog, learning log; full chain cross-links verified
- Overlay pointer added for Bible §1 **Continuous learning & compounding**
- 7 files on working tree; `+#` only; uncommitted

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md) · [`README.md`](../README.md)

## 2026-06-09

### Bible §1 — Continuous learning & compounding doctrine

- Brent context: NightRaven learns continuously from actions, outcomes, and decisions — memory is mechanism, compounding learning is goal
- Added `37_NIGHTRAVEN.md` §1 **Continuous learning & compounding** — core principle, compounding loop, co-evolution, learning laws
- Wired cross-links: rule, `AGENTS.md`, README; learning log + handoff
- Touch 3 AFTER — `+#` only; uncommitted

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`AGENTS.md`](../AGENTS.md)

## 2026-06-09

### Touch 3 AFTER — NightRaven identity dedup verify

- Verified prior pass: Bible §1 Identity, rule, overlay, `AGENTS.md`, README, changelog, learning log wired
- Marked duplicate learning log NightRaven identity block **Supersedes** (append-only dedup)
- Cross-links intact; push pending

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md)

## 2026-06-09

### Bible §1 — NightRaven identity (collective legendary mastery)

- Brent context: NightRaven identity — embodiment of legendary coders; collective mastery transcending individual identities; symbol of coding excellence
- Added `37_NIGHTRAVEN.md` §1 **Identity** subsection; operational expression → §10 Tier C (no §10 duplication)
- Wired cross-links: rule, `AGENTS.md`, README, overlay; learning log + handoff
- Touch 3 AFTER session close — 8 files on working tree; `+#` only; uncommitted

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md)

## 2026-06-09

### Public README — follower-worthy positioning

- Brent: rewrite public pitch for strangers (10-second comprehension); keep Bible/BAIC/Tier C internal
- README hero: tagline *AI agents forget. NightRaven makes your repo remember.*; badges; Before/After; copy-paste starter prompt; flow diagram
- Public motto: *Remember the work. Protect the context. Prevent wasted effort.* — replaces surveillance-sounding front-page copy
- Added `docs/assets/nightraven-flow.png`; `AGENTS.md` one-line public pitch pointer
- GitHub metadata: description + topics via `gh repo edit`

**Cross-links:** [`README.md`](../README.md) · [`AGENTS.md`](../AGENTS.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

## 2026-06-09

### §2.8 shipped on main (`bfad585`)

- Touch 3 ship record after BankrollCalendar promotion commit
- **Source adopter:** `brennin0820/BankrollCalendar` — `364cd1a` on `feat/onedaymillionaire-ios` (task-worthiness gate + Touch 3 memory chain)
- **Portable:** Bible §2.8, rule Task worthiness, router Agent card, overlay §4, optional delegation template
- **App-local (not promoted):** balance-card vocabulary, shortcuts audit, OneDayMillionaire domain — stay in consumer overlay

**Touch 3 wired:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

## 2026-06-09

### Bible §2.8 — Task worthiness (promoted from BankrollCalendar)

- Brent: sync OneDayMillionaire NightRaven learnings → published standard
- Added `37_NIGHTRAVEN.md` §2.8 — plan until **code it**; one Touch 3 AFTER; fresh thread when heavy; subagents for substantial work only
- §0 glance + Agent quick start mistakes + §3 default-meaning rows + §6 anti-patterns
- Wired rule, template rule, router Agent card, overlay §4 pitfalls, `AGENTS.md`, optional `templates/model-delegation-efficiency.user.mdc`
- Learning log: task-worthiness + monolith PR split pattern

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §4 · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

## 2026-06-10

### Bible §3 — Unclear messages (honor intent)

- Brent context: when message unclear — rewrite in clear English, infer meaning, list 2–3 interpretations if tied, explain ambiguity; never assume Brent is wrong
- Added `37_NIGHTRAVEN.md` §3 subsection + §0 Before/common mistake/anti-pattern rows; wired rule, `AGENTS.md`, overlay, learning log

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`AGENTS.md`](../AGENTS.md)

### Bible §3 — Unclear coding ideas (clarify before code)

- Brent context: unclear coding idea → rewrite, identify goal/module/concept, likely + 1–2 alternatives, plain-term glossary; no code unless asked (§2.8)
- Added `37_NIGHTRAVEN.md` §3 subsection + anti-pattern; wired rule, `AGENTS.md`, overlay, learning log

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md)

### Bible §3 — Five-step unclear input (canonical)

- Brent context: (1) fix English (2) understand intent (3) technical translate (4) explain concept (5) ask only if truly unclear; merged prior §3 subsections
- Wired rule, `AGENTS.md`, overlay, learning log, router

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

**Touch 3 wired:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md) · [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Shipped on `main` — `60b26b8`

- Commit: Bible §3 five-step unclear input — fix English, intent, technical translate, explain, ask if truly unclear; no code until ship signal

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`AGENTS.md`](../AGENTS.md)

---

### Bible §2.7 — Promote universal to standard

- Brent context: cross-app docs/code → **published standard**; stop re-instructing "add X" every session
- Added `37_NIGHTRAVEN.md` §2.7, §6 anti-pattern, §3 default-meaning row, §0 glance row
- Wired overlay vocabulary, rule law line, learning log, unified stack adopt/reject, handoff **Recent sessions**

**Cross-links:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.7 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §1–2

**Touch 3 wired:** [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) portable §2.7 note · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

### §2.7 prose simplified (Tier C pass)

- Condensed Bible §2.7 from multi-table spec to one rule + one table; same law
- Shortened overlay, rule, `AGENTS.md`, learning log, unified stack, handoff guardrail lines

**Touch 3 wired:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.7 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

### Shipped on `main` — `1efbdba`

- Commit: Bible §2.7 cross-app standard law + simplified chain pointers (rule, overlay, `AGENTS.md`, handoff, unified stack)

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.7 · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

### Shipped on `main` — `40a88fe`

- Touch 3 memory: handoff **Recent sessions** + ship note after `1efbdba` push

**Cross-links:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`AGENTS.md`](../AGENTS.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.7

---

### Project inventory — cross-repo NightRaven scan

- Added `docs/NIGHTRAVEN_PROJECT_INVENTORY.md` — nightraven, UAIPOS, BankrollCalendar, `~/.cursor` metadata (no app-memory bleed)
- Added `scripts/scan-nightraven-projects.sh` + `scripts/nightraven-projects.conf` — refreshable artifact/phase report
- Wired `NIGHTRAVEN_UNIFIED_STACK.md` §12, README artifact table + layout

**Cross-links:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §12

**Touch 3 wired:** [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) inventory row · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §3 · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

---

## 2026-06-09

### Cursor installer — `install.sh` + global `~/.cursor` path

- Added `install.sh` — project bootstrap (rule, vendored Bible, L3 docs, hooks) and `--user` global install
- Added `CURSOR_INSTALL.md` — verification steps (Settings → Rules, Hooks, test session)
- Hooks: `lib.sh` resolves `workspace_roots` + sets `NIGHTRAVEN_PROJECT_ROOT` / `NIGHTRAVEN_ROOT` at `sessionStart`
- Templates under `templates/` for handoff, changelog, learning log, overlay, `AGENTS.md`, user rule, `hooks.user.json`
- Lean `nightraven-context-intent.mdc` START HERE table (Bible fallback via `NIGHTRAVEN_ROOT`)

**Cross-links:** [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`README.md`](../README.md)

**Shipped:** `a14ac10` on `main` — Brent user install at `~/.cursor/rules/` + `~/.cursor/hooks/nightraven/`; BankrollCalendar project install verified.

### Phase 2 — optional Cursor hooks (commits `1c4f1ef`, `4be2992`)

- Added `.cursor/hooks.json` with `sessionStart`, `stop` (`loop_limit: 1`), and `afterFileEdit` hooks
- Added bash scripts under `.cursor/hooks/`: `session-start.sh`, `session-stop.sh`, `after-file-edit.sh`, `lib.sh` (JSON escape without `jq`)
- Added `docs/HOOKS_SETUP.md` — enable/disable, per-hook behavior, soft vs CORE enforcement
- Wired README: artifact table, quick-start step 6, repository layout
- **Fix:** bash 3.2 (macOS) misparses `God's` inside `"$(cat <<EOF …)"` heredocs — use `message+=` concatenation or unquoted heredoc with variable substitution outside the apostrophe token

**Cross-links:** [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §8 · [`NIGHTRAVEN_SESSION_SPEC_TREES.md`](NIGHTRAVEN_SESSION_SPEC_TREES.md) §3
## 2026-08-14 — Compass active-claim-only catalog evidence

- Added safe, contained discovery for active claims whose targets are clean in Git or absent from the fixed monitor catalog.
- Made canonical claim JSON authoritative and fail-closed for blank, malformed, or unsupported structures; retained owner-aware legacy fallback only when the canonical file is absent.
- Added canonical monitor regressions for claim-only rows, source precedence, supported JSON shapes, containment, duplicate suppression, missing targets, and release ownership.
- Verified 14 monitor tests, 4 SSR-rendered monitor tests, production build, lint, and a 97/100 scoped re-audit with no Critical/High/Medium findings.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md)

## 2026-08-19 — Compass strict canonical claim-array evidence

- Made authoritative claim arrays fail closed when any member is numeric, boolean, null, blank, or whitespace-only instead of silently collecting an incomplete empty/current set.
- Preserved valid path strings, claim objects, nested arrays, and keyed maps; added regressions for invalid primitive-only, mixed, blank, top-level, and valid nested shapes.
- Verified 17 monitor tests, the complete 29-test parser/SSR/browser gate, production build, lint, cleanup state, and a 99/100 scoped fix-back audit with no remaining findings.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md) · [`ledgers/AUDIT_LEDGER.md`](ledgers/AUDIT_LEDGER.md)

## 2026-08-26 — Compass real stalled CDP handshake evidence

- Added a real local TCP fixture that accepts the production CDP WebSocket connection but never completes the upgrade.
- Proved the connection deadline rejects promptly and closes the actual half-open peer transport, while fixture teardown force-closes residual sockets before server shutdown.
- Verified the exact retained code with 31 parser/API tests, 7 SSR tests, 6 browser/CDP tests, production build, lint, diff integrity, and clean browser/profile teardown.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md)

## 2026-08-20 — Compass pathless canonical claim-object validation

- Required objects inside canonical claim arrays and nested current-set arrays to carry a nonblank recognized path field before any claim is collected.
- Made direct named-collection record metadata without a path invalidate the authoritative source while preserving path-bearing records and keyed claim maps.
- Stopped unsafe path-bearing records as complete ignored records so traversal, foreign absolute/Windows, and symlink-escape targets cannot recurse into fabricated metadata-key claims.
- Added fail-closed and compatibility regressions; verified 26 parser/API tests, 7 SSR tests, 5 browser/CDP tests, production build, lint, cleanup, diff integrity, and a 99/100 final fix-back review.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md)

## 2026-08-20 — Compass malformed run-status evidence gate

- Required one of two explicit five-column run-status schemas, its separator, and the exact `pending` / `running` / `passed` / `failed` vocabulary while retaining compact Markdown compatibility.
- Added a distinct invalid run state that fails closed for blank, malformed, header-only, unknown-schema, unsupported-state, duplicate-empty, and mixed empty/current evidence; validated the complete canonical empty sentinel.
- Separated parsed run result from audit-ledger outcome and gave invalid evidence diagnostics distinct from genuine failed-stream diagnostics.
- Verified 25 parser/API tests, 7 SSR tests, 5 browser/CDP tests, production build, lint, cleanup, diff integrity, and a 100/100 final scoped audit.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md) · [`ledgers/AUDIT_LEDGER.md`](ledgers/AUDIT_LEDGER.md)

## 2026-08-18 — Compass bounded browser setup failures

- Added hard deadlines for Chrome process spawn and CDP WebSocket establishment, including pre-open close/error and late-open handling.
- Put the full Chrome launch/setup path under one cleanup owner, including isolated profile deletion after spawn failure and explicit release of partial CDP page sessions.
- Added focused stalled-connection, non-executable-spawn/profile, and page-session setup regressions; verified the 28-test canonical monitor gate, production build, lint, cleanup state, and a 98/100 scoped re-audit.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md)

## 2026-08-19 — Compass monitor batch clean extraction

- Extracted the cumulative Compass monitor implementation into a dedicated branch/worktree based on `8328fa6`, excluding Planner, README, roadmap, lockfile, and dependency changes.
- Split five shared evidence documents by complete Compass record instead of copying their mixed whole-file diffs; removed one misattributed Planner verification line and kept the ledger template ahead of every extracted record.
- Made pending/running streams block detach and keep lifecycle `in_build`; bounded Vite listen, warmup, close, and the complete browser scenario.
- Verified the 36-test canonical monitor gate, exact-final browser harness, production build, lint, diff integrity, cleanup, and three fix-back audits with no remaining Critical/High findings.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md) · [`ledgers/AUDIT_LEDGER.md`](ledgers/AUDIT_LEDGER.md)

## 2026-08-26 — Compass evolution-evidence containment

- Routed evolution tracking discovery, content, and metadata through the shared descriptor-bound project-containment resolver.
- Removed process-working-directory fallback and made unsafe canonical root evidence suppress nested fallback while retaining valid contained symlinks and `apps/compass/` fallback.
- Added direct and API regressions for the full root/nested/unsafe selection matrix.
- Verified 35 parser/API tests, 7 SSR tests, 6 browser/CDP tests, production build, lint, diff integrity, and a 100/100 final scoped audit.

**Cross-links:** [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`ledgers/BUILD_LEDGER.md`](ledgers/BUILD_LEDGER.md) · [`ledgers/AUDIT_LEDGER.md`](ledgers/AUDIT_LEDGER.md)
