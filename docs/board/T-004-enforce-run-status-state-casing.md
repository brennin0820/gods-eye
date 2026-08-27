# T-004: Enforce canonical run-status state casing

- Zone: Compass monitor
- Owner: codex
- Status: review
- Branch: codex/T-004

## Goal

Make authoritative run-status evidence fail closed when a stream state does not use the canonical lowercase token.

## Acceptance criteria

- [x] Only lowercase `pending`, `running`, `passed`, and `failed` state tokens are accepted.
- [x] Mixed-case and uppercase state tokens produce invalid run-status evidence and block detach.
- [x] Valid compact and space-padded run tables retain their existing behavior.
- [x] Relevant Compass monitor tests, build, and lint pass; the unchanged browser baseline is recorded.

## Handoff notes

- 2026-08-27, Codex: Claimed from committed Compass baseline `ef9b97c`; implementation and verification pending.
- 2026-08-27, Codex: Removed case-folding from authoritative run-state validation, so only the canonical lowercase four-state vocabulary is accepted while cell-padding remains valid. Added uppercase and mixed-case regressions across both supported schemas. The focused regression failed before the fix and passed after it; parser/API passed 35 tests, SSR passed 9 tests, production build and lint passed, diff integrity passed, and scoped fix-back review found no Critical/High/Medium issues. The unchanged browser scenario reproduced T-003's documented bounded five-second CDP startup timeout twice after its five focused harness tests passed. Ready for Claude review; no merge to `main` performed.
