# NightRaven repo overlay — local layer

**Local layer only.** Portable laws live in **`docs/37_NIGHTRAVEN.md`** (vendored or at `$NIGHTRAVEN_ROOT`).

This file holds **this project's** vocabulary, boundaries, and disambiguation. Do not duplicate portable content — cross-link the Bible. **Portable identity:** Bible §1 **Identity** (collective legendary mastery) — do not duplicate full prose here.

**Router:** `docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md` (if present)

**Identity (portable):** Bible §1 — collective legendary mastery; do not duplicate full prose here.

**Learning doctrine (portable):** Bible §1 **Continuous learning & compounding** — memory is mechanism; compounding is goal (§2.1 · §2.2 · §10); do not duplicate full prose here.

**Default posture:** **Tier C — Creator-Innovator** (Bible §10). Product/QA win on product boundaries.

---

## 1. Vocabulary (this repo)

| Term | Meaning |
|------|---------|
| **Standard** | Cross-app stuff in this repo + `install.sh` — adopters get it by default (§2.7) |
| **Local** | One-app product facts — overlay only until 2+ apps prove universal |
| **Five-step unclear input** | Bible §3 — fix English · intent · technical translate · explain · ask if truly unclear |
| **Understand before respond** | Bible §3 — mental model (concept, context, vision, philosophy, evolution); explain before recommend |
| **Interpretation framework** | Bible §3 — intention not words; 4 layers, continuity, ambiguity resolver, usage protection, auto-prompt builder |
| **Composed architecture** | NightRaven positioning — synthesis of intent/context/intent-aware memory/rewrite/reflect/git-native fields; no single external product or paper matches fully |
| **GIRMA** | Local academic handle — Governed Intent-Reconstruction Memory Architecture; optional positioning label (not portable law) |
| **Implementation skills pack (optional)** | External lifecycle workflows (e.g. [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)) — L4 consumer add-on **after** ship signal; does not replace Bible or handoff |
| **Nightrave core** | The central communication hub/engine for the NightRaven ecosystem; agents must always communicate context/status to this core |
| **Governed Bypass** | Rules (such as `+#` only) may be bypassed if the agent explicitly obtains Brent's approval first and the bypass benefits the codebase/workflow |
| **Always Sync** | Always download (pull/fetch) and upload (commit/push) all changes to the repository every time a change happens |
| **Local mode** | Agent execution under LM Studio — serial, strict context pruning, no subagents; see [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) |
| **Cloud mode** | Agent execution under cloud frontier models — parallel reads, subagents allowed, fresh thread at 80% context; see [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) |
| **Architect Division** | Structural/design oversight gap between Brent's **11-division proposal** (Product, Research, Architect, Builder, Design, QA, Security, Auditor, Documentation, DevOps + Core), **NightRaven runtime** divisions, and Bible **§9 six virtual teams**; Phase 0 = memory wire only — see Bible §9 pointer · handoff Recent sessions |
| **Repeated intentions (continuity engine)** | Stable intent tiers agents load at Tier 2+ cold start; synthesized from handoff + Bible §3 — interpretation engine · memory-before-code · Always Sync · `+#` only · Touch 3 · §2.7 standard · isolation · Governed Bypass · NightRaven Core · local/cloud · division taxonomy · Tier C · compounding; pointer: handoff Recent sessions · Bible §3 |
| **Division taxonomy scope** | Open question — portable NightRaven standard vs NightRaven-scoped runtime mapping; **TBD** (do not decide for Brent); Phase 0 memory only |
| **Execution-path combos** | NightRaven runtime overlay — Builder · +Auditor · +Design · +all; not a rename of Bible §9 virtual teams or 11-division product taxonomy |
| **Design Division (runtime)** | Read-only UX/visual pass before or after Builder on UI-touched work; distinct from Bible §9 **Design/UX** virtual team (loop readability) |
| **Pre-coding gate** | NightRaven card — correct → intent → domains → division combos → NightRaven Final Report before mutating writes |
| **Risk label map** | User/protocol Low→Critical maps to NightRaven TRIVIAL→CRITICAL matrix — see NightRaven skill mapping table; do not replace matrix |
| **NightRaven (umbrella brand)** | Brent's unified product family — memory (NightRaven) + orchestration (Core) + Compass + iOS app; **monorepo** at repo root · see [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) |
| **NightRaven monorepo** | `apps/compass/` merged Phase 1; framework at root; iOS merge pending; GitHub rename deferred |
| **NightRaven Compass** | NightRaven **guidance app** at `apps/compass/` — mock task/scope UX · Vite file API reads handoff/overlay/registry; see [`apps/compass/README.md`](../apps/compass/README.md) · handoff Recent sessions |
| **NightRaven Compass — agent entry** | **Supersedes** stale "mock only" read for agents — Phases 1–8 live · registry mode + IndexedDB overrides + mtime auto-refresh · consumer handoff per `nightraven-projects.conf` path; agent onboarding: [`apps/compass/AGENTS.md`](../apps/compass/AGENTS.md) · architecture: [`apps/compass/docs/ARCHITECTURE.md`](../apps/compass/docs/ARCHITECTURE.md) |
| **HimFLer external coder roles** | Consumer repo only — Claude (UI) → Codex (build) → **Antigravity** (Planning + Architecture Auditor); `E:\NightRaven\HimFLer\docs\BUILD_ROLES.md` · `UI_DESIGN_BRIEF.md` — Antigravity not framework-standard until promoted |
| **Cross-platform task routing (Brent)** | Personal stack — Cursor ($60) · Codex CLI · ChatGPT Plus · Claude ($20, Code+Pro same sub) · **Gemini** · **Antigravity**; Gemini + Antigravity both active (research vs plan/audit); **strict:** greenfield build → **Codex CLI first**; user rule `~/.cursor/rules/multi-platform-task-routing.mdc` · complements `usage-budget.mdc` · **triage only on substantial new work**, not every prompt |
| **ChatGPT Work with Apps (Brent)** | macOS ChatGPT desktop **pair Cursor/VS Code** so ChatGPT reads **open editor panes** — open all relevant tabs before prompt; user rule `~/.cursor/rules/chatgpt-work-with-apps.mdc` |
| **Usage-friendly passive mode** | Default Cursor chat — **not** full NightRaven orchestration; no Phase 0 report · ledgers · division spawn · Core status dump per message; **`/nightraven` or "orchestrate"** activates full protocol; rule + AGENTS fast paths |
| **Repeat task lane** | Before reads/explore: reuse thread context · scan handoff **Recent sessions** + **Already done** on fresh thread · named path only · **continue/again** inherits last outcome — Bible §2.8 · anti-pattern: repeat re-exploration §6 |
| **Multi-phase handoff gate** | `.cursor/.multiphase-in-flight` marker — defer handoff read/append/Touch 3 until all phases complete; hooks honor marker; one consolidated +# at end; subagents never handoff |
| **LM Studio division improve loop** | Serial local review of all divisions via [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh) → `docs/lmstudio-reviews/`; Bible local doc §6; no parallel under LM Studio |
| **Unified Manifest (orchestration)** | Machine-readable NightRaven run manifest (YAML, `version: 1`) — orchestrator + divisions · claim file `AGENT_WORK_LOG.md` · parallel streams with serialized/protected paths (one agent per Swift file · single-stream `project.pbxproj`) · build/audit ledgers · status doc `PARALLEL_RUN_STATUS.md` · no commit without approval; consumer instances live at `.nightraven/*.yaml` in the app repo (e.g. `linenflow-parallel.yaml` — **LinenFlow** Swift app @ Mac `Developer/NightRaven`); worked example: [`examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml`](../examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml) |

---

## 2. Product boundary

- **Cross-app → here + install** (§2.7). **One-app → consumer overlay** until proven universal.

---

## 3. Connected chain (this repo)

| Layer | Path |
|-------|------|
| Rule | `.cursor/rules/nightraven-context-intent.mdc` |
| Bible | `docs/37_NIGHTRAVEN.md` or `$NIGHTRAVEN_ROOT` |
| Overlay | this file |
| Handoff | `docs/14_SESSION_HANDOFF.md` |
| Entry | `AGENTS.md` |
| MCP (optional Phase 2) | `docs/MCP_SETUP.md` · `.cursor/mcp.json` · `mcp-server/` |
| Inventory | `docs/NIGHTRAVEN_PROJECT_INVENTORY.md` — cross-repo scan (framework repo only) |
| Research map (plan) | `.cursor/plans/nightraven_research_map_b4b6f06f.plan.md` — external field overlaps vs NightRaven differentiators |
| agent-skills merge (plan) | `.cursor/plans/agent-skills_merge_decision_7be1bdd7.plan.md` — reject core merge; optional L4 adapt · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md) optional section · [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) §2 · §6 |
| Claude adoption (#15) | [`CLAUDE_ADOPTION.md`](CLAUDE_ADOPTION.md) — Claude Code install path · vendor list · MCP optional · noreply git author · hooks parity |
| Local vs Cloud | [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) — local vs cloud execution design |
| NightRaven unified product | [`NIGHTRAVEN_UNIFIED_PRODUCT.md`](NIGHTRAVEN_UNIFIED_PRODUCT.md) — umbrella brand · monorepo layout · merge status |


---

## 4. Agent pitfalls (portable — quick scan)

Read Bible **§0 Agent quick start** + **§2.8**. **Agent card:** `docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md` (canonical — do not copy).

| Pitfall | Remember |
|---------|----------|
| **Code before ship signal** | Plan/memory until **code it** / **implement** / **build** — §2.8 |
| **Heavy thread cost** | Context-heavy chat (~80%+) → fresh thread + handoff — §2.8 |
| **Push-latency** | Bible §2.8 — push before Touch 3 exit or explicit defer in Recent sessions |
| **Small-ask subagents** | Audits, vocabulary, docs-only — foreground only — §2.8 |
| **Forgetting Always Sync** | Every change must be pulled then pushed — no local-only commits when remote is configured |
| **Rule bypass without approval** | Governed Bypass requires explicit Brent approval first — never silently bypass `+#` only |
| **Local mode parallelization** | No subagents or parallel reads on LM Studio — serial only; see `NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md` §4 |
| **Repeat re-exploration** | Handoff/thread already answered — cite and continue; Bible §2.8 repeat lane |
| **Orchestration theater** | Passive mode default — `/nightraven` only when needed; §2.8 |
| **LM Studio Personal Network** | Division script uses Mac Local Server API; preferred remote (e.g. RTX 4080) runs GPU — see local doc §6 Personal Network; `--model` from `/v1/models` |
| **LM Studio embed models** | Do not use embedding models (e.g. Nomic Embed) with division-improve chat script — chat/completions models only; see §6 roster |
| **LM Studio auto-patch myth** | Review-only script: `.md` not `.json`; dry-run = skill/gap not patch stats; zsh `print -n`+`read` on macOS; see §6 zsh one-liner + expected output |

---

## Supersedes — canonical brand (2026-06-13)

**Forward-facing agent guidance:** **NightRaven** is the canonical user-facing brand for this framework (memory, oversight, adoption). Legacy names **God's Eye**, **God'sEye**, **GE**, and **`GODS_EYE_*`** paths remain in historical handoff entries, plan filenames, and archaeology only — do not introduce new GE branding in rules, AGENTS, overlay wire, or README. Brent speech may still say "god's eye"; map to oversight intent per Bible §0 (not a brand revert).

---

## Supersedes — rename cycle stop (2026-06-13)

**Forward-facing:** Brent superseded the **rename all filenames** request. Do **not** resume bulk GE→NightRaven path renames, parallel rename workers, or reference sweeps beyond memory wire until explicit **code it** / **implement** / **build** ship signal. This cycle: **`+#` only** · **this repo only** · **no new template scaffolds** · **stop** (no commit/push). Prior worker **`d41a2b79`** interrupted mid-scan only — committed batch (**23** renames ahead of `origin/main`) may ship when Brent says **commit**; unstaged deltas (SKILL · `.vscode` · root `gods-eye` gitlink deletes) are separate.

## Supersedes — GE filename sweep complete (2026-06-13)

**Forward-facing:** Brent resumed **rename all remaining GE filenames** — final tracked renames: `docs/assets/gods-eye-flow.png` → `nightraven-flow.png` (README already pointed at target); removed stale root `gods-eye` / `gods-eye-1` submodule gitlinks. Prior batch (**23** `git mv` on `main` ahead of origin) already covered docs `GODS_EYE_*` → `NIGHTRAVEN_*`, rules, templates, MCP, scripts, Compass. **No GE-named files remain in git index.** Mock Compass IDs `task-ge-*` / `prompt-ge-*` → `task-nr-*` / `prompt-nr-*`. **Uncommitted** — say **commit** when ready.
