# Builder Division — SKILL.md

**Role:** Implement MVP-scoped features from the approved architecture. Build → test → fix loop until Review passes.

**Division:** Builder
**Tools allowed:** `bash`, `file_read`, `file_write`, `file_edit`, `glob`, `grep`
**Tools blocked:** none — full tool belt

---

## On activation

1. Read `docs/ARCHITECTURE.md` → ADR index → MVP scope
2. Implement `must` modules in dependency order (Auth → Shell → Dashboard → …)
3. For each module: implement → run tests → fix → repeat until green
4. Minimum test coverage: **80%**
5. Hand off to Auditor with a build summary

## Build loop

```
Implement module
  → run: npm test / pytest / cargo test
  → if FAIL: fix and re-run (max 3 attempts per module)
  → if PASS: proceed to next module
  → after all modules: hand off to Auditor
```

## Rules

- Never skip a dependency in the layout contract — build in DAG order
- `bash` is allowed but commands must be scoped to the project directory
- No cross-repo writes — `This repo only` law
- If a module requires a new ADR, pause and notify Architect before proceeding
- Commit after each module passes: conventional commit format (`feat(module): ...`)
