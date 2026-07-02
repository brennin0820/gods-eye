# NightRaven Improvement Loop — Cycle Prompt

**Purpose:** One cycle incrementally improves NightRaven (portable + wired repos) as if **six specialist teams** reviewed the framework in parallel — Brent stays one person; the loop compounds memory without manual role-switching.

**Authority:** Master `docs/37_NIGHTRAVEN.md` §9 (virtual teams + loop law), §10 (Tier C — Creator-Innovator). Repo overlays extend locally only.

**Laws (non-negotiable):** Always watches · Always learn · **`+#` only** · Never `-#` · Supersedes for corrections · One small improvement per cycle · **Always sync** (pull before; push after).

**Execution mode:** If running under LM Studio (local), run six audits **serially** — no parallel subagents. If running under a cloud frontier model (Anthropic, Google, OpenAI), parallel subagents and full six-team lens are allowed. See [`NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md`](NIGHTRAVEN_LOCAL_VS_CLOUD_EXECUTION.md) §4.

**Default posture:** **Tier C — Creator-Innovator leads** (doc 37 §10). Tier C **opens** each cycle and **leads synthesis**; Architecture, Engineering, Design/UX, QA, and Product are **supporting** passes. Product/QA still **win** on boundary and anti-pattern conflicts — Tier C revises the proposal, not the law.

### Sixty-second cycle

| Step | Action |
|------|--------|
| 1 | **Tier C opens** — craft bar + human-world gate |
| 2 | **Five support audits** — Architecture → Engineering → Design/UX → QA → Product |
| 3 | **Tier C synthesizes** — pick **one** `+#` improvement |
| 4 | **Wire + log** — cross-links; append changelog / learning log / handoff |
| 5 | **Report** — one short paragraph; defer the rest |

---

## How Brent starts this loop

Pick a cadence and paste into Cursor chat (Agents window):

```text
/loop 1d Run one NightRaven improvement cycle. Read and follow exactly: docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md (this repo)
```

| Cadence | Command prefix | When to use |
|---------|----------------|-------------|
| Daily | `/loop 1d` | Steady compounding (recommended) |
| Weekly | `/loop 7d` | Light touch on stable repos |
| Self-paced | `/loop` (no interval) | Agent picks next delay after each cycle |
| Once | Omit `/loop`; run prompt body only | Single audit pass |

**Stop:** Ask the agent to stop the loop; it kills the background sleeper/ticker.

**Your repo:** append your repo changelog / learning log / handoff when the cycle touches local overlay or chain. See `examples/overlay/` for a sample overlay.

---

## Cycle 0 — Read before acting

Read in order (skip missing files; note gaps as improvement candidates):

1. Master `docs/37_NIGHTRAVEN.md` (§2.6 isolation + §5 cold start if auditing fast-load chain)
2. Master `docs/35_FAST_START.md` + `docs/36_PROJECT_ISOLATION.md` (when cycle touches Tier 0 / new-project path)
3. Master `docs/32_BIGBROTHER_OVERSIGHT.md` (relationship only)
4. `docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md` (this file)
5. Active repo overlay if improving a bootstrapped repo (e.g. `docs/NIGHTRAVEN_REPO_OVERLAY.md`)
6. Active repo router / always-on rule (e.g. `nightraven-context-intent.mdc`)
7. Latest entries in master + repo `docs/02_ENGINEERING_CHANGELOG.md`, `docs/04_LEARNING_LOG.md`, handoff **Recent sessions**

Do **not** run `xcodebuild` or app builds unless Brent explicitly asked in this session.

---

## Virtual expert teams (one agent, six perspectives)

**Default innovator ordering:**

1. **Tier C opens** — state craft bar + human-world gate for this cycle (doc 37 §10).
2. **Five support teams audit** — Architecture → Engineering → Design/UX → QA → Product (sections 1–5 below).
3. **Tier C leads synthesis** — merge support findings; pick **one** elegant, human-meaningful `+#` step (section 6 bookend).

**Why six, not five:** Tier C — Creator-Innovator is a **separate pass**, not merged into Design/UX — and **default posture**, not an optional add-on. Design/UX asks *can agents read this?* Engineering asks *is it deduped and `+#` compliant?* **Tier C** asks *is this creation coherent, elegant, and human-meaningful?* — craft and the human-world gate (doc 37 §10). Merging would blur readability with creative standard.

Run **all six audits in this single cycle** — Tier C bookends; five support sections in between; not separate subagents. Tier C synthesizes into **one** prioritized improvement.

### 1. Architecture team — structure & connected chain

- Is portable vs overlay vs router authority clear and linked?
- Does the connected chain have orphan paragraphs or broken pointers?
- Are tier-0 lean repos pointed at master without duplicating doc 37?
- **Improve if:** missing cross-link, wrong read order, duplicated portable law in overlay.

### 2. Engineering team — clarity, dedup, `+#` compliance

- Are vocabulary tables deduped (one row per concept)?
- Do rules stay lean while depth lives in spec/overlay?
- Any `-#` risk in recent edits (trimmed **Already done**, collapsed **Recent sessions**)?
- **Improve if:** duplication across 3+ files, ambiguous disambiguation, missing **Supersedes** pattern.

### 3. Design / UX team — agent readability

- Can a cold agent find laws + ladder in one read path?
- Are tables, mottos, and phase checklists scannable?
- Is telegraphic Brent intent documented with examples?
- **Improve if:** wall of prose, missing worked example, weak section headers.

### 4. QA / Oversight team — anti-patterns & regression

- Re-read doc 37 §6 anti-patterns — any present in active docs?
- Is "always watches" still reflected in always-on rules?
- **Cross-repo isolation (doc 37 §2.6, doc 36):** Do chain docs import another app's handoff, paths, or locks?
- Are protected paths listed and current?
- **Improve if:** anti-pattern observed, oversight optionalized, memory doc unprotected.

### 5. Product / context team — intent ladder & vocabulary

- Intent ladder (memory → wire → UI → code) still the default?
- Vocabulary layers documented and non-collapsing?
- Repo overlay boundary (e.g. tracking-only) preserved where applicable?
- **Improve if:** ladder drift, layer collapse, boundary not wired in chain.

### 6. Tier C — Creator-Innovator (doc 37 §10)

- Does the chain feel **crafted** — intentional names, coherent patterns, no ceremonial bloat?
- **Human-world gate:** Would a person understand why this exists? Real use, dignity, clarity — not AI-only abstractions?
- Is the proposed improvement **elegant** (one sharp step) vs scope creep or slop?
- **Improve if:** filler prose, nonsense abstractions, innovations that fail human-world gate, missed chance to elevate craft.
- **Defer to Product/QA if:** elegance conflicts with boundary or anti-pattern — revise proposal, not law.

---

## Cycle protocol — pick ONE improvement

1. **Open (Tier C)** — frame human-world gate and craft bar for this cycle.
2. **Audit** five support teams (Architecture → Engineering → Design/UX → QA → Product).
3. **Bookend (Tier C)** — run §6 audit; synthesize support findings.
4. **List** up to 6 candidate micro-improvements (one line each); Tier C leads prioritization.
5. **Select exactly one** — smallest durable step with highest leverage and human-meaningful craft. Defer rest to a future cycle (optional: append "Deferred" bullets to master learning log `+#` only).
6. **Implement** with `+#` only on memory docs. Portable change → master. Repo-specific → that repo's overlay/chain.
7. **Wire** cross-links: doc 37 ↔ overlay ↔ router ↔ rule ↔ AGENTS/handoff as applicable.
8. **Log** (append only):
   - Master `docs/02_ENGINEERING_CHANGELOG.md` when master files change
   - Master `docs/04_LEARNING_LOG.md` when a new pattern or loop lesson appears
   - Repo `docs/02_ENGINEERING_CHANGELOG.md`, `docs/04_LEARNING_LOG.md`, handoff **Recent sessions** when repo chain touched
9. **Report** one short paragraph: Tier C synthesis + support team that supplied the winning constraint, file(s) touched, next deferred candidate.

### No-op cycle

If all six audits find nothing worth changing:

- Append one line to master learning log: `NightRaven loop no-op YYYY-MM-DD — chain healthy; deferred: …`
- Do not edit files for theater.
- Still report briefly.

### Forbidden

- `-#` edits on NightRaven memory docs
- Large rewrites or multi-file refactors in one cycle
- Renaming code enums for marketing
- Bootstrapping full 30+ master docs into lean repos
- Building app features unless Brent explicitly triggered code layer this session

---

## Copy-paste body (for `/loop` or one-shot)

```text
Run one NightRaven improvement cycle.

Read and follow: docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md (this repo)

Execute Cycle 0 read list. Default innovator ordering: Tier C opens → five support team audits → Tier C leads synthesis (doc 37 §10). Pick ONE +# improvement; wire cross-links; append changelog/learning log/handoff as applicable; report briefly. Laws: +# only, never unlearn, always watches. Product/QA win on boundary conflicts.
```

---

*Template established 2026-06-09. Tier C added 2026-06-09. Default innovator ordering added 2026-06-09. NightRaven always watches.*
