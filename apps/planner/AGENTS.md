# AGENTS.md — NightRaven Planner (coding agent entry)

**Read root [`AGENTS.md`](../../AGENTS.md) first** for NightRaven framework law.

---

## What Planner is

**NightRaven Planner** is the multi-agent orchestration layer that decomposes an app spec into a foundation layout and hands it off to specialist agents. It sits between NightRaven memory (framework) and Compass (guidance UI).

**Motto chain position:** NightRaven thinks · **NightRaven Planner plans** · NightRaven builds · Auditor verifies · Compass points.

---

## Agent roles (4-phase pipeline)

| Agent | Phase | Input | Output |
|-------|-------|-------|--------|
| `PlannerAgent` | 0 — Layout | App spec / intent | Module layout + role assignments |
| `ResearchAgent` | 1 — Research | Module layout | PRD + best-practices analysis |
| `ArchitectAgent` | 2 — Architecture | PRD | ADRs + MoSCoW-scoped MVP |
| `ReviewAgent` | 3 — Review | Built artifacts | Quality report + pass/fail gate |

---

## Directory map

```text
apps/planner/
├── AGENTS.md              ← you are here
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           ← entry point + CLI runner
    ├── agents/
    │   ├── PlannerAgent.ts    ← decomposes spec → module layout
    │   ├── ResearchAgent.ts   ← PRD + best-practices
    │   ├── ArchitectAgent.ts  ← ADRs + MVP scope
    │   └── ReviewAgent.ts     ← quality gate
    ├── flows/
    │   └── AppFoundationFlow.ts  ← sequential orchestrator
    ├── tools/
    │   ├── registry.ts           ← per-division tool belts (DIVISION_TOOLS)
    │   └── *.ts                  ← AgentTool base + bash/file/glob/grep/web tools
    ├── types/
    │   └── agent.ts           ← shared types: AgentInput, AgentOutput, FlowState
    └── utils/
        └── logger.ts          ← structured event log
```

---

## Laws (inherit from root + Compass additions)

- **`+#` only** on memory docs — never `-#`
- **No agent cross-talk** — each agent receives only its predecessor's output
- **Human gate after Phase 0** — Planner output must be approved before Phase 1 runs
- **Dry-run default** — agents emit plan objects; actual file writes require explicit `--execute` flag
