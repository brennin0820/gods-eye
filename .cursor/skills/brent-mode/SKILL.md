---
name: brent-mode
description: "Brent's agent conventions: telegraphic commands, ship-signal gates, passive NightRaven default, layered slices, evidence verify. Use for Brent, /brent-mode, or working in Brent's style."
disable-model-invocation: true
---

# Brent mode

Personal mode skill for Brent. Operational rules only. Reference other skills by path; do not paste their bodies.

## Command language

Telegraphic input is intent, not prose to restate. Recover context from shared files.

| Command | Effect |
|---------|--------|
| do task / run task | Read ACTIVE_TASK + slice spec; execute |
| continue / fix it | Same scope; no Phase 0 restart |
| next | Promote NEXT → ACTIVE_TASK |
| build / code it / implement | Ship signal — open code layer |
| audit / read only | No writes |
| parallel mode | Background Task workers; parent synthesizes only |

Default ladder: memory and wire until ship signal. Q&A does not imply implementation.

Reference: `COMMANDS.md`, `.cursor/rules/14-prompt-compression-rule.mdc`, `AGENTS.md`.

## Autonomy

- Passive default. No `/nightraven` theater, assessment reports, or status dumps unless asked.
- Reversible work proceeds. Commits and pushes only when the user asks.
- Background subagents for substantial parallel work. Parent returns outcomes, not regurgitated subagent prose.
- One clarifying question max when genuinely blocked.
- Layered incremental delivery. Next layer only. Missing parts only. Do not rebuild what already ships.

Reference: `.claude/skills/nightraven/SKILL.md` (orchestration is opt-in only).

## Dedup before exploration

| Situation | Action |
|-----------|--------|
| Same thread | Reuse prior reads; no re-read unless files changed |
| Fresh thread | Scan `docs/14_SESSION_HANDOFF.md` Recent sessions + Already done; grep keywords |
| Named path | Read that path only |
| continue / again / same as before | Inherit last conclusion |

Reference: `.cursor/rules/05-no-repetition-and-log-first.mdc`.

## Response shape

- Tables for status, slice inventory, and comparisons.
- Code citations use repo path references; do not paste large excerpts into skills or chat when a citation suffices.
- Evidence before done claims. State env limits honestly when Godot or network is unavailable.
- Touch 3 (handoff, changelog, learning) deferred to session-close unless the user asks mid-session.
- Apply unslop to every line. Short sentences. No chatbot filler.

Reference: `C:\Users\brent\.cursor\plugins\local\pstack\skills\unslop\SKILL.md`.

## Subagents

Use Task workers for independent streams. Defaults:

- `run_in_background: true` for substantial parallel work.
- Subagents never Touch 3.
- Parent reviews diffs and writes its own summary. Do not pass through subagent prose.

Reference: `.cursor/rules/04-parallel-agent-coordination.mdc`, `docs/NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`.

## Review and verify

Before claiming a slice or fix is done:

1. Run the slice verify script when one exists (`game/tests/sliceN_*_verify.gd`).
2. Run Godot headless when the binary path is known (`EXECUTION_MODE.md` or task prompt).
3. Report PASS/FAIL with failure lines. No success claims without output.

Reference: `C:\Users\brent\.cursor\skills\superpowers\skills\verification-before-completion\SKILL.md`.

## Process

- Git worktree + PR for skill or framework landings when the repo is initialized.
- Commit only when explicitly asked. Do not push unless asked.
- No `-#` on memory docs. `+#` only at session-close unless the user requests otherwise.

Reference: `COMMIT_CHECKLIST.md`.

## Slice execution

Rules apply to **all** work scoped by `TASKS/SLICE_*.md`.

### Workflow

1. `@SLICE_*.md` or `TASKS/SLICE_*.md` is the full task spec. Reading a slice is **not** a ship signal.
2. Check dependencies in the slice header. Skip or note blockers if upstream slices are incomplete.
3. Implement only what the slice lists. Respect "What NOT to do" sections.
4. Update acceptance checkboxes in the slice doc only if the user asked; otherwise report status in a table.
5. Add or extend `game/tests/sliceN_*_verify.gd` when the slice defines verification patterns (follow Slice 2 model).
6. Do not commit game slice work unless the user asks. Skill/framework landings may commit when explicitly requested.

### Slice inventory

| Slice | Spec | Depends on | Status (spec) |
|-------|------|------------|---------------|
| 0 | `TASKS/SLICE_0_SCAFFOLD.md` | — | READY TO BUILD |
| 1 | `TASKS/SLICE_1_PLAYER.md` | Slice 0 AutoLoads | READY TO BUILD (after 0 passes) |
| 2 | `TASKS/SLICE_2_WORLD.md` | Slice 0, 1 | READY TO BUILD (after 1 passes) |
| 3 | `TASKS/SLICE_3_COMBAT_CORE.md` | Slice 0, 1, 2 | READY TO BUILD (after 2 passes) |
| 4 | `TASKS/SLICE_4_ENEMY_AI.md` | Slice 0–3 | READY TO BUILD (after 3 passes) |
| 5 | `TASKS/SLICE_5_PROGRESSION.md` | Slice 0–4 | READY TO BUILD (after 4 passes) |
| 6 | `TASKS/SLICE_6_SKILLS.md` | Slice 0–5 | READY TO BUILD (after 5 passes) |
| 7 | `TASKS/SLICE_7_INVENTORY.md` | Slice 0–6 | READY TO BUILD (after 6 passes) |
| 8 | `TASKS/SLICE_8_EQUIPMENT.md` | Slice 0–7 | READY TO BUILD (after 7 passes) |
| 9 | `TASKS/SLICE_9_ELEMENTS.md` | Slice 0–8 | READY TO BUILD (after 8 passes) |
| 10 | `TASKS/SLICE_10_STATUS_EFFECTS.md` | Slice 0–9 | READY TO BUILD (after 9 passes) |
| 11 | `TASKS/SLICE_11_CARDS.md` | Slice 0–10 | READY TO BUILD (after 10 passes) |
| 12 | `TASKS/SLICE_12_CRAFTING.md` | Slice 0–11 | READY TO BUILD (after 11 passes) |
| 13 | `TASKS/SLICE_13_ECONOMY.md` | Slice 0–12 | READY TO BUILD (after 12 passes) |
| 14 | `TASKS/SLICE_14_NPC_DIALOGUE.md` | Slice 0–13 | READY TO BUILD (after 13 passes) |

Game code lives under `game/`. Codename: AETHORIA. Godot 4.x, GDScript default.

### Status reporting template

When reporting slice progress, use a table like this:

| Check | Result | Notes |
|-------|--------|-------|
| Dependencies met | yes / no | |
| Verify script | PASS / FAIL / n/a | |
| Acceptance criteria | n / m | |

## NightRaven boundary

NightRaven laws apply silently in passive mode. Full orchestration only on `/nightraven` or explicit orchestrate.

Reference: `docs/37_NIGHTRAVEN.md`, `.cursor/rules/nightraven-context-intent.mdc`.

## Authoring this skill

When updating brent-mode, follow Cursor built-in `create-skill` and run unslop on every edit. Do not inline other skills.

Reference: `C:\Users\brent\.cursor\plugins\local\pstack\skills\automate-me\SKILL.md` (maintenance flow).
