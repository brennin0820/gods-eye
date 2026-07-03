# Mockup Component Tracker

- Current version: v0.3 Command Center Evolution Tracker
- Last updated: 2026-07-02
- Open critical items: 0
- Open high-priority items: 4

## Item: Evolution Tracker Surface

- File path: src/components/evolution/EvolutionPage.tsx
- Current status: Complete
- Type: production-ready
- What is missing: Nothing critical for v0.3; future versions can add filtering and edit actions.
- What it must become in final form: A first-class Compass view that makes the app evolution loop visible and actionable.
- Priority: P0
- Dependencies: ProjectSnapshot evolution data; route registration; navigation item.
- Completion checklist:
  - [x] Evolution route exists.
  - [x] Tracking files are parsed into the snapshot.
  - [x] Open mockup/unfinished items are visible.
  - [x] Build, lint, and rendered smoke pass.

## Item: Mock/Fallback Data Path

- File path: src/data/mockSnapshot.ts
- Current status: Open
- Type: fake data
- What is missing: Mock data is still necessary for fallback/static mode, but production users need clearer separation from live registry evidence.
- What it must become in final form: Mock data remains only as a labeled fallback/demo path; registry mode should be the primary evidence path.
- Priority: P1
- Dependencies: Vite API availability; snapshot error states.
- Completion checklist:
  - [ ] Mock mode is clearly labeled everywhere.
  - [ ] Registry mode explains live source evidence.
  - [ ] No production claim depends on mock-only values.

## Item: Progress Tracker Dimension Source

- File path: src/components/progress/ProgressTrackerPage.tsx
- Current status: Open
- Type: fake data
- What is missing: The page imports mock dimension descriptions while values come from live snapshot progress.
- What it must become in final form: Dimension definitions should live in a shared production utility or snapshot metadata.
- Priority: P1
- Dependencies: Progress data model update.
- Completion checklist:
  - [ ] Remove direct mock import from the page.
  - [ ] Keep honest labels tied to production progress dimensions.
  - [ ] Build and lint pass.

## Item: Command Menu Deep Actions

- File path: src/components/layout/CommandMenuBar.tsx
- Current status: Open
- Type: placeholder
- What is missing: Some menu labels navigate to pages but do not execute deeper item-level actions, such as marking a specific audit item reviewed.
- What it must become in final form: Menu commands either perform a precise action or use labels that honestly describe navigation.
- Priority: P1
- Dependencies: Selected item/action model.
- Completion checklist:
  - [ ] Rename navigation-only commands or add real action handlers.
  - [ ] Disabled/unsupported states are explicit.
  - [ ] Rendered menu smoke passes.

## Item: Secure Token Vault

- File path: src/components/settings/SettingsPage.tsx
- Current status: Open
- Type: unfinished
- What is missing: Tokens are local IndexedDB settings, not OS credential-manager backed secrets.
- What it must become in final form: Local secure vault abstraction, preferably Windows Credential Manager for Windows v1, with browser storage only as a dev fallback.
- Priority: P2
- Dependencies: Local desktop or secure API boundary decision.
- Completion checklist:
  - [ ] Decide secure local secret storage boundary.
  - [ ] Keep repo free of secrets.
  - [ ] Add explicit migration/clear behavior.

## Item: Test Harness

- File path: package.json
- Current status: Open
- Type: unfinished
- What is missing: There is no unit or component test runner configured for behavior-level tests.
- What it must become in final form: Focused tests cover file alias resolution, monitor priority, evolution tracker parsing, and key UI state.
- Priority: P2
- Dependencies: Test framework decision.
- Completion checklist:
  - [ ] Add a lightweight test runner.
  - [ ] Add parser and monitor unit tests.
  - [ ] Keep build/lint validation green.
