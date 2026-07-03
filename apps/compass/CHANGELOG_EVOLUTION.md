# Compass Evolution Changelog

## 2026-07-02 - v0.3 - Evolution tracker setup

- Files changed: `apps/compass/AGENTS.md`, `apps/compass/PROJECT_STATE.md`, `apps/compass/APP_FINAL_FORM_GOAL.md`, `apps/compass/MOCKUP_COMPONENT_TRACKER.md`, `apps/compass/APP_INTEGRITY_REPORT.md`, `apps/compass/VERSION_EVOLUTION_PLAN.md`, `apps/compass/CHANGELOG_EVOLUTION.md`, `apps/compass/server/evolutionTracker.ts`, `apps/compass/server/buildSnapshot.ts`, `apps/compass/server/projectMonitor.ts`, `apps/compass/src/types/snapshot.ts`, `apps/compass/src/components/evolution/EvolutionPage.tsx`, `apps/compass/src/components/layout/navigation.ts`, `apps/compass/src/app/routeRegistry.tsx`, `apps/compass/src/components/layout/CommandMenuBar.tsx`, `apps/compass/src/index.css`, `apps/compass/src/data/mockSnapshot.ts`
- What changed: Added the app evolution loop instructions, tracking artifacts, parsed `evolution` snapshot data, Evolution navigation route, and UI for final-form goals, mockup/unfinished items, integrity findings, next-version plan, and tracking file health.
- Why it improved the app: Compass now exposes unfinished work and version evolution in the product itself instead of relying on conversation memory or raw markdown.
- Validation performed: `npm run build`; `npm run lint`; API smoke confirmed evolution version, 6 tracker items, 6 tracking files, and file-catalog source path; Playwright rendered Evolution view with 0 console errors.
- Remaining risk: Progress dimension wording still imports mock definitions; command menu has some navigation-only actions; secure token vault and unit test harness remain future work.

## 2026-07-02 - v0.3 - Cleanup inventory

- Files changed: `apps/compass/CLEANUP_CANDIDATES.md`, `apps/compass/PROJECT_STATE.md`, `apps/compass/CHANGELOG_EVOLUTION.md`
- What changed: Compiled cleanup candidates into safe-to-remove, review-before-removing, and do-not-remove categories.
- Why it improved the app: Cleanup can proceed without accidentally deleting active Compass source or app evolution tracking files.
- Validation performed: Inventory built from `git status --short`, ignored build/cache checks, generated artifact scan, and local `.codex` file scan.
- Remaining risk: No files were deleted; cleanup still requires explicit review and process shutdown.
