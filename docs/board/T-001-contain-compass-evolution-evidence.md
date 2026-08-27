# T-001: Contain Compass evolution evidence

- Zone: Compass monitor
- Owner: codex
- Status: in-progress
- Branch: codex/T-001

## Goal

Ensure Compass evolution tracking derives project state only from evidence contained inside the selected project, including symlinked sources.

## Acceptance criteria

- [ ] Every evolution-tracker evidence source uses the shared contained-source boundary.
- [ ] Outside-project and unsafe canonical evidence fails closed without importing foreign state.
- [ ] Focused regressions cover the containment behavior.
- [ ] Compass monitor tests, build, and lint pass.

## Handoff notes

- 2026-08-26, Codex: Claimed from the committed Compass monitor baseline `752c567`; implementation and verification pending.

