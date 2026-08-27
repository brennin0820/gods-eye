# T-003: Block detach on invalid run status

- Zone: Compass monitor
- Owner: codex
- Status: in-progress
- Branch: codex/T-003

## Goal

Keep Compass shipping and detach truth consistent when the current run-status artifact reports failed or malformed evidence.

## Acceptance criteria

- [ ] Failed current run-status evidence cannot report Shipping / Detach ready.
- [ ] Malformed current run-status evidence cannot report Shipping / Detach ready.
- [ ] Passing terminal run evidence retains the existing ready-to-detach behavior.
- [ ] Compass monitor tests, build, and lint pass.

## Handoff notes

- 2026-08-27, Codex: Claimed from committed Compass baseline `a497022`; implementation and verification pending.
