# Compass Version Evolution Plan

- Previous version summary: v0.2 Command Center Monitor exposed file catalog, lifecycle states, next move, detach readiness, Explorer integration, and local agent token/profile settings.
- Current version target: v0.3 Command Center Evolution Tracker

## Weaknesses Of Previous Version

- Mockups, unfinished components, fake-data paths, and disconnected actions were not tracked as first-class app evidence.
- Final-form goal and next-version plan were not visible inside Compass.
- Integrity findings existed only in ad hoc conversation context.

## Upgrade Thesis

This version turns Compass from a project monitor into a self-evolving app monitor that tracks its own unfinished work and version goals.

## Major New Features

- App-local evolution tracking files.
- Parsed evolution snapshot data.
- Evolution view showing current stage, final-form goal, unfinished items, integrity findings, and next upgrade thesis.

## Major UI/UX Improvements

- Add an Evolution navigation item.
- Show unfinished items by priority and status.
- Show current version and next highest-impact action without reading markdown manually.

## Major Architecture Improvements

- Add an `evolution` snapshot branch derived from markdown files.
- Include evolution files in auto-refresh and file catalog evidence.

## Major Reliability Improvements

- Make unfinished work explicit and auditable.
- Keep version completion gate tied to validation commands and documented limitations.

## Major Testing Improvements

- Short term: build, lint, and rendered smoke.
- Next version: add parser/monitor unit tests.

## Major Polish Improvements

- Keep tracker rows compact and evidence-backed.
- Avoid raw markdown as the primary UI.

## Version Delta Gate

v0.3 is a major upgrade if Compass can show the app's own unfinished components and final-form goal directly in the UI, using repo-tracked evidence files as the source of truth.
