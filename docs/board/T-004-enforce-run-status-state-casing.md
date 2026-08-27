# T-004: Enforce canonical run-status state casing

- Zone: Compass monitor
- Owner: codex
- Status: in-progress
- Branch: codex/T-004

## Goal

Make authoritative run-status evidence fail closed when a stream state does not use the canonical lowercase token.

## Acceptance criteria

- [ ] Only lowercase `pending`, `running`, `passed`, and `failed` state tokens are accepted.
- [ ] Mixed-case and uppercase state tokens produce invalid run-status evidence and block detach.
- [ ] Valid compact and space-padded run tables retain their existing behavior.
- [ ] Compass monitor tests, build, and lint pass.

## Handoff notes

- 2026-08-27, Codex: Claimed from committed Compass baseline `ef9b97c`; implementation and verification pending.
