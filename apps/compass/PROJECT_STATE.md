# Compass Project State

- Current version: v0.3 Command Center Evolution Tracker
- Current stage: Stage 6 - Integrity Audit
- Current goal: Harden Compass's evolution tracker after making mockups, unfinished components, integrity gaps, and version planning visible in the app.
- Last updated: 2026-07-02

## Completed Work

- Compass app shell, dashboard, routes, project registry, and IndexedDB overrides exist.
- Command Center monitor surfaces exist: Overview, What Changed, Files, Runs, Detach, and Settings.
- File catalog and Windows Explorer integration exist through the local Vite API.
- Agent Tokens and Agent Profiles settings exist as local IndexedDB preferences.
- App evolution tracking files were added for Compass.
- Evolution view exists and renders the final-form goal, unfinished tracker, integrity findings, next-version plan, and tracking file health from markdown evidence.

## Active Blockers

- Several production paths still use mock/fallback data when the live Vite API is unavailable.
- Some command-menu labels navigate to existing pages but do not yet execute deeper real actions.

## Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Dev server: `npm run dev -- --host 127.0.0.1`
- Rendered smoke: Playwright against `http://127.0.0.1:5173/`
- Last validation: `npm run build`, `npm run lint`, API snapshot smoke, Playwright Evolution view smoke.
- Cleanup inventory: `CLEANUP_CANDIDATES.md` lists safe local artifacts, review-first artifacts, and active source files that must not be deleted as cleanup.

## Risks

- Secrets currently stay in browser IndexedDB; acceptable for local dev, not final secure vault.
- There is no dedicated unit-test runner yet.
- The app can display generated prompts and local artifacts, but it must not imply autonomous agent execution.

## Next Action

Review `CLEANUP_CANDIDATES.md`, remove only local runtime/build artifacts after stopping running processes, then replace the direct mock progress-dimension import in `ProgressTrackerPage`.
