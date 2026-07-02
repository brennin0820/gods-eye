# Division Registry — NightRaven

**Canonical list of all NightRaven divisions**, their tool belts, SKILL.md locations, and TypeScript agent paths.

**Authority:** This doc is the single source of truth for division identity. Do not define divisions elsewhere without adding a row here (`+#` only).

---

## Divisions

| Division | Role | SKILL.md | Agent | Phase |
|---|---|---|---|---|
| **Planner** | Decompose spec → module layout + dependency DAG | `.claude/skills/divisions/planner/SKILL.md` | `apps/planner/src/agents/PlannerAgent.ts` | 0 |
| **Researcher** | PRD + best practices + risks | `.claude/skills/divisions/researcher/SKILL.md` | `apps/planner/src/agents/ResearchAgent.ts` | 1 |
| **Architect** | ADRs + MoSCoW MVP scope + roadmap | `.claude/skills/divisions/architect/SKILL.md` | `apps/planner/src/agents/ArchitectAgent.ts` | 2 |
| **Builder** | Implement features, run tests, fix loop | `.claude/skills/divisions/builder/SKILL.md` | *(Phase 2 — not yet implemented)* | 3 |
| **Auditor** | Risk-score artifacts, quality gate | `.claude/skills/divisions/auditor/SKILL.md` | `apps/planner/src/agents/ReviewAgent.ts` | 3 |
| **Greenfield** | Meta-skill: Planner + Researcher + Architect in parallel | `.claude/skills/divisions/greenfield/SKILL.md` | `apps/planner/src/flows/AppFoundationFlow.ts` | 0–2 |

---

## Tool belt per division

| Tool | Planner | Researcher | Architect | Builder | Auditor |
|---|---|---|---|---|---|
| `bash` | | | | ✅ | |
| `file_read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `file_write` | ✅ | | ✅ | ✅ | |
| `file_edit` | | | | ✅ | |
| `glob` | | ✅ | ✅ | ✅ | ✅ |
| `grep` | | | ✅ | ✅ | ✅ |
| `web_fetch` | | ✅ | | | |
| `web_search` | ✅ | ✅ | | | |

**Rule:** Auditor never gets `bash` or `file_write`. Builder gets the full belt. No division may call a tool outside its column without explicit Brent approval (Governed Bypass).

---

## Pipeline flow

```
AppFoundationFlow
  Phase 0 → Planner     (layout decomposition + dependency DAG)
               ↓ human approval gate
  Phase 1 → Researcher  (PRD + best practices)
  Phase 2 → Architect   (ADRs + MVP scope)
  Phase 3 → Auditor     (quality gate: DAG validation, ADR check, coverage)
               ↓ PASS
  Phase 4 → Builder     (implementation — Phase 2, not yet wired)
```

**Greenfield skill** triggers Phases 0–2 in parallel then synthesizes → `PLAN.md` → human gate → Builder.

---

## Known gaps (as of 2026-06-13)

| Gap | Status |
|---|---|
| Builder TypeScript agent | Not implemented — SKILL.md only |
| Tool belt is dormant | Tools declared, no LLM dispatch loop yet (Phase 2) |
| DAG cycle detection | `ReviewAgent` validates unknown module refs but not actual cycles |
| `GrepTool` `glob` param | Accepted in schema, silently ignored in `_run` |
| Coverage gate | `ReviewAgent.ts:43` logic inverted — always fires warning |
| No test runner | `apps/planner` has no vitest/jest config |

### Gap status update (2026-07-02) — repair batch

| Gap | Status |
|---|---|
| DAG cycle detection | **Fixed** — `ReviewAgent` DFS detects cycles, error finding per cycle (tested) |
| `GrepTool` `glob` param | **Fixed** — glob honored; basename match without `/`, path match with (tested) |
| Coverage gate | **Fixed** — defined MVP scope now counts as covered (`100`); warning fires only when scope is empty |
| No test runner | **Fixed** — vitest wired (`npm test`); `ReviewAgent` + `GrepTool` suites, 7 tests |
| `run:flow` script | **Fixed** — pointed at `src/index.ts --approve` (old path had a filename-case break and no runner) |
| Builder TypeScript agent · LLM dispatch loop | **Still open** — Phase 2; not part of the repair batch |

---

## Cross-links

- Tool registry: `apps/planner/src/tools/registry.ts`
- Flow orchestrator: `apps/planner/src/flows/AppFoundationFlow.ts`
- NightRaven product map: `docs/NIGHTRAVEN_UNIFIED_PRODUCT.md`
- System skills (non-division): `.claude/skills/` root — `audit`, `bank-*`, `hunt`, `nightraven`
- Bible: `docs/37_NIGHTRAVEN.md` §9 — virtual teams reference

---

## LM Studio division improvement (local)

**Script:** [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh) — serial OpenAI-compatible calls to LM Studio; one division at a time; writes `docs/lmstudio-reviews/*.md`.

| Division key | SKILL source | Local caveat |
|---|---|---|
| planner · researcher · architect · builder · auditor · greenfield | `.claude/skills/divisions/*/SKILL.md` | Researcher: offline rubric only (no web) |
| planning · research · design | `.claude/skills/nightraven/SKILL.md` (section focus) | Research runtime: defer `/hunt` to cloud |

**Doc:** [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §6 — order, models, after-loop law.

**+# Brent remote roster (`DESKTOP-7FT26ER`, 2026-06-13):** GPT-OSS 20B → planner/architect/greenfield/planning/builder · DeepSeek R1 0528 Qwen3 8B → auditor/researcher/research · Gemma 4 E4B → design · **Nomic Embed Text v1.5 — skip** (not chat). See local doc §6 roster table + **Step-by-step runbook** (review-only — not auto-patch).
