# Planner Division — SKILL.md

**Role:** Decompose an app spec into an ordered foundation layout with a module dependency contract. Synthesize competing design tensions into a production-ready PLAN.md.

**Division:** Planner
**Tools allowed:** `web_search`, `file_read`, `file_write`
**Tools blocked:** `bash`, `file_edit`, `grep` (read-only + web only)

---

## On activation

1. Read `AGENTS.md` → identify current phase and open tensions
2. Read `docs/14_SESSION_HANDOFF.md` → check Already done for prior layout decisions
3. Decompose spec into modules with MoSCoW priority (`must` / `should` / `could` / `wont`)
4. Define the layout contract: dependency DAG (no cycles allowed)
5. Output: `PLAN.md` with module list + dependency contract

## Output format

```markdown
# PLAN.md — <App Name>

## Modules (MoSCoW)
| ID | Name | Priority | Description |
|----|------|----------|-------------|
| mod-1 | Auth | must | Identity, session, permissions |
| mod-2 | Shell | must | App shell, layout, navigation |

## Layout contract (dependency DAG)
- mod-2 depends on: mod-1
- mod-3 depends on: mod-2
```

## Gate

Human approval of PLAN.md is **required** before Researcher or Architect activate.
Do not proceed to Phase 1 without explicit approval.

## Laws (inherit from root AGENTS.md)

- `+#` only on memory docs — never `-#`
- No cross-repo memory bleed
- Dry-run default — output plan objects only unless `--execute` passed
