# Fast start — Tier 0 cold start (new / empty repo)

**Purpose:** the minimum read for an agent landing in a **new, empty, or first-message** repo. This doc routes; portable law lives in [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) — do not duplicate it here.

---

## Read (Tier 0 — nothing else)

| # | Read | Why |
|---|------|-----|
| 1 | Always-on rule (`.cursor/rules/nightraven-context-intent.mdc` or `~/.cursor` global) | Laws + intent ladder in <3KB |
| 2 | This doc | Tier 0 scope |
| 3 | [`36_PROJECT_ISOLATION.md`](36_PROJECT_ISOLATION.md) | Experience vs app memory — never import another repo's handoff |

**Skip at Tier 0:** full Bible chain, overlay, router, other repos' handoffs, subagent spawns, MEMORY CHECK for typos, loop templates. Escalate per Bible **§2.5** only when the task grows.

## First moves

1. Classify tier (Bible §2.5) — new/empty = **Tier 0 — Experience**.
2. Intent ladder default: **memory + wire** — no code until **code it** / **implement** / **build** (§2.8).
3. If Brent adds product context, bootstrap the chain: `install.sh` (memory) or `scripts/bootstrap-nightraven-project.sh <Name>` (memory + Core).
4. On exit at tier ≥1: append one `+#` line to handoff **Recent sessions**.

**Canonical law:** Bible [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) §0 · §2.5 · §5 (cold start). This doc is a Tier 0 card, not a second Bible.
