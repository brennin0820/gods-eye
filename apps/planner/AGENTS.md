# AGENTS.md — NightRaven Orchestrator (Planner Phase 2)

**Read root [`AGENTS.md`](../../AGENTS.md) first** for NightRaven framework law.

---

## What this app is

**NightRaven Orchestrator** (package `@nightraven/planner`, still `apps/planner/` — see naming note below) is the multi-agent orchestration layer: it decomposes an app spec into a foundation layout, plans → researches → architects → reviews → builds it, with **LM Studio as its brain** and a **project tracker** across every registered NightRaven workspace. It sits between NightRaven memory (framework) and Compass (guidance UI).

**Motto chain position:** NightRaven thinks · **NightRaven Planner plans** · NightRaven builds · Auditor verifies · Compass points.

**Two entry points, two maturities:**

| Entry | What it runs | Brain |
|-------|--------------|-------|
| `npm run dev` / `run:flow` (`src/index.ts`) | Original deterministic dry-run demo — unchanged, no LLM, no manifest | None (stub logic) |
| `npm run orchestrate -- --manifest <path> [--approve]` (`src/orchestrate.ts`) | Manifest-driven run: Plan → Research → Architect → Review → **Build** (Phase 4, new), claim-file coordination, status doc + ledger writes | LM Studio (OpenAI-compatible), graceful deterministic fallback when unreachable |
| `npm run status` (`src/status.ts`) | Cross-project tracker — reads `scripts/nightraven-projects.conf`, reports availability, manifest presence, ledger activity per registered workspace | — |

---

## Agent roles (5-phase pipeline)

| Agent | Phase | Input | Output | LLM brain? |
|-------|-------|-------|--------|------------|
| `PlannerAgent` | 0 — Layout | App spec / intent | Module layout + dependency DAG | Optional — falls back to deterministic layout |
| `ResearchAgent` | 1 — Research | Module layout | PRD + best-practices + risks | Optional — falls back to deterministic PRD |
| `ArchitectAgent` | 2 — Architecture | Layout + research | ADRs + MoSCoW MVP scope + roadmap | Optional — falls back to deterministic ADRs |
| `ReviewAgent` | 3 — Review | Layout + architecture | Quality gate: DAG validation (incl. cycle detection), coverage threshold, pass/fail | **Never** — governance stays code, not model judgment |
| `BuilderAgent` | 4 — Build | Layout + architecture | File-change proposals; writes only with `--approve`, one path at a time via claim-file coordination | **Required** — proposes nothing without a reachable brain (no invented output) |

All LLM-backed agents use the matching `.claude/skills/divisions/<name>/SKILL.md` as system-prompt context (same convention as `scripts/lmstudio-division-improve.sh`) and validate JSON output against a zod schema before trusting it.

---

## Directory map

```text
apps/planner/
├── AGENTS.md              ← you are here
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           ← original deterministic dry-run entry (unchanged)
    ├── orchestrate.ts     ← manifest-driven orchestrator CLI (LM Studio brain, Build phase, coordination)
    ├── status.ts          ← cross-project tracker CLI
    ├── agents/
    │   ├── PlannerAgent.ts    ← decomposes spec → module layout (LLM-optional)
    │   ├── ResearchAgent.ts   ← PRD + best-practices (LLM-optional)
    │   ├── ArchitectAgent.ts  ← ADRs + MVP scope (LLM-optional)
    │   ├── ReviewAgent.ts     ← quality gate — deterministic only, DAG cycle detection
    │   └── BuilderAgent.ts    ← Phase 4 — LLM-required, claim-gated file writes
    ├── flows/
    │   └── AppFoundationFlow.ts  ← sequential orchestrator, now 5 phases (adds runBuild)
    ├── llm/
    │   ├── lmStudioClient.ts  ← OpenAI-compatible client; serial-only queue (local-mode law in code)
    │   ├── llmBrain.ts        ← division SKILL.md → prompt → JSON → zod-validated output
    │   ├── schemas.ts         ← zod schemas for each division's LLM output
    │   └── findRepoRoot.ts    ← walks up to docs/37_NIGHTRAVEN.md (Bible marker)
    ├── manifest/
    │   ├── types.ts           ← generalized Unified Manifest zod schema
    │   └── loadManifest.ts    ← YAML load + validate; app-specific fields survive in `raw`
    ├── coordination/
    │   ├── claimFile.ts       ← claim/release a path; rejects cross-stream conflicts
    │   ├── statusDoc.ts       ← renders monitor.status_doc (full-rewrite snapshot)
    │   └── ledger.ts          ← append-only Build/Audit ledger entries (matches docs/ledgers/*.md format)
    ├── tracker/
    │   ├── registry.ts        ← parses scripts/nightraven-projects.conf
    │   └── projectStatus.ts   ← per-project rollup (metadata only — Bible §2.6)
    ├── tools/
    │   ├── registry.ts           ← per-division tool belts (DIVISION_TOOLS)
    │   └── *.ts                  ← AgentTool base + bash/file/glob/grep/web tools
    ├── types/
    │   └── agent.ts           ← shared types: AppSpec, LayoutPlan, BuildOutput, FlowState
    └── utils/
        └── logger.ts          ← structured event log
```

**Naming note:** the package stays `@nightraven/planner` / `apps/planner/` — Planner was always the division this Phase 2 work completes (DIVISION_REGISTRY's own known-gaps table named "no LLM dispatch loop yet" as the thing to build). "NightRaven Orchestrator" describes what running it now does; it is not a folder rename.

---

## Laws (inherit from root + Compass additions)

- **`+#` only** on memory docs — never `-#`
- **No agent cross-talk** — each agent receives only its predecessor's output
- **Human gate after Phase 0** — Planner output must be approved (`--approve`) before Phase 1 runs
- **Human gate before writes** — Builder proposes; nothing touches disk without `--approve`, same flag
- **Serial-only LLM calls** — `LmStudioClient` queues every chat call; "no parallel under LM Studio" is enforced in code, not just documented (`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md` §4)
- **Claim before write** — Builder's file writes go through `coordination/claimFile.ts`; a path held by another stream is refused, not overwritten
- **No invented output** — without a reachable LM Studio brain, Builder reports why and proposes nothing rather than fabricating scaffold code
- **Metadata only across projects** — `status.ts` reads registered workspaces' handoff focus / ledger counts, never imports their memory content (Bible §2.6)
