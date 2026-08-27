# T-001: Contain Compass evolution evidence

- Zone: Compass monitor
- Owner: codex
- Status: review
- Branch: codex/T-001

## Goal

Ensure Compass evolution tracking derives project state only from evidence contained inside the selected project, including symlinked sources.

## Acceptance criteria

- [x] Every evolution-tracker evidence source uses the shared contained-source boundary.
- [x] Outside-project and unsafe canonical evidence fails closed without importing foreign state.
- [x] Focused regressions cover the containment behavior.
- [x] Compass monitor tests, build, and lint pass.

## Handoff notes

- 2026-08-26, Codex: Claimed from the committed Compass monitor baseline `752c567`; implementation and verification pending.
- 2026-08-26, Codex: Implemented canonical-first contained evolution evidence with no cwd fallback; added API/direct matrix regressions; 35 parser/API, 7 SSR, and 6 browser tests plus build/lint passed; final scoped audit PASS 100/100. Ready for Claude review; branch is not merged or pushed.
