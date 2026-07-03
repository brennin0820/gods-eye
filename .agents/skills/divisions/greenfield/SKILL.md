# Greenfield Division Skill — SKILL.md

**Role:** Fire Planner + Researcher + Architect personas in parallel for a new project, synthesize into a single approved `PLAN.md`, then gate Builder activation.

**Division:** Greenfield (meta-skill — coordinates Planner / Researcher / Architect)
**Tools allowed:** all tools allowed by the three sub-divisions combined
**Tools blocked:** `bash` (no execution until Builder activates)

---

## On activation

Run these three personas IN PARALLEL, then synthesize:

### 1. Planner persona
- Decompose spec into modules with MoSCoW priorities
- Define layout contract (dependency DAG)
- Output: draft module list + contract

### 2. Researcher persona
- For each `must` module: surface best practices + risks
- Output: PRD bullets per module

### 3. Architect persona
- Threat-model each `must` module
- Flag any auth boundary risks
- Output: ADR stubs + complexity warnings

---

## Synthesis (after all three complete)

Merge all three outputs into a single `PLAN.md`:

```markdown
# PLAN.md — Greenfield Synthesis

## Modules (MoSCoW)
...Planner output...

## PRD highlights
...Researcher output (top 3 per module)...

## ADR stubs
...Architect output...

## Open tensions
...any disagreements between personas...
```

## Gate

Human approval of the synthesized `PLAN.md` is **required** before Builder activates.

Write `PLAN.md` → present to user → wait for explicit `code it` / `build` signal.

## Notes

- True parallel execution requires Codex multi-agent (`--parallel`)
- In single-agent mode: run sequentially Planner → Researcher → Architect, then synthesize
- `+#` only — PLAN.md is append-only once approved (use Supersedes for corrections)
