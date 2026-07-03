# Compass App Final Form Goal

- Current app version target: v0.3 Command Center Evolution Tracker
- Main user goal: See the exact project state, unfinished work, next action, and upgrade path without digging through raw repo files.
- Core app promise: Compass points to the next correct step using evidence from project files, local state, and explicit user action.

## Required Screens

- Overview dashboard with lifecycle, next move, blockers, decisions, and progress.
- What Changed view with file-level precision.
- Files view with friendly names, purposes, source paths, and Explorer actions.
- Runs view with build/audit/run evidence.
- Detach view with readiness gates.
- Settings view with registry, refresh, local agent tokens, and agent profiles.
- Evolution view with final-form goal, mockup tracker, integrity report, next version plan, and changelog summary.

## Required Components

- Project snapshot loader and registry selector.
- Command menu with desktop-style groups.
- Evidence-backed monitor summary.
- File catalog table.
- Prompt card with constrained artifact generation.
- Agent token/provider cards.
- Agent profile designer.
- Evolution tracker cards and unfinished-item table.

## Required User Flows

- Select a project and load live evidence.
- Inspect current lifecycle and blocking reason.
- Inspect changed files and friendly file purposes.
- Reveal project files in Windows Explorer after user click.
- Configure local provider tokens and bounded agent profiles.
- Track mockups, placeholders, unfinished components, and fake-data paths.
- Validate current version and plan the next major upgrade.

## Required Data And State Behavior

- Live data comes from the Vite API when available.
- Local edits persist in IndexedDB overrides.
- Static or failed API mode falls back to mock seed with clear data-mode labeling.
- Evolution tracker data is read from app-local markdown files.
- AI/provider settings do not write secrets to repo files.

## Required Polish Level

- No awkward filenames as primary labels where a friendly label exists.
- No inert primary buttons without visible state or explanation.
- Dense dashboard layout remains readable on desktop and mobile.
- Empty, loading, unsupported, and error states are clear.

## Required Validation Checks

- `npm run build`
- `npm run lint`
- Rendered smoke for Overview, Files, Settings, and Evolution views.
- API smoke for path safety where Explorer integration is involved.

## Definition Of Done

- Required screens exist and route correctly.
- Mockup tracker has no unhandled critical item.
- Main user flows work end to end in registry mode.
- No critical runtime, build, lint, or obvious UI-break issue remains.
- Remaining limitations are documented in the integrity report and version plan.
