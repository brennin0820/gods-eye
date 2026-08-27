# T-003: Align Compass Detach checklist truth

- Zone: Compass monitor
- Owner: codex
- Status: review
- Branch: codex/T-003

## Goal

Keep the rendered Detach checklist consistent with the monitor lifecycle when audit or run/build work is still active.

## Acceptance criteria

- [x] Pending audit evidence renders its Detach checklist row blocked.
- [x] Active run/build evidence renders its Detach checklist row blocked.
- [x] Terminal passing evidence retains the existing ready-to-detach behavior.
- [x] Compass monitor tests, build, and lint pass.

## Handoff notes

- 2026-08-27, Codex: Claimed from committed Compass baseline `a497022`; implementation and verification pending.
- 2026-08-27, Codex: The initial run-status candidate was already covered by the committed monitor parser and audit gate, so the retained slice fixes the reproduced rendered-checklist contradiction instead. Pending audits and active runs/builds now show explicit blocked rows. The canonical monitor gate passed 35 parser/API, 9 SSR, and 6 browser/CDP tests; production build, lint, and diff integrity passed. Ready for Claude review; no merge or push performed.
- 2026-08-27, Codex verification correction: after adding the scoped review's two ready-row assertions, parser/API and SSR passed again, while the unchanged Chrome scenario twice hit its bounded CDP startup timeout. An earlier exact-code full gate passed before the assertion-only test edit; build, lint, diff integrity, and cleanup remain green. Review should retain this baseline caveat.
