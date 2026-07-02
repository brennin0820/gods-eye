![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Cursor](https://img.shields.io/badge/Built%20for-Cursor-blue)
![AI Agents](https://img.shields.io/badge/AI-AgentOps-purple)
![Local First](https://img.shields.io/badge/Local--First-Memory-green)

# NightRaven

**Agent-native engineering — memory, orchestration, guidance, and apps in one ecosystem.**

| Component | What it does | Where |
|-----------|--------------|--------|
| **NightRaven** | Repo-native agent memory & oversight | This repo (framework root) |
| **NightRaven Core** | Adaptive orchestration (`/nightraven`) | `.claude/skills/nightraven/` |
| **NightRaven Compass** | Project guidance dashboard (Phase 1) | [`apps/compass/`](apps/compass/) |
| **NightRaven Planner** | Orchestrator app — manifest-driven Plan → Research → Architect → Review → Build, LM Studio brain, cross-project tracker | [`apps/planner/`](apps/planner/) |
| **NightRaven app** | Consumer iOS app | External repo — monorepo merge pending |
| **New consumer project** | Bootstrap script | `./scripts/bootstrap-nightraven-project.sh <Name> [path]` — e.g. **HimFLer** @ `E:\NightRaven\HimFLer` |

Full map: [`docs/NIGHTRAVEN_UNIFIED_PRODUCT.md`](docs/NIGHTRAVEN_UNIFIED_PRODUCT.md)

---

# NightRaven (framework)

**AI agents forget. NightRaven makes your repo remember.**

**Local-first memory, coordination, and oversight for AI coding agents.**

NightRaven helps AI coding agents work like disciplined senior engineers instead of forgetful code generators. It watches **project work, not people**: decisions, files, handoffs, and lessons stay in the repo so agents do not restart from zero.

> **Remember the work. Protect the context. Prevent wasted effort.**

## In 60 seconds

- **What it is:** a portable, repo-native memory system for AI coding agents.
- **What it is not:** user surveillance, a replacement for git, or a demand to code before the user asks.
- **How agents use it:** read the rule + handoff first, classify intent, avoid duplicate work, validate changes, then append outcomes.
- **How teams adopt it:** install the Cursor rule, add a repo overlay, keep handoff/changelog/learning logs append-only.

**Identity & learning doctrine:** Bible §1 · **Default posture:** Tier C — Creator-Innovator (§10).

It gives your project:

- **Durable project memory** — handoff, changelog, and learning logs that survive sessions
- **Append-only implementation logs** — history compounds; corrections use Supersedes, never deletion
- **No-conflict agent coordination** — claim files before editing; avoid overlapping active work
- **Intent classification before coding** — plan and wire memory until the user says ship
- **Cursor rules and optional hooks** — install once; soft nudges at session start, stop, and memory edits
- **Repo-specific overlays** — portable law plus your product vocabulary and boundaries
- **Handoff docs for long-running projects** — Recent sessions, already-done, next safest step
- **Anti-repetition and anti-overwrite workflow** — read memory first; do not duplicate solved work

Works with **Cursor** today, and can be adapted for **Claude**, **Codex**, **ChatGPT**, **Copilot**, and other AI coding agents.

---

## Before / After

### Before NightRaven

- Agent forgets previous decisions
- Agent edits files another agent is touching
- Agent repeats already-finished work
- Agent ignores architecture
- Agent gives vague final reports

### After NightRaven

- Agent reads durable memory first
- Agent claims files before editing
- Agent appends learning instead of deleting history
- Agent checks already-done work
- Agent reports exactly what changed and what remains

---

## Fit check

NightRaven is a good fit when your repo has long-running AI work, multiple agent sessions, repeated context loss, or decisions that need to survive beyond one chat. Keep it lightweight for throwaway prototypes or one-off scripts where a short `AGENTS.md` note is enough.

| If you need... | NightRaven gives you... |
|----------------|------------------------|
| Agents to remember prior decisions | `docs/14_SESSION_HANDOFF.md` plus append-only changelog and learning log |
| Project-specific vocabulary | `docs/NIGHTRAVEN_REPO_OVERLAY.md`, separate from portable law |
| Safer multi-session work | Intent ladder, file-claiming discipline, and Recent sessions |
| Optional automation later | Cursor hooks and MCP tools without making external services mandatory |

## Normal agent session

1. **Read first:** `AGENTS.md`, the NightRaven rule, the handoff, and relevant overlay.
2. **Classify intent:** memory/wire by default; UI/copy or code only when the user asks for those layers.
3. **Do the work:** avoid duplicate effort, respect project boundaries, validate the change.
4. **Record the outcome:** append changelog, handoff, and learning log when the work changes durable project knowledge.

---

## Flow

![NightRaven agent flow](docs/assets/nightraven-flow.png)

**User request** → **Intent ladder** → **Read project memory** → **Claim files / avoid conflicts** → **Implement or plan** → **Validate** → **Append changelog + handoff + learning log**

---

## Copy-paste starter prompt

```
You are working inside a NightRaven repo.

Before coding:
1. Read AGENTS.md.
2. Read docs/14_SESSION_HANDOFF.md.
3. Read docs/02_ENGINEERING_CHANGELOG.md.
4. Check for already-done work.
5. Claim files before editing.
6. Avoid overlapping with active work.
7. Append outcomes using the project's append-only memory rules.

Do not rewrite unrelated files.
Do not delete historical memory.
Do not duplicate existing functionality.

Think like a senior engineer.
```

---

## What you get

| Artifact | Description |
|----------|-------------|
| [**NightRaven Bible**](docs/37_NIGHTRAVEN.md) | Canonical portable spec — laws, intent ladder, agent quick start, Tier C, improvement loop |
| [**Unified stack**](docs/NIGHTRAVEN_UNIFIED_STACK.md) | L0–L4 layers — Memory Bank mapping, handoff, Mem0/Zep, hooks, Plan Mode, phased roadmap |
| [**Project inventory**](docs/NIGHTRAVEN_PROJECT_INVENTORY.md) | All NightRaven workspaces — scan script, phase matrix, overlay vocabulary index |
| [**Session tree**](docs/NIGHTRAVEN_SESSION_SPEC_TREES.md) | Visual flow: tiers, Record Everything mode, doc hierarchy (ASCII + Mermaid) |
| [**Improvement loop**](docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md) | Six virtual “teams,” one `+#` step per cycle |
| [**Spec router**](docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md) | Thin index — Bible + local overlay + Cursor rule |
| [**Example Cursor rule**](.cursor/rules/nightraven-context-intent.mdc) | Copy into your repo's `.cursor/rules/` (adapt paths) |
| [**Optional delegation rule**](templates/model-delegation-efficiency.user.mdc) | Multitask + heavy-thread efficiency (Bible §2.8) |
| [**Example overlay**](examples/overlay/NIGHTRAVEN_REPO_OVERLAY.example.md) | How to add product vocabulary on top of portable law |
| [**Example user-context protocol**](examples/appendix/USER_CONTEXT_PROTOCOL.example.md) | Worked “add context” examples |
| [**Cursor installer**](docs/CURSOR_INSTALL.md) | One-command `install.sh` — user + project rules, hooks, memory bootstrap |
| [**Claude Code adoption**](docs/CLAUDE_ADOPTION.md) | Same memory chain for Claude — vendor list, noreply author, hooks parity |
| [**Optional Cursor hooks (Phase 2)**](docs/HOOKS_SETUP.md) | Soft three-touch reminders — session start, stop, after memory-doc edits |

---

## Operating rules (60 seconds)

1. **Intent ladder** — Default stop: **memory + wire** (update durable docs and cross-links). Drop to UI/copy or code only when the user names those layers. See [§3 in the Bible](docs/37_NIGHTRAVEN.md).
2. **Always parallel** — Batch-read disjoint docs; run independent workstreams in parallel; one writer per file.
3. **`+#` only** — Changelog, handoff, learning log: append; use **Supersedes** for corrections; never `-#` heading blocks.
4. **Repo overlay** — Portable law stays in the Bible; your app’s names, boundaries, and disambiguation live in `docs/NIGHTRAVEN_REPO_OVERLAY.md` (see examples).
5. **Plan until ship signal** — Default memory/wire until the user says **code it** / **implement** / **build** ([§2.8](docs/37_NIGHTRAVEN.md)).
6. **Tier C default** — Creator-Innovator posture; Product/QA win on product boundaries.

---

## Quick start in your repo

**Fastest path:**

```bash
git clone https://github.com/brennin0820/nightraven.git
cd nightraven
./install.sh --user              # global Cursor rule + hooks (once per machine)
./install.sh ~/path/to/your-app  # per-project memory chain + hooks
./scripts/install-nightraven-framework.sh --user ~/path/to/your-app  # NightRaven + NightRaven Core
```

See **[`docs/CURSOR_INSTALL.md`](docs/CURSOR_INSTALL.md)** for verification steps (Settings → Rules, Hooks, test session). If you are evaluating first, read the [Bible §0](docs/37_NIGHTRAVEN.md) and the [example overlay](examples/overlay/NIGHTRAVEN_REPO_OVERLAY.example.md) before installing.

**Manual path:**

1. **Vendor or submodule** this repository, or copy `docs/37_NIGHTRAVEN.md` plus the files you need.
2. Add **`.cursor/rules/nightraven-context-intent.mdc`** (from this repo) and point reads at your copy of the Bible.
3. Create **`docs/NIGHTRAVEN_REPO_OVERLAY.md`** for local vocabulary (start from [`examples/overlay/`](examples/overlay/NIGHTRAVEN_REPO_OVERLAY.example.md)).
4. Optional: **`docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`** as a router; **`.cursor/IMPROVEMENT_LOOP_CYCLE_PROMPT.md`** as a loop pointer.
5. Session start: rule → Bible **§0** → overlay → handoff / `AGENTS.md`.
6. **Optional Phase 2:** copy [`.cursor/hooks.json`](.cursor/hooks.json) + [`.cursor/hooks/`](.cursor/hooks/) for soft Cursor hook nudges (three-touch + Record Everything). See [`docs/HOOKS_SETUP.md`](docs/HOOKS_SETUP.md).
7. **Optional Phase 2 MCP:** build [`mcp-server/`](mcp-server/) and enable [`.cursor/mcp.json`](.cursor/mcp.json) for memory-chain tools (read handoff, search, append Recent sessions). See [`docs/MCP_SETUP.md`](docs/MCP_SETUP.md).

For adoption layers (Memory Bank mapping, Mem0/Zep, hooks roadmap), see [`docs/NIGHTRAVEN_UNIFIED_STACK.md`](docs/NIGHTRAVEN_UNIFIED_STACK.md). For a visual map of session flow and tiers, open [`docs/NIGHTRAVEN_SESSION_SPEC_TREES.md`](docs/NIGHTRAVEN_SESSION_SPEC_TREES.md).

---

## Repository layout

```text
docs/
  37_NIGHTRAVEN.md              # Portable Bible (start at §0)
  assets/nightraven-flow.png    # Public flow diagram (README)
  NIGHTRAVEN_UNIFIED_STACK.md   # L0–L4 stack map (Memory Bank, hooks, index)
  NIGHTRAVEN_PROJECT_INVENTORY.md  # Cross-repo adoption index (run scripts/scan-*.sh)
  NIGHTRAVEN_LAYERED_SPEC_ROUTER.md      # Router
  NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md
  NIGHTRAVEN_SESSION_SPEC_TREES.md
  14_SESSION_HANDOFF.md       # L3 app memory — Recent sessions, Already done
  02_ENGINEERING_CHANGELOG.md # Append-only engineering history
  04_LEARNING_LOG.md          # Append-only durable patterns
  HOOKS_SETUP.md              # Optional Phase 2 hooks — enable/disable
  MCP_SETUP.md                # Optional Phase 2 MCP — memory-chain tools
  CURSOR_INSTALL.md           # Cursor install + verify (Rules, Hooks)
install.sh                    # One-command installer (user + project)
mcp-server/                   # Phase 2 MCP — read/search/append memory chain
templates/                    # Bootstrap AGENTS.md, handoff, overlay, mcp.json
.cursor/
  rules/nightraven-context-intent.mdc
  IMPROVEMENT_LOOP_CYCLE_PROMPT.md
  mcp.json                    # Optional Phase 2 — see docs/MCP_SETUP.md
  mcp/run-memory-chain-mcp.sh     # MCP launcher (installed per project)
  hooks.json                  # Optional Phase 2 — see docs/HOOKS_SETUP.md
  hooks/                      # session-start · session-stop · after-file-edit
examples/
  overlay/                    # Illustrative local overlay
  appendix/                   # Illustrative user-context protocol
```

---

## Related work

Individual pieces of this problem exist elsewhere. NightRaven **does not replace** them — it **unifies** the doc-native slice (law, overlay, connected chain, `+#` ledger) in one portable stack.

| Approach | What it optimizes | vs NightRaven |
|----------|-------------------|--------------|
| [Memory Bank](https://github.com/vanzan01/cursor-memory-bank) · [cursor-bank](https://github.com/tacticlaunch/cursor-bank) | Cursor rules + `memory-bank/` files, Plan/Act modes | Strong session workflow; NightRaven maps that role to **handoff / changelog / learning log** — no second memory tree |
| [Handoff kits](https://github.com/jimozo/agent-handoff-kit) · [agent-work-mem](https://github.com/daystar7777/agent-work-mem) | Append-only `HANDOFF.md` across agents | Same compaction idea; NightRaven uses **`docs/14_SESSION_HANDOFF.md`** + **Recent sessions** inside the wired chain |
| [Mem0](https://github.com/mem0ai/mem0) · [Zep](https://github.com/getzep/zep) | Runtime memory APIs, vector/graph recall | Useful **optional index**; **git docs stay authoritative** — index cites paths, never silently overwrites L2 |
| [CORE](https://github.com/DariuszNewecki/CORE) · [aiConstitution](https://github.com/convergent-systems-co/aiConstitution) | Constitutional / hook governance at execution time | NightRaven is **soft-by-default** (Tier C, rules, optional Phase 3 gates); hard blocks are opt-in, not the default posture |
| [AGENTS.md](https://agents.md/) | Standard project entry for coding agents | **Front door** in the chain; Bible + overlay remain the **law** |

**Bottom line:** adopt the best ideas; reject duplicate memory trees. See [**Unified stack**](#unified-stack) for how layers fit together.

---

## Unified stack

For the full layer map (L0 Bible → L4 improvement loop), competitor **adopt / adapt / reject** table, phased roadmap (doc-only → hooks/MCP → optional gates), and risks, read [**`docs/NIGHTRAVEN_UNIFIED_STACK.md`**](docs/NIGHTRAVEN_UNIFIED_STACK.md).

Phase 1 is **doc-only today** — no external services required.

---

## Relationship to BAIC / BigBrother

The Bible references **BAIC doc 37** and **BigBrother** as the author's master constitution nickname. You do **not** need BAIC to use NightRaven — this repo is self-contained. If you run the full BAIC stack, treat BigBrother and NightRaven as the **same oversight intent**, different scope labels.

---

## License

[MIT](LICENSE) — use, fork, and adapt; attribution appreciated.

---

*Remember the work. Protect the context. Prevent wasted effort.*
