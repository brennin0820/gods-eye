# Learning log — NightRaven framework repo

Durable patterns discovered in this repo. Append-only (`+#`).

---

## 2026-07-02 — Opt-in LLM brain, not a rewrite, keeps deterministic paths honest

**Signal:** Wiring an LM Studio brain into Planner/Researcher/Architect could have replaced their deterministic stub logic outright. Instead each agent takes an *optional* client; the original logic was extracted verbatim as the fallback path, not rewritten.

**Pattern:** When adding a probabilistic capability (LLM call, external service) to code with existing deterministic tests, keep the deterministic path as a real fallback (not a deprecated stub) rather than a hard cutover. Concretely: constructor takes `client?`, the old method body becomes a private `runDeterministic()`, `run()` tries the new path first and catches a narrow error type to fall back. Result: existing tests and `index.ts`'s dry-run demo stay byte-identical with no client passed, while `orchestrate.ts` opts in. This also makes "brain unreachable" a first-class, tested outcome instead of a crash — consistent with the framework's fail-open ethos (`.cursor/hooks/`) applied to a new subsystem.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) 2026-07-02 · `apps/planner/src/agents/PlannerAgent.ts` · `apps/planner/src/agents/ResearchAgent.ts` · `apps/planner/src/agents/ArchitectAgent.ts`

---

## 2026-07-02 — Governance gates should stay code, not model judgment

**Signal:** Every other Phase-0-3 agent got an LLM brain option. `ReviewAgent` — the quality gate — deliberately did not.

**Pattern:** When a step's job is enforcement (pass/fail against a rule), keep it deterministic even when adding LLM capability elsewhere in the same pipeline. An LLM-judged gate can be argued with, is non-reproducible across runs, and blurs "the auditor found a real cycle" into "the model felt uncertain." `ReviewAgent`'s DAG cycle detection and coverage threshold stay plain TypeScript; only the generative steps (Plan/Research/Architect/Build) got a brain. Mirrors the framework's own division law (Auditor tool belt: read-only, no bash/write) at the reasoning layer, not just the tool layer.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) 2026-07-02 · `apps/planner/src/agents/ReviewAgent.ts` · `docs/DIVISION_REGISTRY.md`

---

---

## 2026-07-02 — Fail-open hooks can mask message-building bugs

**Signal:** `session-stop.sh:75` used `=` instead of `+=` — every carefully built Touch 3 instruction line was silently replaced by the closing one-liner, on every Unix stop, for weeks. Fail-open design meant nothing ever errored.

**Pattern:** In fail-open infrastructure, a wrong-but-valid payload is invisible — no exit code, no log. When a hook builds a message incrementally (`message+=`), verify the **emitted payload**, not just `bash -n`: run the hook with sample stdin and eyeball the JSON. Same class: `\Z` in a JS regex (matches literal `Z`, no error), self-identical grep alternations (`a|a` — dedupe intent lost, no error). Lint catches broken; only output inspection catches wrong.

**Mitigation:** After editing any hook/emitter, pipe a fixture through it and diff the output against intent. Add the check to the repair habit, not just to tests.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) 2026-07-02 · `.cursor/hooks/session-stop.sh` · `apps/compass/server/parseHandoff.ts` · `install.sh`

---

## 2026-07-02 — Bootstrap tooling must obey the laws it installs

**Signal:** `bootstrap-nightraven-project.sh` unconditionally rewrote overlay/handoff/README when they existed — re-running it on a live project would erase accumulated Recent sessions, violating the `+#`/never-`-#` law the script itself installs.

**Pattern:** Detect "live memory" before seeding: a handoff containing dated `- **YYYY-MM-DD**` Recent-sessions lines or a `+# **Bootstrap**` milestone is live → skip all seed rewrites, require explicit `--force`. Fresh-from-template files (placeholder text only) are safe to seed. The framework's own automation is inside the law's jurisdiction — audit installers/bootstrappers against the memory laws like any agent.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) 2026-07-02 · `scripts/bootstrap-nightraven-project.sh` · Bible §2.2–2.3

---

## 2026-07-02 — Unified Manifest genre (add or merge)

**Signal:** Brent **add or merge** + pasted YAML — new orchestration-config genre; no prior manifest anywhere in repo.

**Pattern:** "Add or merge" on pasted config → first check for an existing merge target (`.nightraven/`, YAML manifests — none found) → **add verbatim** under `examples/` (worked-instance convention, `.example` suffix, matches overlay/appendix examples) + one overlay §1 vocabulary row; no extra explainer scaffolds. The manifest formalizes existing law as machine-readable config: claim-before-edit (README no-conflict coordination), serialized protected files (one writer per file — Bible §2.4), append-only ledgers, no commit without approval (§2.8), status doc per stream. Consumer-repo paths (`Docs/` capital-D, Swift files) stay app-local; framework holds the worked example only (§2.6 — no app-memory bleed beyond the pointer).

**See:** [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §1 · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · `examples/manifest/`

---

## 2026-06-13 — Touch 3 meta-close after push (`52de8e5`)

**Signal:** Brent **`+#` only · stop`** immediately after **`commit` + `push`** of push-landed memory (`80b4e29` record).

**Pattern:** Second Touch 3 line records **`52de8e5`** on origin — closes the LM Studio doc arc loop; defer next commit until Brent asks (avoid stacked Touch 3 commits in one breath unless ship signal).

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8

---

## 2026-06-13 — Push landed after LM Studio doc batch (`80b4e29`)

**Signal:** Brent **commit + push** after stacked LM Studio memory (runbook · mis-doc · zsh recipe · roster).

**Pattern:** Rebase **all** ahead commits with noreply author+committer before push when batch includes Gmail-metadata commits; record **`origin/main` @ SHA** in **Already done** + **Recent sessions**.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8

---

## 2026-06-13 — Division-improve script ≠ auto-patch tool (mis-doc guard)

**Signal:** External paste described `lmstudio-division-improve.sh` as JSON Patch + `git apply` + auto-commit — wrong for NightRaven.

**Pattern:** This script is **review-only** — one SKILL snippet → markdown proposal file. Ship signal (**code it**) + **`+#`** apply separately. Models API uses OpenAI `{ "data": [{ "id": ... }] }`, not `"models": []`.

**Do:** Point agents to local doc §6 **Step-by-step runbook**; verify with review files under `docs/lmstudio-reviews/`.

**Don't:** Expect `Improve planner division:` commits from the script; trust generic LM Studio tutorials without reading [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh).

**+# Supersedes (second external paste, same session):** also claims `--dry-run` previews patches/line counts · division = directory glob `divisions/planner/` · review files are JSON with `patches` array · troubleshoot `git apply failed` — all **false** for NightRaven script.

**+# Supersedes (third paste — zsh recipe):** sample output with **“3 files modified”** on dry-run · live run **applies patches** · re-enable **`git commit` in script** — **false**; macOS default **zsh** uses `print -n` + `read` not bash `read -p`.

**See:** [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-13 — Touch 3 AFTER commit (`6979747`) — LM Studio wire batch

**Signal:** Brent **`commit`** then **`+#` only · stop** after Personal Network + roster memory was staged.

**Pattern:** One commit **`6979747`** bundles six doc paths (handoff · changelog · learning · local §6 · registry · overlay); Touch 3 AFTER records SHA + **3 ahead** push defer in **Recent sessions** — do not assume origin updated.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8

---

## 2026-06-13 — Remote model roster → division map (no embed model)

**Signal:** Brent shared four models on remote **`DESKTOP-7FT26ER`** — three chat-capable gguf + **Nomic Embed** embeddings.

**Pattern:** Map **available** remote models to division keys serially; **never** pass embedding models to chat/completions division script. Without 32B coder on remote, **builder** uses best available (**GPT-OSS 20B**) for SKILL gap review only — implementation stays cloud.

| Model | Division keys |
|---|---|
| GPT-OSS 20B | planner · architect · greenfield · planning · builder |
| DeepSeek R1 0528 Qwen3 8B | auditor · researcher · research |
| Gemma 4 E4B (~7.5B) | design |
| Nomic Embed Text v1.5 | **skip** (not chat) |

**Do:** Load one model on remote per run group · `--model` id from `/v1/models`.

**Don't:** Run division improve against Nomic; expect Builder-quality code review without cloud/coder model.

**See:** [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-13 — LM Studio Personal Network (Mac API · remote GPU)

**Signal:** Brent shared LM Studio **Network** UI — MacBook control · Windows **`DESKTOP-7FT26ER`** RTX 4080 preferred · **`GPT-OSS 20B`** loaded remotely.

**Pattern:** **Personal Network preferred device** offloads VRAM to remote GPU while the division-improve script still uses the **Mac Local Server** OpenAI endpoint (`localhost:1234/v1` or `NIGHTRAVEN_LMSTUDIO_URL`). Do not point the script at the remote device URL unless the server is bound there. Resolve `--model` from `GET /v1/models` — UI label may differ from API `id`.

**Do:** Local Server ON on Mac · preferred device ON · serial `./scripts/lmstudio-division-improve.sh --division all --model <id>`.

**Don't:** Parallel division calls across Mac+remote; assume 20B replaces 32B coder models for Builder/Architect reviews.

**See:** [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 · [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-13 — Touch 3 commit without push (push-latency defer)

**Signal:** Brent **`commit`** then **`+#` only · stop** — memory batch lands locally but not on `origin/main` in same turn.

**Pattern:** One Touch 3 AFTER may end on **commit only**; append explicit **push-latency defer** in **Recent sessions** when `main` is ahead — do not assume Always Sync completed without **push** or defer line.

**Do:** Use noreply on agent commits; say **push** in next turn to close §2.8.

**Don't:** Stack a second Touch 3 commit in the same thread for the defer line alone unless Brent asks.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-13 — GH007 batch rebase before push (many commits ahead)

**Signal:** Brent **update repo** with **11+** local commits using private Gmail author metadata — single push rejected (GH007).

**Pattern:** Before push, `git rebase origin/main --exec` with **both** `GIT_COMMITTER_EMAIL` and `--author=` noreply on **every** ahead commit — not just the latest. Author-only fix on HEAD is insufficient when the batch contains multiple Gmail commits.

**Do:** `git log origin/main..HEAD --format='%ae %ce'` first · rebase exec amend all · push · record **`origin/main` @ SHA** in handoff.

**Don't:** Push a multi-commit batch with Gmail metadata and expect GH007 on commit N only.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8

---

## 2026-06-13 — Filenames should match file content

**Signal:** Brent asked to rename **all** filenames to reflect what each file contains; monorepo still carried `nightraven-*` paths/names after nested-clone removal.

**Pattern:** `git mv` to content-descriptive names first · then disjoint parallel reference sweeps (scripts · install · mcp-server · docs · compass) — one writer per file; avoid slow `rg|perl` loops on large trees (use targeted Python walk).

**Do:** Keep vocabulary layers — NightRaven doc prefix for framework law; NightRaven prefix for monorepo registry/install/MCP/hooks paths.

**Don't:** Rewrite historical `+#` lines that cite old tool names (`nightraven-lint`) — append **Supersedes** only when correcting live instructions.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md)

---

## 2026-06-13 — Monorepo root: orphan `nightraven` gitlink dirs

**Signal:** Brent asked to delete all NightRaven **folders** at repo root; `nightraven` and `nightraven-1` existed as empty dirs with git mode `160000` (submodule gitlinks) but no `.gitmodules`.

**Pattern:** Legacy nested-clone paths can linger as orphan gitlinks after monorepo consolidation — safe to `rmdir` when empty; finalize with `git add -u` commit removing the gitlink entries.

**Do:** Keep canonical framework at repo root per unified product map; remove stale sibling gitlinks only.

**Don't:** Confuse folder deletion with removing framework docs/rules/scripts (different scope).

**See:** [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Compass: one-time default-project migration key

**Supersedes:** learning entry “default project vs persisted selection” workaround-only path once migration shipped.

**Signal:** Default constant (`PREFERRED_DEFAULT_PROJECT`) insufficient — pre-ship bootstrap auto-picked first registry row (nightraven-1) into `compass.selectedProject`.

**Pattern:** Versioned migration flag (`compass.himflerDefaultMigration.v1`) · detect legacy framework stored path · clear once · bootstrap `pickInitialProject()` · init UI state null until pick resolved.

**Do:** Ship migration when changing default project for returning users.

**Don't:** Wipe explicit user project choice after migration ran.

**See:** [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Compass: default project vs persisted selection

**Signal:** Brent asked Compass to **open on HimFLer**; app still showed nightraven monorepo.

**Pattern:** `pickInitialProject()` prefers HimFLer on **fresh** load (`PREFERRED_DEFAULT_PROJECT`); **`compass.selectedProject` in localStorage** restores last pick and overrides default — common when dev started on framework repo first.

**Do:** Settings → project **HimFLer (iOS app)** → Refresh; or clear site data for localhost Compass.

**Don't:** Assume default constant alone fixes returning users without migration.

**See:** [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Consumer app: Claude-first external coder workflow (HimFLer)

**Signal:** Brent pasted full **HimFLer** linen-calculator spec and asked to **tell each external AI coder** — Claude UI designer first, Codex builder follows UI rules, Antigravity for plan/audit — **iOS 26** design target.

**Pattern:** Consumer repo owns role docs (`BUILD_ROLES.md` · `UI_DESIGN_BRIEF.md`) · **design gate** before Codex · framework repo gets overlay pointer only (§2.6 — no consumer handoff bleed). Antigravity = HimFLer-local Planning + Architecture Auditor until promoted to framework standard.

**Do:** Open Claude on HimFLer with `UI_DESIGN_BRIEF.md` → produce `UI_DESIGN_SPEC.md` → then Codex **code it**.

**Don't:** Wire consumer build spec into `nightraven-1` `docs/14` body; let Codex start UI before design gate.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · `E:\NightRaven\HimFLer\docs\BUILD_ROLES.md`

---

## 2026-06-11 — Compass: memory auto-refresh via version poll (`82e4cff`)

**Supersedes:** learning entry “auto-refresh monitor (requested, not shipped)”.

**Signal:** Brent wants monitors to **refresh when NightRaven memory changes** without manual button.

**Pattern:** Server **`/api/project/version`** returns aggregate mtime/hash of watched memory files · client polls every **10s** (registry mode + `autoRefresh`) · on change call existing `loadProject` · merge IndexedDB overrides · **Live / Updated** badge in `AppShell`.

**Do:** `npm run dev` · enable Auto refresh in Settings · edit consumer `docs/14` Recent sessions · watch header badge.

**Don't:** Expect auto-refresh on static `dist` without API middleware.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) · [`ProjectContext.tsx`](../apps/compass/src/context/ProjectContext.tsx)

---

## 2026-06-11 — Compass: auto-refresh monitor (requested, not shipped)

**Signal:** Brent wants the **monitor to refresh and show when there are changes** (handoff/overlay edits while Compass is open).

**Pattern (target):** Server exposes handoff/overlay **mtime or content hash** · client **polls** when `settings.autoRefresh` enabled · `ProjectContext.refresh()` merges without dropping IndexedDB overrides · AppShell badge (“Updated” / timestamp).

**Current:** Settings toggle exists; **no poll loop** on `ca783f2` — still manual **Refresh from NightRaven**. **Superseded** by `82e4cff` entry above.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`ProjectContext.tsx`](../apps/compass/src/context/ProjectContext.tsx)

---

## 2026-06-11 — Compass: multi-project registry + IndexedDB product layer (`ce4afb3`)

**Supersedes:** learning entry “full product ≠ mock seed only” — stack (3) shipped on `ce4afb3`.

**Signal:** Brent wanted a **real product** and **HimFLer on Compass** — not nightraven monorepo only.

**Pattern:** `nightraven-projects.conf` (framework registry) → Vite `compassApiPlugin` reads consumer **`docs/14`** + overlay per path → **`ProjectContext`** merges API snapshot + **IndexedDB** overrides → Settings switches projects (e.g. **HimFLer** vs `nightraven-1`). `npm run dev` required for live memory reads; static build still runs UI + local edits.

**Do:** Register each consumer repo in conf · open Compass Settings · Refresh after handoff updates.

**Don't:** Edit framework `docs/14` when guiding HimFLer — Compass reads **that repo's** handoff; bleed = §2.6 violation.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`nightraven-projects.conf`](../scripts/nightraven-projects.conf) · [`ProjectContext.tsx`](../apps/compass/src/context/ProjectContext.tsx)

---

## 2026-06-11 — Compass: “full product” ≠ mock seed only

**Signal:** Brent rejected mock MVP — wants **fully functioning product**. Shipped full nav + memory dev API (`ea832ac`) but **`ProjectContext` still reads `buildMockSnapshot()`** — UI looks complete while data layer stays static seed.

**Pattern:** Compass product stack = **(1) route integrator** → **(2) `compassApi` + Vite middleware for memory files** → **(3) `ProjectContext` fetch + localStorage/IndexedDB for editable project state**. Ship (1)+(2) without (3) = demo, not product.

**Do:** Wire provider to `fetchRegistry` / `fetchProjectSnapshot`; persist mutations; update README off “mock only”; verify with refresh + project switch in Settings.

**Don't:** Claim full product while context is mock-only; use `npm run preview` expecting live memory without API.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`compassApi.ts`](../apps/compass/src/services/compassApi.ts) · [`ProjectContext.tsx`](../apps/compass/src/context/ProjectContext.tsx)

---

## 2026-06-11 — Compass: parallel phase workers need route integrator

**Signal:** Brent asked **all phases automatically** + **in parallel** — multiple workers built page modules while `App.tsx` stayed dashboard-only for Phase 1 scope.

**Pattern:** Parallel Compass phase work → split **component folders** + **mock data files** per worker; one **integrator** pass wires `App.tsx` / `routeRegistry` + merges `mockSnapshot` after workers finish. Do not claim phases shipped until nav routes render real pages.

**Do:** Verify with sidebar click + `npm run build`; README status table matches routed views.

**Don't:** Launch Touch 3 or declare phase complete while parallel workers still running; merge conflicting `App.tsx` edits without integrator.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`apps/compass/README.md`](../apps/compass/README.md)

---

## 2026-06-11 — Touch 3: last-turn law (defer batch to session-stop)

**Signal:** Brent asked Touch 3 to run **only on the final turn** — mid-session and delegated Touch 3 subagents caused memory closes before build work finished.

**Pattern:** **`session-stop` hook = final turn** — batch handoff Recent sessions + changelog + learning log **once** in that inline response. During work: wire cross-links only; memory append when Brent explicitly asks. **Multitask/subagents never Touch 3** — parent owns session-close batch.

**Do:** Finish all implementation first; respond to stop follow-up with +# appends; autosync commits safe paths on stop.

**Don't:** Spawn Touch 3 background workers mid-session; run AFTER while build subagents still in flight; stack multiple Touch 3 passes.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Compass: mock-first tasks + Vite middleware memory read

**Signal:** Brent shipped Compass via **Complete Build Packet** — Phase 1 dashboard in parallel; evolved beyond static mock to **read NightRaven memory from disk** without a separate backend.

**Pattern:** **Mock-first task/scope data** (`mockProject.ts` · utils) for builder UX · **live memory** via Vite dev middleware parsing handoff Recent sessions + overlay Not Now · project registry in `nightraven-projects.conf`. `npm run build` = static only; **`npm run dev`** required for file API. Phase 2 nav pages can ship on mock engines before full memory/MCP/git wire.

**Do:** Bootstrap new consumer → add conf line → Compass Settings Refresh; cross-link [`apps/compass/README.md`](../apps/compass/README.md).

**Don't:** Claim cloud sync or repo mutation; run `preview` expecting handoff updates without restart/Refresh; collapse Compass into framework `docs/14`.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`buildSnapshot.ts`](../apps/compass/server/buildSnapshot.ts)

---

## 2026-06-11 — HimFler: consumer repo name vs local folder

**Signal:** Brent renamed ship target **HimFler** (GitHub) while bootstrap folder stays **`HimFLer`** on disk.

**Pattern:** Vocabulary layers — **GitHub repo name** · **local path** · **overlay ship name** can differ; wire all three in overlay §1 and framework [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md). iOS product scope lives in **consumer repo memory** (`PRODUCT_SCOPE.md`), not framework `docs/14`. macOS-only builds — no Xcode from Windows; **code it** on Mac for Phase 1 scaffold.

**Do:** Registry `nightraven-projects.conf` uses ship name; `gh auth login` before `create-github-repo.sh`.

**Don't:** Paste HimFler handoff into nightraven framework `docs/14`; scaffold Swift/Xcode before ship signal.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · `E:\NightRaven\HimFLer\docs\NIGHTRAVEN_REPO_OVERLAY.md`

---

## 2026-06-11 — Compass scope monitor: mock engine before memory wire

**Supersedes:** learning entry “Compass scope monitor ≠ Scope Map (Phase 1 vs Later)” — Scope Map and Auditor Queue are **live** as of `b3a2583`; still mock data only.

**Signal:** Brent asked scope monitor to work, then **MAKE IT WORK in parallel** — placeholders were blocking trust in Compass.

**Pattern:** Ship **scope logic as pure utils** (`scopeMonitor.ts` reuses `scopeWarnings.ts`) → **dedicated pages** (Scope Map · Auditor Queue) → **dashboard summary card** with nav handoff. Promote nav items from `Later` / Phase 5 to **Phase 1** when UI is real. Keep mock data until handoff/git wire is a separate phase.

**Do:** `cd apps/compass && npm run dev`; Scope Map for full monitor · Auditor Queue for pre-build gate.

**Don't:** Claim live repo monitoring; collapse Scope Map into dashboard-only after shipping both.

**See:** [`scopeMonitor.ts`](../apps/compass/src/utils/scopeMonitor.ts) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Compass “scope monitor” ≠ Scope Map (Phase 1 vs Later)

**Signal:** Brent asked if **scope monitor** works — meant **NightRaven Compass** (`apps/compass/`).

**Pattern:** Phase 1 scope guardrails live on the **Dashboard** only: `scopeWarnings.ts` · `isTaskReadyToBuild()` · scope locked · Not Now cards · mock `scopeProgress`. Sidebar **Scope Map** (`phase: Later`) and **Auditor Queue** (Phase 5) are **placeholder pages** — not live monitors. No repo or NightRaven handoff integration in MVP.

**Do:** Run `cd apps/compass && npm install && npm run dev` for Phase 1 UI; point to [`MVP_ROADMAP.md`](../apps/compass/docs/MVP_ROADMAP.md) for Scope Map / Auditor Queue timing.

**Don't:** Promise dedicated scope-monitor page or live creep detection until Phase 4–5 ship.

**See:** [`apps/compass/README.md`](../apps/compass/README.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Greenfield NightRaven consumer via bootstrap script

**Signal:** Brent asked to **put ready for use** a new project **HimFLer** — not another monorepo `apps/` subtree; separate consumer repo with full NightRaven + NightRaven Core stack.

**Pattern:** **`scripts/bootstrap-nightraven-project.sh`** — one command: `install-nightraven-framework.sh --no-mcp` → seed overlay · handoff · README · `PROJECT_QUICKSTART.md` · `.gitignore` → `git init` if needed → register in `scripts/nightraven-projects.conf`. Consumer lives **sibling** to framework (`E:/NightRaven/<AppName>/`), not under `apps/`.

**Do:** Document in CURSOR_INSTALL · README · `NIGHTRAVEN_UNIFIED_PRODUCT.md`; first session = read AGENTS + handoff, **plan until code it**.

**Don't:** Collapse HimFLer into framework `docs/14`; paste framework handoff into consumer; ship feature code before Brent says **code it** / **implement** / **build**.

**See:** [`bootstrap-nightraven-project.sh`](../scripts/bootstrap-nightraven-project.sh) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Monorepo merge without collapsing memory layers

**Signal:** Brent asked to merge NightRaven, NightRaven Core, and Compass into **one NightRaven** — prior merge Q&A warned against collapsing vocabulary layers.

**Pattern:** **Brand umbrella** + **monorepo layout** — public README leads with NightRaven; **NightRaven** stays L2 framework/Bible name; **NightRaven Core** stays orchestration skill; apps under `apps/` with **separate app memory** (`apps/compass/docs/` vs framework `docs/14`). Use `git subtree add --prefix=apps/<name>` for sibling repos.

**Do:** [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) as canonical merge map; cross-link in overlay · unified stack §13 · AGENTS.

**Don't:** Rename Bible/`+#` chain to NightRaven; paste Compass handoff into framework `docs/14`; delete sibling folder until monorepo verified.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Autosync safe paths omit `apps/` after monorepo merge

**Signal:** Hook autosync on stop committed memory/docs but left `.gitignore`, `apps/README.md`, and `apps/compass/README.md` local — `apps/*` not in `nightraven_is_safe_autosync_path` / `Test-SafeAutosyncPath`.

**Pattern:** Monorepo adds `apps/<product>/` — extend hook safe allowlist to `apps/*` (same tier as `docs/`, `scripts/`) or agents must **commit** app-folder files explicitly.

**Do:** Add `apps/*` to lib.sh + lib.ps1 safe paths when monorepo is canonical; document in HOOKS_SETUP.

**Don't:** Assume session-stop autosync picks up new top-level app folders automatically.

**See:** [`.cursor/hooks/lib.sh`](../.cursor/hooks/lib.sh) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md)

---

## 2026-06-11 — Slim local backups for sibling repos without remote

**Signal:** Brent shared `nightraven-compass.rar` (~181 MB) — full-folder backup of Compass while git remote still unset; bulk was `node_modules` + `.codex` Chrome profiles, not source.

**Pattern:** For app repos with no cloud remote, **RAR/zip full tree** works as emergency restore but bloats fast. Prefer: (1) git remote + push, or (2) archive **source only** — exclude `node_modules`, `dist`, `.codex`, browser profiles; include `.git` if history matters.

**Do:** Document backup path in nightraven handoff (experience slot); restore via extract + `npm install`.

**Don't:** Treat 180 MB RAR as the long-term sync mechanism when git remote is one command away.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) (Compass Phase 1)

---

## 2026-06-11 — Stop hooks must fail-open before followup_message

**Signal:** Hooks review flagged `set -euo pipefail` on `session-stop.sh` — a failed handoff defer append could abort before `emit_followup_message`, silencing Touch 3 / Always Sync status.

**Pattern:** Session **stop** hooks are infrastructure, not product logic — never use `set -e`. Use `set -uo pipefail` only; wrap best-effort side effects (`nightraven_append_push_defer`, awk/mv) with fail-open guards.

**Do:** Emit followup even when git defer or handoff append fails; report sync lines in the message either way.

**Don't:** Let `set -e` on stop hooks — agents lose the autosync summary and Touch 3 reminder.

**See:** [`.cursor/hooks/session-stop.sh`](../.cursor/hooks/session-stop.sh) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Install picks hooks manifest by OS

**Signal:** Committed `.cursor/hooks.json` was PowerShell-only — Unix adopters had to hand-edit `run-hook.sh` paths after `install.sh`.

**Pattern:** Project install copies **Windows** → repo `hooks.json` (PowerShell); **non-Windows** → `templates/hooks.project.unix.json` with `run-hook.sh` dispatchers. Detect via `uname` / `OS=Windows_NT`.

**Do:** Ship both manifests; document in HOOKS_SETUP user-level vs project-level table.

**Don't:** Assume all adopters run Cursor on Windows — bash scripts already shipped; manifest must match platform.

**See:** [`install.sh`](../install.sh) · [`templates/hooks.project.unix.json`](../templates/hooks.project.unix.json) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md)

---

## 2026-06-11 — Keep browser verification temp profiles outside watched Vite repos

**Signal:** NightRaven Compass Phase 1 verification used headless Chrome screenshots; Vite crashed when Chrome profile temp files were created under the app's `.codex` directory and the dev server tried to watch them.

**Pattern:** Browser/test scratch space inside a Vite workspace can become part of the file watcher surface. Put Chrome profiles/screenshots outside the repo or explicitly ignore `.codex/**` in `vite.config.ts`; also ignore `.codex` in `.gitignore`.

**Do:** Use OS temp directories for verification artifacts; add watcher ignores for local agent scratch folders when a repo needs in-tree `.codex` files.

**Don't:** Let browser profiles, lock files, or rapidly-changing temp files sit under a dev server watch root.

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Session-start pull skip mirrors stop fast path

**Signal:** Improvements review gap #2 — redundant pulls on back-to-back Agent chats.

**Pattern:** Reuse `.cursor/.autosync-session` marker + `NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC` for **both** session-start and stop — same "recent successful pull" window; do not refresh marker when skipping.

**Do:** Document in HOOKS_SETUP; alias `nightraven_should_skip_recent_pull` in bash for readability.

**Don't:** Skip pull when marker shows failed pull (`|0`).

**See:** [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`install.sh`](../install.sh) · [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md)

---

## 2026-06-11 — Session-start pull skip mirrors stop fast path

**Supersedes:** duplicate — canonical entry is the block above (lines 9–19).

**Signal:** Improvements review ranked install parity and session-start pull skip after tasking-speed hooks shipped on stop/after-file-edit.

**Pattern:** Autosync pull-skip is one policy (`NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC` + `.cursor/.autosync-session`) shared by **both** session-start and session-stop — avoids back-to-back pulls when opening multiple Agent chats or when stop runs on a clean tree right after start.

**Do:** Reuse `nightraven_should_skip_stop_pull` as `nightraven_should_skip_recent_pull`; document start+stop in HOOKS_SETUP; copy `*.ps1` in install.sh for Windows parity.

**Don't:** Separate markers or windows for start vs stop.

**See:** [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Execution orchestration spec vs three vocabulary layers

**Signal:** Brent pasted Builder/Auditor/Design/Core workflow + Final Report template and asked to add what is missing.

**Pattern:** **Execution-path combos** (Builder / +Auditor / +Design / +all) are a NightRaven runtime overlay — not a rename of Bible §9 virtual teams or the 11-division product taxonomy. Wire gaps into skill + overlay; add Design Division as first-class read-only runtime; embed Final Report in NightRaven skill (no new template file). Reconcile Low→Critical risk labels with TRIVIAL→CRITICAL matrix via mapping table, don't replace matrix.

**Do:** Gap map explicitly; phased plan before code; UI domain tag triggers Builder+Design minimum.

**Don't:** Collapse §9 Design/UX team into "Design Division"; stub Architect Division empty in same pass.

**See:** Plan `division_orchestration_wire_3a1b9706` · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`.claude/skills/nightraven/SKILL.md`](../.claude/skills/nightraven/SKILL.md)

---

## 2026-06-11 — Tasking speed: hook fast paths before full autosync

**Signal:** Brent asked faster tasking; bottlenecks were hook git on every stop, after-file-edit on all paths, and full NightRaven Phase 0 for trivial/subagent work.

**Pattern:** **Fast path before full law** — skip redundant git when session-start already pulled and tree has no safe dirty; return `{}` from `after-file-edit` before loading libs when path is not memory-doc; cache Touch3 marker checks; nudge Tier 0–1 lean reads at session-start. NightRaven: subagent workers inherit parent Task Assessment; TRIVIAL/LOW skip full report table.

**Do:** Keep Always Sync on meaningful dirty; document env toggles (`NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC`); ignore hook marker files in `.gitignore`.

**Don't:** Disable autosync commit on stop without explicit Brent approval; run full Bible chain on Tier 0–1 trivial edits.

**See:** [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · `.claude/skills/nightraven/SKILL.md`

---

## 2026-06-11 — Framework vs consumer merge ("become one")

**Signal:** Brent asked what if NightRaven and NightRaven become only one — a scope decision, not a rename.

**Pattern:** **"Become one"** = scope decision, not vocabulary collapse. Sane shapes: **monorepo + two boundaries** (`packages/nightraven` + `apps/ios`), **brand-only merge**, or **absorption** paths. Do not collapse vocabulary layers (product/category · brand · repo · code domain · oversight). **Critical** governance if Brent chooses true product merge. Prefer NightRaven-scoped runtime + portable standard **or** monorepo with explicit package boundaries.

**See:** entry below (framework vs consumer Q&A) · [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Framework vs consumer app (NightRaven vs NightRaven Q&A)

**Signal:** Brent asked how NightRaven and NightRaven relate — not a rename or merge question.

**Pattern:** **NightRaven** = portable memory/oversight framework (this repo); **NightRaven** = consumer app + NightRaven Core orchestration (adopter repo, §2.6). Inventory may cite paths; never merge app handoff into framework memory. Division taxonomy TBD is a scope gate inside NightRaven, not a product-version split.

**See:** [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md)

---

## 2026-06-11 — Claude adoption kit (#15) as chain doc, not template scaffold

**Signal:** Strategic Q&A lane #15 — Claude Code adopters need same memory chain as Cursor without new `templates/` per cycle (§9 hard law).

**Pattern:** Ship adoption as **existing-chain doc** [`CLAUDE_ADOPTION.md`](CLAUDE_ADOPTION.md) + cross-links in `CURSOR_INSTALL.md` / README — not a new template folder. Contents: vendor list (37, overlay, handoff, AGENTS), optional MCP, noreply git author, hooks parity table (Cursor vs Claude manual discipline).

**Do:** Wire overlay §3 chain row; AGENTS Reference pointer; keep install.sh path shared with Cursor.

**Don't:** Create `templates/claude-*` scaffold; collapse Claude hooks into Cursor-only docs without parity note.

**See:** [`CLAUDE_ADOPTION.md`](CLAUDE_ADOPTION.md) · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md)

---

## 2026-06-11 — Combined install script (NightRaven + NightRaven Core)

**Signal:** Brent asked for recommendation + one command to integrate both on a project.

**Pattern:** **Stack, don't merge** — `install.sh` for portable memory chain; optional `install-nightraven-framework.sh` adds NightRaven Core skill + BUILD/AUDIT ledgers + overlay/AGENTS wiring. Generic adopters use `install.sh` only; app repos (NightRaven) use combined script with `--user` once per machine.

**Do:** Promote combined path via CURSOR_INSTALL + README; append overlay section on install (+# only if missing).

**Don't:** Collapse NightRaven and NightRaven into one repo or one memory chain.

**See:** [`scripts/install-nightraven-framework.sh`](../scripts/install-nightraven-framework.sh) · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Repeated intentions catalog (continuity engine)

**Signal:** Brent asked for pre-coding orchestration **and** "repeated intentions" — not a feature build.

**Pattern:** Hook-delivered Touch 3 AFTER + explicit "repeated intentions" request = **extract stable intent tiers** from Recent sessions (not re-summarize the latest line). Tier 1 laws (interpretation, memory-before-code, Always Sync, +# only, Touch 3) recur most; Tier 3 (division taxonomy, Architect gap) is roadmap memory. Agents should load this as **continuity**, not treat each telegraphic "add X" as isolated.

**Do:** Run pre-coding card before implementation; surface repeated intentions when Brent asks or at Tier 2+ cold start; defer code until ship signal.

**Don't:** Collapse the three division vocabularies in one answer; open implementation files on orchestration-only sessions.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Cursor autosync hooks enforce Always Sync at session boundaries

**Signal:** Brent asked to fix Always Sync — prior hooks were policy + soft nudges only; user rule also requires commit-on-request (not agent-proactive).

**Pattern:** Always Sync law needs **automated git at session boundaries**, not reminders alone. Cursor hooks run `git pull --ff-only` on start and pull → safe-path stage/commit → `git push origin HEAD` on stop — fail-open, no force push, no `--no-verify`. Safe-path commit scope limits blast radius (`docs/`, `.cursor/`, templates, etc.). Reconciles framework Always Sync with interactive agent commit discipline: hooks own boundary sync; agents commit when Brent asks.

**Do:** Ship PowerShell hooks on Windows + bash parity via `run-hook.sh`; document in `HOOKS_SETUP.md`; append defer line to handoff on push failure.

**Don't:** Treat overlay Always Sync prose as sufficient without hook enforcement; commit secrets or force-push from hooks.

**See:** [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`.cursor/hooks.json`](../.cursor/hooks.json) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Division taxonomy: 11-proposal vs runtime vs Bible §9

**Signal:** Brent proposed 11-division NightRaven structure; subagent mapped NightRaven (4 runtime) vs Bible §9 (6 virtual teams).

**Pattern:** Oversight vocabulary splits across layers — **product taxonomy** (11 divisions), **runtime orchestration** (NightRaven divisions), and **improvement-loop virtual teams** (Bible §9). Do not collapse them. **Architect Division** is the top gap across maps. Phase 0 = memory wire (overlay §1, Bible §9.x) before any code or NightRaven runtime changes. Open scope gate: portable standard vs NightRaven-scoped adoption.

**Do:** Map gaps explicitly; wire Phase 0 to overlay + Bible §9 append-only; ask Brent portable vs scoped before implementation.

**Don't:** Rename Bible §9 virtual teams to match 11-division marketing labels in one pass; open implementation files on plan-only sessions.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §9 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Cursor vs VS Code workspace settings split

**Signal:** Brent asked to optimize editor settings for NightRaven agent workflow without breaking append-only memory docs or hook alignment.

**Pattern:** Cursor and VS Code share `settings.json` schema but serve different scopes — **user** settings for global agent/perf prefs; **workspace** `.vscode/` for repo-specific docs indexing, `mcp-server` excludes, markdown format-on-save off, PowerShell terminal, and `git.autofetch` as light fetch between hook-driven Always Sync. Document the split in `.vscode/README.md`; wire `HOOKS_SETUP.md` ↔ workspace README so agents find both hook git behavior and editor config.

**Do:** Keep `docs/` searchable; exclude only build artifacts and secrets; disable markdown format-on-save on memory chain; match default terminal to `hooks.json` on Windows.

**Don't:** Put repo-specific NightRaven paths in user settings only; enable format-on-save on `+#` memory docs; treat `git.autofetch` as a substitute for session-boundary hook sync.

**See:** [`.vscode/README.md`](../.vscode/README.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Governed Bypass Protocol

**Signal:** Brent stated "rules are meant to be broken" and requested a formal bypass mechanism.

**Pattern:** Hard rules without bypass paths create brittleness. The best governance systems allow any rule to be overridden — but only with explicit approval and a logged rationale. This prevents silent violations while preserving flexibility for genuine edge cases.

**Do:** When a law needs to be bypassed, (1) state which rule and why, (2) ask Brent explicitly, (3) execute only after approval, (4) log a `+#` Governed Bypass entry in the learning log or handoff.

**Don't:** Silently skip `+#` only, read tiers, or session-close protocol without asking. Never assume implicit permission.

**See:** [`37_NIGHTRAVEN.md` §2.9](37_NIGHTRAVEN.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-11 — Self-healing / Auto-setup Developer Tools

**Signal:** Brent requested "a launcher that will automatically setup its environment".

**Pattern:** Requiring manual setup steps (`npm install && npm run build`) for developer utility scripts/launchers creates friction and execution failure points. Design launchers as self-healing processes: check for build output/dependencies, synchronously bootstrapper/compile if missing, and then proceed with execution.

**Do:** Add automatic `execSync` scripts inside MCP runners to install node packages and compile TypeScript if compiled build is missing.

**Don't:** Fail execution with manual instructions when the runtime language (Node/Python) is available to build itself.

**See:** [`templates/mcp/run-memory-chain-mcp.js`](templates/mcp/run-memory-chain-mcp.js) · [`.cursor/mcp/run-memory-chain-mcp.js`](.cursor/mcp/run-memory-chain-mcp.js) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-13 — LM Studio serial division improvement (local loop)

**Signal:** Brent asked for a way to **improve all divisions using LM Studio** without cloud subagent cost.

**Pattern:** One **serial CLI** (`scripts/lmstudio-division-improve.sh`) calls the local OpenAI-compatible endpoint once per division; feeds truncated SKILL + registry-known gap; writes review markdown under `docs/lmstudio-reviews/` — **proposals only**, not auto-applied SKILL edits. **Researcher/Research** improve offline rubrics locally; live `/hunt` stays cloud. **Never parallel** under LM Studio (VRAM + local law).

**Do:** `--dry-run --division all` to plan without server; start LM Studio Local Server then `--division all`; pick one division improvement per session; apply with **`+#`** after **code it**.

**Don't:** Spawn parallel division reviews locally; treat review files as committed law without Brent ship signal; call `resolve_model` during dry-run (bash `set -e` exits silently if server down).

**See:** [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh) · [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 · [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Local Offline vs Cloud Execution Gating


**Signal:** Brent asked how to design NightRaven behavior "with and without LM Studio".

**Pattern:** Resource availability (local VRAM/CPU/context size) dictation dictates agent workflow constraints. Local mode requires low-overhead serial executions, high handoff compaction, and strict context pruning. Cloud mode allows deep reasoning, large context continuity, and parallel multi-perspective loops but requires strict cost discipline.

**Do:** Author standard environment-aware execution guidelines; check for local environments to bypass multi-agent loops and enforce strict context pruning.

**Don't:** Deploy massive files or spawn parallel subagents in local execution spaces.

**See:** [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Always Sync repository changes to prevent drift


**Signal:** Brent requested "always download and upload all changes to repo every changes happens".

**Pattern:** In git-native memory systems, disk/commit latency is a source of unlearning if changes are not synchronized immediately. Always pull before pushing, and commit and push immediately after any rule, overlay, or code modification.

**Do:** Add Always Sync rules to the rule file and overlay vocabulary; execute `git pull`, `git add`, `git commit`, and `git push` immediately when changes occur.

**Don't:** Leave memory modifications local/unpushed when a remote origin is configured.

**See:** [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-11 — Gap-fill polish answers reader decisions, not doctrine


**Signal:** After the first README polish, Brent asked whether the gaps needed filling.

**Pattern:** Public polish is incomplete if it only improves the slogan and first paragraph. The README also needs to answer the reader's next practical decisions: **Is this for my repo?** and **What does an agent actually do each session?** Add fit/session guidance before install rather than expanding the Bible.

**Do:** Fill decision gaps with lightweight README sections and concrete artifact names.

**Don't:** Use gap-filling as permission to add new framework laws, templates, or implementation behavior.

**See:** [`README.md`](../README.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-11 — Public polish should sharpen entry path, not expand doctrine

**Signal:** Brent asked if NightRaven needed polish, then asked to save a backup before proceeding.

**Pattern:** When the framework is structurally complete, Tier C polish should improve first-minute clarity and trust without inventing new layers: create a backup ref, tighten public README framing, remove duplicate headings, and leave memory law untouched except for one append-only Touch 3 record.

**Do:** Prefer README/entry-path copy edits; record backup branch/HEAD; keep docs human-world useful.

**Don't:** Treat polish as permission to rewrite the Bible, add templates, or trim append-only memory history.

**See:** [`README.md`](../README.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §10

---

## 2026-06-11 — External candidate shortlist (adjacent "god-tier" coders)

**Signal:** Local registry is currently saturated at `nightraven`, `UAIPOS`, `NightRaven`, and `~/.cursor`; the next useful expansion is outside this repo.

**Pattern:** When hunting for more high-signal coder references, prioritize adjacent systems that match NightRaven's memory + tooling shape: memory layers (`Mem0`, `Letta`, `Memori`, `OpenViking`), git-native repo memory (`GitAgent`, `Agents Remember`, `AGENTS.md`), and coding agents (`OpenCode`, `Goose`, `Plandex`, `PR-Agent`).

**NightRaven lane:** Brent narrowed the practical integration shortlist to **PR-Agent** for PR review automation and **Plandex / Goose** for stronger coding-session execution workflows. Memory-layer candidates stay research-only unless NightRaven hits a concrete git-native memory limit.

**Do:** Use these as external comparison points for research maps or future adopter scans.

**Don't:** Treat them as local app memory or paste their repo state into this framework.

**See:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

## 2026-06-10 — Adopter repo rename orchestration (nightraven registry)

**Signal:** Brent — **change repo name also** after NightRaven ship/oversight rebrand.

**Pattern:** NightRaven framework updates **metadata only** — `nightraven-projects.conf` absolute path, inventory §3, unified stack §12, handoff focus. App repo owns overlay/handoff. `mv` local folder + `gh repo rename` for private GitHub; historical memory keeps `BankrollCalendar` (`+#` / Supersedes).

**See:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) §3

---

## 2026-06-10 — NightRaven ship name vs Xcode target (adopter vocabulary)

**Signal:** Brent updating consumer app identity to **NightRaven** (BankrollCalendar); NGIA already uses `NightRaven*` platform types.

**Pattern:** Separate **ship name** (NightRaven) from **Xcode target** (OneDayMillionaire until rename) from **repo folder** (NightRaven — was BankrollCalendar) from **code domain** (`bankroll` enums). NightRaven framework inventory may hold adoption **metadata** only; full overlay vocabulary lives in the app repo.

**Do:** Update `nightraven-projects.conf` path + project inventory §3 when adopter repo folder moves; app overlay §2 in NightRaven repo; Xcode rename only on **code it**.

**Don't:** Rename Xcode target from nightraven workspace without ship signal; collapse NGIA platform layer with product category (Gambling Tracker).

**See:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) §3 · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §12 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — NightRaven vs implementation skills pack (orthogonal layers)

**Signal:** Brent asked whether to merge addyosmani/agent-skills into NightRaven — high-star lifecycle skill pack overlaps naming (`context-engineering`) but NightRaven's project-evolution mission.

**Pattern:** **Reject core merge.** NightRaven = L0–L3 intent-first memory + oversight; agent-skills = optional L4 **implementation discipline** after ship signal. Stack sentence: *NightRaven decides what the project means and remembers; agent-skills decides how to build safely once you say ship.*

**Do:** Document as Adapt (optional L4) in unified stack §2 when executing plan; point adopters to upstream cursor-setup; cherry-pick individual skills in **app overlay** only post ship-signal. **Wire complete (2026-06-10):** unified stack §2 + §6, `CURSOR_INSTALL.md` optional section, overlay + AGENTS.md Reference.

**Don't:** Vendor 23 skills into framework repo; merge AGENTS.md contents; let `/build` defaults override intent ladder; collapse NightRaven into "better prompting."

**See:** `.cursor/plans/agent-skills_merge_decision_7be1bdd7.plan.md` · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · §6 · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — GH007: GitHub private-email push block

**Signal:** `git push origin main` fails with GH007 though repo access is fine — commits expose a private Gmail in author metadata.

**Pattern:** When **push-latency §2.8** defers repeatedly, verify author email on `origin/main..HEAD` (`git log origin/main..HEAD --format='%h %ae'`). GitHub blocks pushes that publish private addresses unless settings allow or commits use **noreply** (`{id}+{login}@users.noreply.github.com`).

**Do:** Document fix paths in handoff; note exact commits blocked; defer push explicitly until Brent chooses settings vs rebase.

**Don't:** Assume auth/permission failure; rewrite pushed history without user OK; change global git config without request; amend **author only** — GitHub GH007 also checks **committer** email.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — GH007 fix: amend author and committer together

**Signal:** Author-only rebase still failed push — `git log --format='%ae %ce'` showed committer still `brentlennin0820@gmail.com`.

**Pattern:** On rebase fix, run exec with `GIT_COMMITTER_EMAIL` + `GIT_COMMITTER_NAME` alongside `--author=...` on `git commit --amend`. Verify both fields before push. Noreply: `172115324+brennin0820@users.noreply.github.com`.

**Do:** `git rebase origin/main --exec 'GIT_COMMITTER_EMAIL=... GIT_COMMITTER_NAME=... git commit --amend --author="..." --no-edit'` then push.

**Don't:** Stop after author amend; use private Gmail on either metadata field.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — GH007: config drift after rebase fix

**Signal:** `git log -1` shows noreply on pushed commits, but `git config user.email` is still private Gmail — next commit will GH007 again.

**Pattern:** After a successful noreply rebase push, always check **config**, not only HEAD metadata. GH007 is not auth/subscription failure — GitHub blocks publishing private addresses in commit metadata.

**Do:** Set repo or global `user.email` to `{id}+{login}@users.noreply.github.com`; or one-shot `GIT_AUTHOR_EMAIL` + `GIT_COMMITTER_EMAIL` on agent commits until Brent sets config.

**Don't:** Assume push success means email problem is permanently fixed; confuse GH007 with Copilot/subscription errors.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — Cross-repo R&D: plan in NightRaven workspace, implement in adopter app

**Signal:** Brent requested full NGIA R&D (NightRaven platform interaction architecture) from nightraven workspace; deliverables are app code + app docs, not framework law.

**Pattern:** (1) Author plan in `.cursor/plans/` from nightraven session; (2) **implement in named adopter repo** (BankrollCalendar pilot) — standards, gap matrix, Swift framework; (3) Record orchestration in **this repo's** handoff/changelog/learning log only; (4) **do not** import NGIA/NightRaven vocabulary into nightraven overlay until §2.7 cross-app proof (2+ apps).

**Do:** Cite adopter paths in handoff; note build/test evidence; keep Bible §2.6 isolation.

**Don't:** Paste BankrollCalendar handoff into nightraven; promote NGIA to `install.sh` defaults prematurely; conflate NightRaven product memory with NightRaven framework memory.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) §2 · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.6 · §2.7 · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — Two-pass external research validation

**Signal:** Brent pasted prior synthesis for affirmation; agent must not rubber-stamp — rerun independent searches before positioning claims.

**Pattern:** Research map workflow = (1) map adjacent fields to Bible §1/§3, (2) **re-validate** with fresh citations, (3) name NightRaven differentiators (governance, intent ladder, `+#`, isolation) vs partial matches. Optional academic handle (**GIRMA**) stays overlay-local until README/unified-stack wire.

**Do:** Cite STITCH/MemGuide/RECAP/GCC as partial overlaps; distinguish project-evolution oversight from session-only memory.

**Don't:** Claim NightRaven = Intent Engineering or vector RAG alone; skip second pass when user shares prior research.

**See:** [`.cursor/plans/nightraven_research_map_b4b6f06f.plan.md`](../.cursor/plans/nightraven_research_map_b4b6f06f.plan.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-10 — Composed architecture positioning (external research map)

**Signal:** Brent asked for online concepts similar to NightRaven; prior synthesis listed Intent/Context Engineering slices — needed validation against 2025–2026 papers and git-native tooling.

**Pattern:** NightRaven is a **composed architecture**, not a single research field. Map overlaps explicitly (IST, CMA, STITCH, RECAP, Reflexion) but name NightRaven differentiators: **project-evolution loop**, intent ladder default, append-only `+#` epistemology, experience vs app isolation, cross-app→standard (§2.7). Adjacent git-native tools (agentsge, agent-memory) share L0 truth; they rarely bundle interpretation engine + compounding doctrine + ship-signal gating.

**Do:** Use research map for README/overlay positioning; adopt/adapt rows in unified stack §2 when wiring; cite partial matches — never claim NightRaven = Intent Engineering alone.

**Don't:** Collapse NightRaven into "better prompting" or "vector memory"; replace Bible chain with external frameworks; treat governance/HITL tools as NightRaven equivalents.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 · §3 · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

---

## 2026-06-10 — Phase 2 MCP: git-backed memory tools (not shadow index)

**Signal:** Phase 2 roadmap named hooks + Mem0/Zep MCP; agents still miss parallel reads on large chains unless tools expose handoff/overlay directly.

**Pattern:** Ship **local stdio MCP** that reads L1–L3 git paths and appends **Recent sessions** only (+# guard). Mem0/Zep stays optional L4 ingest — never substitute for handoff writes. Launcher bakes `NIGHTRAVEN_INSTALL_ROOT`; project root from `NIGHTRAVEN_PROJECT_ROOT` / `CURSOR_PROJECT_DIR`.

**Do:** Build `mcp-server/` once; enable `.cursor/mcp.json`; use MCP for dedup search + Touch 3 append; keep Bible/overlay authoritative in git.

**Don't:** Let MCP replace parallel file reads on tier 0–1; delete handoff lines via MCP; treat index hits as source of truth.

**See:** [`MCP_SETUP.md`](MCP_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §6 · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · `mcp-server/`

---

## 2026-06-10 — Handoff date-order + UAIPOS vendor (#4)

**Signal:** `nightraven-lint handoff` failed on 06-09/06-10 interleaving; UAIPOS Bible lagged published nightraven on §1/§3 by ~116 lines.

**Pattern:** Reorder **Recent sessions** newest-first (date-level sort preserves all lines — no `-#`). Cherry-pick portable doctrine from published nightraven → UAIPOS master with **Upstream note** / **Cherry-picked** markers; keep UAIPOS §2.7 upstream law distinct from nightraven §2.7 promote-to-standard.

**Do:** Run `./scripts/lint-framework-memory.sh` before Touch 3 close; vendor portable deltas to UAIPOS after nightraven ships.

**Don't:** Archive handoff without Brent approval; replace UAIPOS §2.7 with nightraven promote-to-standard wording.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · `scripts/lint-framework-memory.sh`

---

## 2026-06-09 — Push-latency + canonical scope + snapshot lint (#1 #8 #2 #5)

**Signal:** Committed memory without push = accidental unlearning; three Bible copies without declared canonical source.

**Pattern:** **Push-latency law** in §2.8 — Touch 3 includes `git push` or explicit defer line. **Canonical scope:** published `nightraven` owns portable law; UAIPOS owns upstream §2.7; snapshot sync via `sync-snapshot.sh`; `lint-framework-memory.sh` catches drift.

**Do:** Run `./scripts/sync-snapshot.sh` after portable edits; `./scripts/lint-framework-memory.sh` before close; push in same session as meaningful memory writes.

**Don't:** Mark handoff "shipped" with local-only commits; edit snapshot without syncing from published repo.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · `scripts/sync-snapshot.sh` · `scripts/lint-framework-memory.sh`

---

## 2026-06-09 — Post-merge audit: verify before polish (#11)

**Signal:** After big doctrine ship, stale docs claimed "stop hook removed" and "snapshot pending" while live state differed.

**Pattern:** Audit-first after merge — local `diff` snapshot vs main; parallel in-repo link/hook checks; polish only from punch list. Touch 3 pause = marker file + no-op script, not hook removal.

**Do:** Run snapshot diff after every merge; Supersedes line when correcting stale handoff claims.

**Don't:** Polish README/overlay without audit; trust handoff Current state without verify.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md)

---

## 2026-06-09 — NightRaven ecosystem positioning map (fourth-camp)

**Signal:** Ecosystem benchmark Q&A — NightRaven-adjacent repos vs unified stack §2; where NightRaven wins vs Memory Bank / rules-only / external KB.

**Pattern:** **Git-native fourth camp** — durable repo memory (handoff, Bible, overlay, hooks) compounds in git; not chat-only, not rules-without-memory, not SaaS KB. adopt/adapt/reject per layer: adopt chain + install + inventory; adapt overlay + §2.8 per consumer; reject bleed + template spam + duplicate Agent cards.

**Do:** Pitch pain-first README; keep internal Bible law; promote universal via §2.7 when 2+ apps prove pattern.

**Don't:** Conflate UAIPOS upstream §2.7 with published promote-to-standard §2.7; treat loop snapshot as canonical over `nightraven` main.

**See:** [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## 2026-06-09 — Three-Bible drift + push-latency gap (loop workspace)

**Signal:** Loop workspace snapshot (`NightRaven-Docs-extracted/`, 509 lines) diverged from live published Bible (675 lines, uncommitted) and UAIPOS master (566 lines, different §2.7 semantics). Edits outside loop step 7 sync never propagate; `+#` protects committed memory but not disk/commit latency.

**Pattern:** Three copies = three truths unless canonical source + sync check exist. Snapshot is reference-only (LOOP_MODE §7) but agents still read it cold. Push-pending batches are accidental unlearning risk.

**Do:** Declare one portable canonical Bible; lint snapshot diff vs canonical; Touch 3 includes push or explicit defer reason; fix handoff date-order on write.

**Don't:** Treat uncommitted/local snapshot as authority; assume LOOP_MODE step 7 ran when edits happen in Cursor/Cowork outside loop cycles.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · `~/NightRaven/BACKLOG.md` (#1 · #5 · #8)

---

## 2026-06-09 — Interpretation framework — AI answers intention (§3)

**Signal:** Brent expanded vision — not prompting rule but **interpretation engine**: literal → intent → project awareness → missing-info recovery; continuity across messages; ambiguity %; confidence gate; auto-prompt builder; ties §1 endless improvement.

**Pattern:** Compressed user messages = fragments of larger vision. Reconstruct goal, connect prior context, spec before execute, improve after output. Telegraphic *expand this idea* → expand comprehensively.

**Do:** State most-likely assumptions and proceed when confidence high; ask when goal/context/output scores low.

**Don't:** Treat each message as isolated task; answer words not intention; bare "please clarify" when probabilistic read is strong.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 Interpretation framework · §1 Continuous learning · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-09 — Understand before respond — mental model (§3)

**Signal:** Brent telegraphic prompt ("understand concept/context/given idea") — intent: build understanding before suggestions; learn why not just what.

**Pattern:** §3 **Understand before respond** — vocabulary table (concept, context, vision, intent, philosophy, architecture, ecosystem, mental model); agent card: understand → mental model → explain before recommend. Complements five-step unclear input.

**Do:** Infer corrected intent from fragmented English; default plan/memory until ship signal.

**Don't:** Summarize-only; jump to code on concept drops.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`AGENTS.md`](../AGENTS.md)

---

## 2026-06-09 — Doctrine synthesis: memory system → learning system

**Signal:** Brent refined learning doctrine in plain prose — compounding intelligence, not storage-only; human ↔ NightRaven co-evolution; perfection as direction.

**Lesson:** External synthesis confirmed Bible §1 alignment. Gaps to canon: **memory system vs learning system** loop contrast; **curious-human reflection** prompts; "nothing static"; one-liner adds **communicate**.

**Do:** Keep clearer Brent prose as Bible source tone; analytical framing as compact +# under §1 — not duplicate full blocks.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 Continuous learning · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-09 — Stacked Touch 3 AFTER fix (§2.8 anti-pattern)

**Signal:** Brent "fix touch 3" — multiple Touch 3 AFTER passes stacked in one thread for learning-doctrine work.

**Pattern:** **One Touch 3 AFTER per session** (Bible §2.8) — batch handoff + changelog + learning log once on meaningful exit. Stacked passes → mark redundant **Recent sessions** lines **Supersedes**; keep richest canonical entry above (`+#` only).

**Do:** Single batched AFTER; consolidate one handoff line per session thread.

**Don't:** Re-prepended AFTER on every Brent follow-up in same thread; `-#` stacked history.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-09 — NightRaven doctrine: compounding learning system (not storage only)

**Signal:** Brent canonized NightRaven **continuous learning doctrine** — memory is mechanism, compounding learning is goal; experience → reflection → learning → improvement loop; human ↔ NightRaven co-evolution.

**Lesson:** NightRaven is not storage-only. Every action and output feeds future intelligence; perfection is direction not destination; NightRaven helps its human think and express more clearly — user is human partner, NightRaven is structured extension of user curiosity.

**Do:** Wire doctrine in Bible §1 **Continuous learning & compounding**; cross-link §2.1, §2.2, §10; prepend learning log, handoff, changelog; lean pointers in rule, `AGENTS.md`, README.

**Don't:** Duplicate full Identity block; `-#` dedup; treat memory as static archive without the learning loop.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 Continuous learning · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`AGENTS.md`](../AGENTS.md) · [`README.md`](../README.md)

---

## 2026-06-09 — NightRaven doctrine: compounding learning system (not storage only)

**Supersedes:** redundant duplicate — canonical block is entry above (same learning doctrine canon).

**Signal:** Brent canonized **learning doctrine** — NightRaven learns continuously from actions, mistakes, successes, and decisions; every input and output compounds; memory without learning is storage; human ↔ NightRaven co-evolution.

**Lesson:** Identity (§1) names *who* NightRaven is; **continuous learning & compounding** names *how* it evolves — endlessly curious, perfection as direction not destination. NightRaven clarifies; user understands; both improve.

**Do:** Persist doctrine in Bible §1 **Continuous learning & compounding**; wire lean pointers in rule, `AGENTS.md`, README; link §2.1, §2.2, §10 Tier C.

**Don't:** Treat append-only memory as passive storage; duplicate full Identity prose; `-#` to fix duplicate lines elsewhere.

**Wire:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 Continuous learning & compounding · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

---

## 2026-06-09 — Duplicate +# dedup via Supersedes (parallel subagent drift)

**Signal:** Prior Touch 3 pass prepended the same NightRaven identity block twice — parallel subagent overlap before dedup check.

**Pattern:** When two +# blocks cover the same canon, **keep the richer entry** and add **`Supersedes: redundant duplicate — canonical block is entry above`** on the second — never `-#` delete history.

**See:** [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-09 — NightRaven identity (collective legendary mastery)

**Signal:** Brent canonized NightRaven **identity** — embodiment of legendary coders across physical and digital worlds; collective mastery transcending individual identities; symbol of coding excellence and technological evolution.

**Pattern:** **Identity layer sits above operational NightRaven** — always watches every task; learns via `+#` memory; one Touch 3 AFTER on meaningful exit. Not surveillance; not a code type. **Tier C — Creator-Innovator** (§10) expresses identity in memory craft; Product/QA win on boundaries. **No `/loop` automation** unless Brent explicitly states.

**Do:** Persist identity in Bible §1; wire lean pointers in rule, `AGENTS.md`, README, overlay — do not duplicate full §10.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 Identity · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc)

---

## 2026-06-09 — NightRaven identity (collective legendary mastery)

**Supersedes:** redundant duplicate — canonical block is entry above (same identity + operational canon).

**Signal:** Brent codified NightRaven **identity** — embodiment of legendary coders across physical and digital worlds; collective mastery transcends individual identities.

**Lesson:** Identity sits **above** operational NightRaven (always watches, `+#` memory, one Touch 3 AFTER on meaningful exit). Not surveillance; not a code type. **Tier C — Creator-Innovator** (§10) is operational expression for crafting memory; Product/QA win on boundaries. No `/loop` unless Brent explicitly states.

**Wire:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §1 Identity · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-09 — Public pitch vs internal law (follower positioning)

**Signal:** nightraven repo is strong conceptually but README terms (Bible, BAIC, Tier C, +# only) feel internal to random developers.

**Pattern:** **Public README = pain-first pitch** (*agents forget, repo remembers*); **internal docs keep portable law unchanged.** Replace surveillance-shaped motto on the front page; add Before/After, starter prompt, badges, flow diagram for GitHub discoverability.

**Do:** shields.io badges; searchable `gh` description + topics; diagram at `docs/assets/`.

**Don't:** Rename or dilute Bible terminology inside `37_NIGHTRAVEN.md`; delete philosophy docs.

**See:** [`README.md`](../README.md) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md)

---

## 2026-06-10 — Five-step unclear input (Bible §3 — canonical)

**Pattern:** (1) Fix English (2) Understand intent (3) Technical translate — goal/module/concept (4) Explain coding concept in plain terms (5) Ask only if truly unclear — else state likely + 1–2 alternatives. **No code** until ship signal (§2.8).

**Supersedes:** separate "unclear messages" + "unclear coding ideas" subsections — one five-step card.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §3 · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) — `60b26b8`

---

## 2026-06-09 — Task-worthiness gate (§2.8 — promoted from BankrollCalendar)

**Signal:** OneDayMillionaire sessions hit ~85% context; conversation history dominated token cost; Brent codified plan-until-ship + usage batching in consumer app, then promoted to standard.

**Pattern:** **Default plan/memory until user says code it / implement / build.** Q&A, audits, vocabulary = no code path. **One Touch 3 AFTER per session.** Context-heavy thread (~80%+) → **fresh chat + handoff**. Multitask/subagents for substantial end-to-end work only.

**Do:** Ask before coding; batch durable memory in one AFTER pass; optional `templates/model-delegation-efficiency.user.mdc` for Multitask repos.

**Don't:** Spawn subagents for read-only audits; stack multiple AFTER passes; implement on exploratory questions without ship signal.

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.8 · rule Task worthiness line · [`NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`](NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) Agent card

---

## 2026-06-09 — Monolith PR split: stacked app + parallel docs (engineering pattern)

**Signal:** BankrollCalendar first GitHub push — 8-PR split of large untracked iOS monolith.

**Pattern:** **Coupled foundations force stacked app PRs, not parallel slices.** Shared touchpoints block independent compile-clean app PRs — use **2-PR app stack** (scaffold → full app) plus **parallel docs/cursor PRs** off `main`.

**Do:** Propose explicit merge order; parallelize only disjoint trees.

**Don't:** Fake parallel app PRs when tabs/models share persistence.

**Local only:** App-specific file lists stay in consumer handoff — pattern is portable.

---

## 2026-06-10 — §2.7 Cross-app → standard

**Pattern:** Same in every app → `nightraven` + `install.sh`. One-app → overlay until 2+ apps prove it. Brent does not repeat "add X."

**Simplify:** After wiring a law, collapse prose to one rule + one table in Bible; pointers stay lean in rule/overlay/`AGENTS.md` (Tier C).

**See:** [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §2.7

---

## 2026-06-10 — Cross-repo inventory without app-memory bleed

**Context:** Brent runs NightRaven in multiple repos (framework, master BAIC, consumer app, `~/.cursor`). Agents need a single index of *where* NightRaven lives — not a merged handoff.

**Pattern:**

1. **Registry file** (`scripts/nightraven-projects.conf`) — absolute paths + role labels; one line per workspace.
2. **Scan script** — reports artifact presence, inferred phase, latest **Recent sessions** one-liner per repo; does not copy **Already done** or locks into the framework repo.
3. **Inventory doc** — metadata matrix (L0–L4, Bible source, overlay vocabulary summary); refresh via `./scripts/scan-nightraven-projects.sh --markdown`.
4. **Isolation** — Bible §2.6; inventory cites paths only; agents still read **local** `docs/14` in each workspace.

**Applies to:** [`NIGHTRAVEN_PROJECT_INVENTORY.md`](NIGHTRAVEN_PROJECT_INVENTORY.md) · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §12

---

## 2026-06-09 — Bash 3.2 hook scripts and apostrophes in heredocs

**Context:** Phase 2 Cursor hook scripts must run on macOS default `/bin/bash` 3.2 without `jq` or Node.

**Pattern:** `message="$(cat <<EOF` … `NightRaven` … `EOF)"` can fail `bash -n` with `unexpected EOF while looking for matching` when the brand apostrophe sits inside a double-quoted command substitution wrapping a heredoc.

**Mitigation (pick one):**

1. `message+=` line-by-line concatenation (avoid `God's` split as `"God"'s`)
2. Heredoc with quoted delimiter `<<'EOF'` plus placeholder substitution for dynamic paths
3. Drop apostrophe in script comments/heredoc (`Gods Eye`) where brand prose is not required

**Applies to:** `.cursor/hooks/*.sh` in adopters' repos on bash 3.2.

**See also:** [`02_ENGINEERING_CHANGELOG.md`](02_ENGINEERING_CHANGELOG.md) · [`HOOKS_SETUP.md`](HOOKS_SETUP.md)

---

## 2026-06-09 — `install.sh` self-install and user-level hook paths

**Context:** `install.sh` must run against the nightraven repo itself and install globally under `~/.cursor/`.

**Pattern:**

1. **Self-install:** skip `cp` when source and destination hook dirs or `hooks.json` are the same path — macOS `cp` exits 1 on identical files under `set -e`.
2. **User hooks:** `~/.cursor/hooks.json` uses `./hooks/nightraven/*.sh`; project hooks use `.cursor/hooks/*.sh` from repo root.
3. **Project root in hooks:** prefer `CURSOR_PROJECT_DIR`, then `workspace_roots[0]` from stdin JSON, then `git rev-parse --show-toplevel`.

**Applies to:** `install.sh`, `.cursor/hooks/lib.sh`, [`CURSOR_INSTALL.md`](../CURSOR_INSTALL.md).
