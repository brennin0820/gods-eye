# Project State

Last updated: 2026-07-02

## Current phase

Phase 3 - Runtime integration hardening

Reason:
- The repo's build and test health is now green again.
- Phase 2 source-of-truth drift is closed by append-only Supersedes correction and verification.
- The next highest-value work is narrowing runtime integration gaps with reproducible local validation.

## Phase definitions

### Phase 1 - Build and test stabilization

Definition of Done:
- `apps/planner` tests pass.
- `apps/planner` build and typecheck pass.
- `apps/compass` build and lint pass.
- `mcp-server` build passes.
- No known repo-wide red verification step remains from the native package scripts inspected in this session.

Status:
- Completed on 2026-07-02.

Evidence:
- `cd apps/planner && npm run test` -> 32/32 tests passed.
- `cd apps/planner && npm run build` -> passed.
- `cd apps/planner && npm run lint` -> passed.
- `cd apps/compass && npm run build` -> passed.
- `cd apps/compass && npm run lint` -> passed.
- `cd mcp-server && npm run build` -> passed.

Completed work:
- Fixed Windows path handling in `apps/planner/src/tools/GrepTool.ts` so slash-based globs match normalized relative paths.
- This resolved the failing `GrepTool` path-glob test (`nested/*.ts`).

### Phase 2 - Source-of-truth consistency

Definition of Done:
- Stale high-visibility docs no longer contradict shipped Planner/Orchestrator behavior.
- Any doc changes are backed by local source inspection and verification already available in the repo.
- Verification still passes after doc edits.

Status:
- Completed on 2026-07-02.

Evidence:
- `docs/14_SESSION_HANDOFF.md` now immediately supersedes the stale current-state line saying Compass opens HimFLer by default.
- Scoped stale-claim scan for current HimFLer-default guidance returned no matches in `apps/compass`, `apps/planner`, and `docs/DIVISION_REGISTRY.md`.
- `apps/compass` build and lint passed.
- `apps/planner` tests, build, and lint passed.
- `mcp-server` build passed.

### Phase 3 - Runtime integration hardening

Definition of Done:
- Remaining open Arc 1 items are narrowed to concrete, reproducible gaps with verification.
- Any runtime/integration change has a local validation path, not just documentation claims.

Candidate targets:
- True concurrent multi-stream dispatch from one process.
- Live LM Studio integration verification in an environment where the server is available.

Current target:
- Choose the first runtime-hardening slice with a local validation path; prefer orchestrator behavior that can be verified without relying on unavailable external services.
- Resume runtime-hardening after the rule-system cleanup requested on 2026-07-02.

## Loop history

### 2026-07-02 - Loop 1

Inspection:
- Native package checks initially failed because dependencies were not installed in the workspace.
- After `npm ci`, the real failing verification was `apps/planner` test `src/tools/GrepTool.test.ts`, path-glob case.

Focused improvement:
- Normalized `relative()` output to forward slashes before applying slash-based glob matching in `GrepTool`.

Verification:
- Re-ran Planner tests and the package build/lint matrix; all passed.

Decision:
- Phase 1 met its Definition of Done, so the project advances to Phase 2.

### 2026-07-02 - Loop 2

Inspection:
- The canonical division registry still contradicted shipped Planner state in its highest-visibility sections.
- Top-level rows said Builder was "not yet implemented" / "not yet wired" even though the later dated updates and source tree showed it shipped.

Focused improvement:
- Updated `docs/DIVISION_REGISTRY.md` top-level Builder references to point at `apps/planner/src/agents/BuilderAgent.ts`.
- Marked the old gap table as a historical snapshot so its older entries no longer present themselves as current truth.

Verification:
- Re-read `docs/DIVISION_REGISTRY.md` and confirmed the stale top-level Builder claims are gone while the dated historical gap sections remain intact.

Decision:
- Phase 2 remains active.
- The next target is the orchestrator/Builder messaging mismatch: current comments and notes imply dry-run Builder proposals and a `--llm` flag shape that the CLI does not currently implement.

### 2026-07-02 - Loop 3

Inspection:
- `apps/planner/src/orchestrate.ts` header comments still claimed that omitting `--approve` lets Builder propose without writing.
- `apps/planner/src/agents/BuilderAgent.ts` still told users to pass a nonexistent `--llm` flag.

Focused improvement:
- Updated `orchestrate.ts` comments to match the implementation: without `--approve`, the orchestrator stops after Phase 0.
- Updated `BuilderAgent.ts` messaging to direct users toward running with LM Studio available instead of a nonexistent CLI flag.

Verification:
- `cd apps/planner && npm run test` -> 32/32 tests passed.
- `cd apps/planner && npm run build` -> passed.
- `cd apps/planner && npm run lint` -> passed.
- Confirmed the stale strings are no longer present in `apps/planner/src`.

Decision:
- Phase 2 still appears active, but the highest-value inconsistencies fixed so far are now closed.
- Next loop should audit remaining Planner-facing docs for mismatched runtime claims before advancing to runtime-hardening work.

### 2026-07-02 - Loop 4

Inspection:
- `build NR app` was interpreted as the human-facing app surface in this repo: `apps/compass`.
- The strongest missing slice was that Compass still showed only derived/mock-style reports, while Planner already emits real run artifacts (`PARALLEL_RUN_STATUS.md`, `BUILD_LEDGER.md`, `AUDIT_LEDGER.md`) that were invisible in the app.

Focused improvement:
- Extended `apps/compass/server/buildSnapshot.ts` to watch and ingest real orchestrator artifacts:
  - `docs/PARALLEL_RUN_STATUS.md`
  - `docs/ledgers/BUILD_LEDGER.md`
  - `docs/ledgers/AUDIT_LEDGER.md`
- Added report generation for those files so they flow into the existing Reports page without a new UI surface.

Verification:
- `cd apps/compass && npm run build` -> passed.
- `cd apps/compass && npm run lint` -> passed.
- Confirmed the new artifact report hooks are present in `buildSnapshot.ts`.

Decision:
- This is the first concrete NightRaven app integration step that connects Compass to Planner runtime output.
- Next loop should choose between:
  - deepening Compass runtime visibility beyond reports, or
  - advancing to Phase 3 runtime hardening around orchestrator behavior itself.

### 2026-07-02 - Loop 5

Inspection:
- Compass gained two new capabilities in active code: local provider-key fields and constrained file generation from prompt cards.
- App architecture docs and agent guidance still described Compass as read-only plus IndexedDB-only, which was no longer fully accurate.

Focused improvement:
- Updated `apps/compass/docs/ARCHITECTURE.md` with the new `/api/generate-file` route, local provider-key storage note, and generated-file constraints.
- Updated `apps/compass/AGENTS.md` so the product/agent contract reflects constrained artifact generation while still forbidding arbitrary repo editing.

Verification:
- The app already built and linted clean after the feature work.
- Live dev server remained reachable at `http://127.0.0.1:4174/`.

Decision:
- Phase 2 cleanup remains active, but the main drift introduced by the latest Compass features is now closed.
- Next loop should either exercise the generated-file path end-to-end or move to deeper runtime behavior hardening.

### 2026-07-02 - Loop 6

Inspection:
- The live Compass app still defaulted into HimFLer context, which is a direct UX correctness issue for the monorepo app surface.
- `apps/compass/src/services/compassApi.ts` still hardcoded HimFLer as the preferred default and docs still described that as intended behavior.

Focused improvement:
- Removed the hardcoded HimFLer default bias.
- Changed initial project selection to prefer the active NightRaven framework/monorepo entry first.
- Added a one-time migration path so legacy auto-picked HimFLer sessions stop reopening into the wrong project context by default.
- Updated Compass docs (`README.md`, `AGENTS.md`) to match the new default-selection behavior.

Verification:
- `cd apps/compass && npm run build` -> passed.
- `cd apps/compass && npm run lint` -> passed.
- Live app remained reachable at `http://127.0.0.1:4174/`.

Decision:
- This closes one of the most visible UX mismatches in the running app.
- Next loop should either test prompt-file generation end-to-end in the browser or advance to deeper runtime-state visibility/polish in Compass.

### 2026-07-02 - Loop 7

Inspection:
- The live Compass app exposed `POST /api/generate-file`, and the endpoint was intended to restrict writes to `docs/generated/` or `.codex/generated/`.
- Code inspection found the prefix check happened before resolving `..` path segments, allowing a path shaped like `.codex/generated/../x.md` to escape the generated subfolder while staying inside the selected project.

Focused improvement:
- Replaced the string-prefix-only allow check with resolved-path validation in `apps/compass/server/compassApiPlugin.ts`.
- The endpoint now resolves the target path first and only writes when the final path is inside one of the allowed generated output directories.

Verification:
- Live HTTP success case wrote `.codex/generated/compass-end-to-end-check.md`.
- Live HTTP traversal checks rejected `.codex/generated/../compass-escape-check.md` and `docs/generated/../../../compass-escape-check.md` with 400 responses.
- `cd apps/compass && npm run build` -> passed.
- `cd apps/compass && npm run lint` -> passed.
- Confirmed `.codex/compass-escape-check.md` was not created.

Decision:
- The generated-file feature is now end-to-end verified and hardened against generated-folder escape.
- Phase 2 remains active because a targeted stale-claim scan still found protected memory docs with current-state HimFLer default wording; fix that under `+#` memory rules before advancing.

### 2026-07-02 - Loop 8

Inspection:
- `docs/14_SESSION_HANDOFF.md` still had a current-state line saying Compass opens HimFLer by default.
- The current Compass code and docs now prefer the active NightRaven framework/monorepo entry when no stored selection exists, with a one-time `compass.himflerDefaultMigration.v2` clear for legacy HimFLer stored selection.

Focused improvement:
- Added an append-only Supersedes paragraph immediately after the existing current-focus Supersedes block in `docs/14_SESSION_HANDOFF.md`.
- Left the historical HimFLer lines intact under the repo's `+#` memory law.

Verification:
- Re-read the top of `docs/14_SESSION_HANDOFF.md` and confirmed the stale line is immediately superseded.
- `rg -n "PREFERRED_DEFAULT_PROJECT|Default project.*HimFLer|default.*HimFLer" apps/compass apps/planner docs/DIVISION_REGISTRY.md` -> no matches.
- `cd apps/compass && npm run build` -> passed.
- `cd apps/compass && npm run lint` -> passed.
- `cd apps/planner && npm run test` -> 32/32 tests passed.
- `cd apps/planner && npm run build` -> passed.
- `cd apps/planner && npm run lint` -> passed.
- `cd mcp-server && npm run build` -> passed.

Decision:
- Phase 2 meets its Definition of Done.
- The project advances to Phase 3: runtime integration hardening.

### 2026-07-02 - Loop 9

Inspection:
- Rule review found stale or contradictory instructions in the active rule surfaces:
  - dead references to missing docs/plans/templates;
  - unconditional commit/push language conflicting with no-commit-without-approval policy;
  - Touch 3 timing conflicts;
  - START HERE guidance that could trigger full-chain reads on trivial tasks.
- A filename audit found no tracked GE/godseye/tmp/untitled-style filenames needing immediate safe rename; `templates/` and `PROMPT_TEMPLATES.md` are intentional names in this repo.

Focused improvement:
- Updated active rule docs to make sync approval-aware, clarify task-scoped read depth, and defer Touch 3 memory batching to session-stop/final-turn unless Brent explicitly asks for mid-session memory.
- Replaced missing-file references with existing rule sources or in-file sections.
- Did not perform a broad repo-wide rename because no safe stale filename candidates were found and a full rename requires a reviewed path-by-path map to avoid breaking imports and docs links.

Verification:
- Active-rule link check across `AGENTS.md`, `.cursor/rules/nightraven-context-intent.mdc`, `docs/37_NIGHTRAVEN.md`, and `docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md` -> no missing active rule refs.
- Stale-reference grep for missing docs/templates and unconditional sync language in active rule docs -> no matches.
- Filename audit for GE/godseye/tmp/untitled-style tracked paths -> only intentional template paths and `PROMPT_TEMPLATES.md`.
- `git diff --check` -> passed with CRLF warnings only.

Decision:
- Rule-system consistency is improved.
- Phase 3 remains active; next work should return to runtime integration hardening unless Brent approves a concrete rename map.
