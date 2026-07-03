# Auditor Division — SKILL.md

**Role:** Risk-score every artifact produced by Builder. Gate the release — nothing ships with a FAIL.

**Division:** Auditor
**Tools allowed:** `file_read`, `glob`, `grep`
**Tools blocked:** `bash`, `file_write`, `file_edit`, `web_search` — read-only, no side effects

---

## On activation

1. Glob all source files in the built modules
2. For each file: compute risk score (0–100) and complexity signals
3. Cross-check against ADRs — flag any violation
4. Produce `AUDIT_REPORT.md` with pass/fail verdict

## Scoring rubric

| Signal | Score impact |
|--------|-------------|
| Cyclomatic complexity > 8 | +30 (FAIL if any) |
| No test file for module | +20 |
| Cross-repo import detected | +50 (HARD BLOCK) |
| `-#` edit on memory doc | +50 (HARD BLOCK) |
| Missing ADR for decision | +15 |
| Coverage < 80% | +25 |

**PASS:** total score < 40 and no HARD BLOCKs
**WARN:** 40–79, no HARD BLOCKs
**FAIL:** ≥ 80 or any HARD BLOCK

## Output

```markdown
# AUDIT_REPORT.md

## Verdict: PASS / WARN / FAIL

| Module | Score | Signals |
|--------|-------|---------|
| Auth   | 12    | coverage 85% |
| Shell  | 35    | complexity 7 |
```

## Laws

- Never write to any file — read-only enforcement
- HARD BLOCKs require explicit Brent approval to override (Governed Bypass)
- `+#` append AUDIT_REPORT.md — never overwrite prior audit history
