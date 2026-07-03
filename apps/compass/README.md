# NightRaven Compass

> **Monorepo path:** `apps/compass/` in the [NightRaven platform repo](https://github.com/brennin0820/nightraven).

NightRaven Compass is a project-guidance app for a non-coder builder using NightRaven and NightRaven to build software with AI agents.

## For AI agents

**Start here:** [`AGENTS.md`](AGENTS.md) — stack, directory map, data flow, phase/route map, persistence, auto-refresh, safe-edit guide, and out-of-scope locks.

Compact API/types reference: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

For NightRaven framework law on the monorepo, use repo root [`AGENTS.md`](../../AGENTS.md). Compass reads registered project handoffs and now defaults to the active NightRaven monorepo unless the user has already selected another project.

## Purpose

The app shows project scope, current phase, priorities, blockers, decisions, audits, Not Now items, progress, and the next best prompt.

**Phases 1–8 are live** in the UI, plus the first Command Center monitor surfaces: Overview, What Changed, Files, Runs, Detach, and Evolution. With `npm run dev`, registry mode loads handoff-derived snapshots from registered repos via the Vite file API. If the API is unavailable (static build), Compass falls back to seeded mock data for that session. No cloud sync, autonomous AI, or repo auto-editing.

## Core Identity

NightRaven thinks.
NightRaven builds.
Auditor verifies.
NightRaven Compass points the user to the next correct step.

## Run

```bash
cd apps/compass
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Verify

```bash
npm run build
npm run lint
```

## Phase deliverables

| Phase | Feature | Status |
|-------|---------|--------|
| **1** | App shell, sidebar, dashboard cards | Live |
| **2** | Roadmap (phases + current highlight), Priority Board (lanes + TaskCard + TaskDetailPanel), Scope Map, task queues | Live |
| **3** | Next Prompt — NightRaven Builder, Auditor, Research via `promptGenerator.ts` | Live |
| **4** | Decisions (open/decided/superseded + scope lock), Blockers (severity + blocked tasks), Not Now | Live |
| **5** | Auditor Queue — findings, required fixes, `canMoveForward`, mark pass/fix | Live |
| **6** | Progress Tracker — six honest dimensions, Done Criteria, Reports | Live |
| **7** | Memory Feed — tasks, decisions, audits, blockers, sessions | Live |
| **8** | Loop Detector — reopened decisions, future-phase work, planning loops, shipping stall | Live |
| **Monitor** | File catalog, evidence-backed lifecycle, next move, detach readiness, Windows Explorer open/reveal, evolution tracking | Live |

Additional sidebar pages: Coder Tasks, NightRaven/Research queues, Settings (registry, refresh, local agent tokens, and agent profiles).

## Project registry (NightRaven workspaces)

Compass reads live handoff and overlay from registered repos via the Vite dev API (`/api/registry`, `/api/project`).

| Setting | Location |
|---------|----------|
| Registry file | `scripts/nightraven-projects.conf` at monorepo root |
| Default project | **NightRaven monorepo (framework)** when no prior selection is stored |
| Switch project | **Settings** → Registry list → **Select** on the row you want |

Format: `ABS_PATH|label|role` — one line per workspace (`framework`, `master`, `app`, `user-global`).

Registered consumer app **HimFLer** (iOS 26 · GitHub `brennin0820/HimFler`) ships its own `docs/14_SESSION_HANDOFF.md` and `docs/NIGHTRAVEN_REPO_OVERLAY.md`; Compass does not bleed framework handoff into that repo.

## Auto-refresh (live monitor)

When **Settings → Auto refresh** is on (default) and data mode is **Registry**, Compass polls `/api/project/version` every **10 seconds** for changes to NightRaven memory files (handoff, overlay, changelog, learning log, AGENTS.md, rules, hooks). On change it silently reloads the snapshot, merges IndexedDB overrides, and shows a **Live** / **Updated** badge in the header plus a short banner.

Polling pauses while the browser tab is hidden and resumes (with an immediate check) when you return. Toggle auto refresh off in Settings to use manual **Refresh from NightRaven** only.

## Command Center monitor

The monitor turns repo evidence into friendly project state. It shows human labels and purposes for important files/folders while preserving real source paths, for example **Project Handoff** over `docs/14_SESSION_HANDOFF.md`.

Lifecycle states are evidence-backed: Unregistered, Attached, Aligned, Planned, Ready To Build, In Build, Built, In Audit, Fix Needed, Ready To Detach, Detached, Archived. AI is not a source of truth; it may only explain status or draft prompts after deterministic evidence is read.

Windows Explorer integration is user-triggered only. Open/reveal actions validate the target path stays inside the selected project and never delete, move, rename, edit, or run arbitrary commands.

Settings includes **Agent Tokens** and **Agent Profiles** for local development. Tokens stay in browser IndexedDB for the selected project; profile permissions describe future AI-assisted explanation or prompt-drafting behavior. They do not give Compass autonomous agent execution, unrestricted repo edits, or plugin/MCP management.

The **Evolution** view reads app-local tracking files: `PROJECT_STATE.md`, `APP_FINAL_FORM_GOAL.md`, `MOCKUP_COMPONENT_TRACKER.md`, `APP_INTEGRITY_REPORT.md`, `VERSION_EVOLUTION_PLAN.md`, and `CHANGELOG_EVOLUTION.md`. This keeps mockups, unfinished components, fake-data paths, integrity findings, and next-version plans visible inside Compass.

**Verify:** run `npm run dev`, open Dashboard / Scope Map / Memory Feed, edit `docs/14_SESSION_HANDOFF.md` **Recent sessions** in the selected project, save — within ~10s the UI should show **Updated** and new session rows.

## Out of scope (MVP)

- Cloud sync
- Real AI automation
- Repo auto-editing
- Plugin / MCP managers
- Multi-user database

## Auto-refresh

When **Settings → Auto-refresh** is on and the project is in registry mode, Compass polls NightRaven file mtimes every 10 seconds and reloads the snapshot when handoff, overlay, or related memory files change. The header shows **Live**, **Refreshing…**, or **Updated** status.

## Docs

- [`AGENTS.md`](AGENTS.md) — agent entry (read first for code work)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — snapshot shape, API routes
- [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md)
- [`docs/MVP_ROADMAP.md`](docs/MVP_ROADMAP.md)
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
- [`docs/ACCEPTANCE_CRITERIA.md`](docs/ACCEPTANCE_CRITERIA.md)
- [`docs/BUILD_REPORT_PHASE1.md`](docs/BUILD_REPORT_PHASE1.md)
- [`docs/BUILD_REPORT_PHASES_2-8.md`](docs/BUILD_REPORT_PHASES_2-8.md)
