> **Example companion doc (illustrative only)**  
> Worked examples for mapping a user's **"add context"** intent to durable docs. Pair with an overlay like [NIGHTRAVEN_REPO_OVERLAY.example.md](../overlay/NIGHTRAVEN_REPO_OVERLAY.example.md).

# User Context Protocol — NightRaven (OneDayMillionaire)

Worked examples and checklist for Brent's **"add context"** intent. **Authority:** **NightRaven Bible** (`docs/37_NIGHTRAVEN.md` (NightRaven Bible)) + `docs/NIGHTRAVEN_REPO_OVERLAY.md` (your local overlay) — this file does not restate portable laws.

## Agent card

**Canonical table:** `docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md` § Agent card (Before / During / After / Never). Master detail: doc 37 **§0 Agent quick start**. Do not duplicate rows here.

**Quick refs:** Oversight = **NightRaven** (repo) · **BigBrother** (master). Posture = **Tier C** default. Ladder = Memory → wire → UI/copy → code. Laws = `nightraven-context-intent.mdc` + doc 37 §2.

## What Brent means by "context"

**Canonical disambiguation:** overlay §1 + §10. Summary:

| Term | Meaning |
|------|---------|
| **Brent's context** | Product memory for agents — vocabulary, positioning, boundaries |
| **Code `*Context`** | Swift structs (`BudgetContext`, `SavingContext`, …) — computed ledger state in ViewModels, not SwiftUI `@Environment` |

When Brent says "add context," assume **Brent's context** unless he points at a specific `.swift` file or calculator.

## Intent ladder

**Canonical:** doc 37 §3. Default stops at memory unless Brent clearly asks for lower layers.

```
Memory + wire  →  UI/copy  →  Code/feature
```

## Vocabulary layers

**Canonical table:** overlay §2 — extend there; do not duplicate rows here.

## Worked examples (this repo)

### "add context Gambling Tracker"

- **Intent:** Product **category** label for agents.
- **Done:** Vocabulary row + AGENTS/handoff text; not a new Swift type; not onboarding rename unless asked later.

### "make context connected"

- **Intent:** Wire layer — same fact reachable from rule, AGENTS, handoff, README with explicit read order.
- **Done:** Cross-links and `alwaysApply` rule; not database or API work.

### "make bigbrother understand me when im adding context"

- **Intent:** Meta — durable protocol so future agents read Brent deeply (maps to **NightRaven**; this document + `nightraven-context-intent.mdc`).
- **Done:** Learning log + handoff pointer; not a code change.

### "bigbrother dont unlearn things. he always learn"

- **Intent:** Memory retention law — append-only docs; compound knowledge every session (NightRaven).
- **Done:** Always-learn section in rules + protocol; **Recent sessions** (append) replaces single-line **Last session**; restore prior session lines when updating.

### "bigbrother doesnt allow -# edits"

- **Intent:** Memory doc edits are **`+#` append only** — never remove `#` heading blocks or delete bullets/entries from learning log, changelog, **Already done**, or rules.
- **Done:** No `-#` law in rules + protocol; corrections via **Supersedes** append, not section deletion.

### "bigbrother always watches"

- **Intent:** Oversight is **always on** — read memory every session; watch work during edits; append outcomes after meaningful tasks (NightRaven).
- **Done:** Always-watches section in rules + protocol; not a feature build.

### "change its name to NightRaven" (was BigBrother)

- **Intent:** Rename **local repo oversight** to NightRaven; keep master BAIC **BigBrother** nickname; map Brent's "bigbrother …" phrases to same NightRaven intent.
- **Done:** `nightraven-context-intent.mdc`; active doc cross-links updated; learning log/changelog append; historical entries that quote "bigbrother" kept.

### "make NightRaven independent for general use"

- **Intent:** Split portable NightRaven (master, any repo) from OneDayMillionaire local overlay.
- **Done:** Master `docs/37_NIGHTRAVEN.md`; repo `docs/NIGHTRAVEN_REPO_OVERLAY.md` (your local overlay); `docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md` → router; slim rule; wired chain (`+#` only).

### "make NightRaven into Grand Spec"

- **Intent:** Create canonical **Grand Spec** — single authoritative doc consolidating NightRaven concept, laws, and connected chain; rules stay lean summary.
- **Done:** `docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md`; wired chain (rule, gambling-tracker, AGENTS, handoff, protocol, README); append changelog/learning log/handoff (`+#` only).

### "make it easier for agent for god's eye"

- **Intent:** Agent ergonomics — grok and follow NightRaven faster with less doc-hopping.
- **Done:** Master doc 37 §0 **Agent quick start**; rule **START HERE** block; router canonical Agent card; overlay §10 agent pitfalls; protocol deduped to pointers (`+#` only).

### "apply NightRaven on this project"

- **Intent:** Wire layer + compliance — bring repo into full NightRaven oversight (always watches, `+#` only, Tier C default, no template spam); audit chain; fix stale/missing pointers; do **not** imply app feature work.
- **Done:** Verify rule → Bible → overlay → router → protocol → handoff → AGENTS → README → loop pointer; `+#` gaps only; append changelog + learning log + handoff **Recent sessions**; zero new template files.

### "add context money management" (domain memory)

- **Intent:** Product **domain** — how balance, calendar ledger, spending, income, saving, budgets, limits, and projections fit together for a money-management beginner; map concepts to shipped vs gaps.
- **Done:** Extend or create **one** canonical doc (`docs/MONEY_MANAGEMENT_CONTEXT.md`); wire chain pointers (overlay §7, router session start, `gambling-tracker.mdc`, AGENTS, handoff); handoff keeps calculator thresholds — link, don't duplicate; append changelog + learning log + **Recent sessions**; not Swift `*Context` types unless Brent names code.

## After Brent adds context — checklist

- [ ] Classified layer (category / brand / repo / code / UI / feature)
- [ ] Updated connected chain (no orphan paragraphs)
- [ ] Changelog entry in `docs/02_ENGINEERING_CHANGELOG.md` (append)
- [ ] Learning note in `docs/04_LEARNING_LOG.md` (append — keep all prior entries)
- [ ] Handoff **Recent sessions** one-liner appended (prior session lines kept)
- [ ] No `-#` edits on memory docs — only `+#` adds
- [ ] Did **not** build code unless ladder step 3–4 applied

## Product boundary (non-negotiable)

**Canonical:** overlay §3 + §10 + `gambling-tracker.mdc`. Tracking and awareness only — no odds, casino mechanics, or loss-chasing (`PLAN.md`).

## Anti-patterns (forbidden default)

**Canonical:** doc 37 §6 + `nightraven-context-intent.mdc`. Summary:

| Anti-pattern | Why |
|--------------|-----|
| **Creating template docs** | Loop = one real `+#` in **existing** chain — §9 hard law; never expand `docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md` |
| **Serial doc-hopping** | Parallel-read disjoint paths; one canonical table per concept (router/overlay point) |
| **Duplicating Agent card rows** | Single canonical table in router § Agent card |
