# AGENTS.md — NightRaven Compass (coding agent entry)

**Read this first** when working in `apps/compass/`. For NightRaven framework law on the monorepo, use repo root [`AGENTS.md`](../../AGENTS.md) and [`docs/14_SESSION_HANDOFF.md`](../../docs/14_SESSION_HANDOFF.md) — **framework handoff only**. Compass loads **consumer** handoffs from each registered project path.

---

## What Compass is

**NightRaven Compass** is a project-guidance UI for a **non-coder builder** (Brent) who uses NightRaven memory and NightRaven orchestration to build software with AI agents.

**Motto chain:** NightRaven thinks · NightRaven builds · Auditor verifies · **Compass points** to the next correct step.

Compass does **not** run agents or sync to the cloud. It **reads** NightRaven artifacts from disk (via dev-server API), **merges** local IndexedDB overrides, and **surfaces** scope, phase, priorities, blockers, decisions, audits, progress, prompts, and loop warnings. It may also generate constrained local Markdown artifacts for the selected project via the dev API.

---

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Vite 8 |
| Styling | CSS modules / `index.css` (no Tailwind) |
| Icons | `lucide-react` |
| Routing | `useState` view switching — no React Router |
| Server (dev only) | Vite middleware plugin `server/compassApiPlugin.ts` |
| Client persistence | IndexedDB (`nightraven-compass` / `project-overrides`) |
| Registry | `scripts/nightraven-projects.conf` at monorepo root |

---

## Directory map

```text
apps/compass/
├── AGENTS.md              ← you are here
├── README.md              ← human + agent pointer
├── docs/                  ← product scope, build reports, ARCHITECTURE.md
├── server/                ← Vite dev API (Node, not bundled to static build)
│   ├── compassApiPlugin.ts
│   ├── buildSnapshot.ts   ← handoff → ProjectSnapshot
│   └── parseHandoff.ts
├── src/
│   ├── main.tsx           ← ProjectProvider → CompassState → App
│   ├── app/
│   │   ├── App.tsx        ← activeView state + AppShell
│   │   └── routeRegistry.tsx
│   ├── components/
│   │   ├── layout/        ← AppShell, Sidebar, navigation.ts
│   │   ├── dashboard/     ← Phase 1 cards
│   │   ├── roadmap/       ← Phase 2
│   │   ├── priority/      ← Phase 2
│   │   ├── scope/         ← Phase 2
│   │   ├── queues/        ← Phase 2 task queues
│   │   ├── prompts/       ← Phase 3 Next Prompt
│   │   ├── lists/         ← Phase 4 decisions, blockers, not-now
│   │   ├── auditor/       ← Phase 5
│   │   ├── progress/      ← Phase 6
│   │   ├── criteria/      ← Phase 6 done criteria
│   │   ├── memory/        ← Phase 7 memory feed
│   │   ├── loops/         ← Phase 8 loop detector
│   │   ├── reports/       ← Phase 8
│   │   └── settings/      ← registry picker, auto-refresh toggle
│   ├── context/
│   │   ├── ProjectContext.tsx   ← data orchestration
│   │   └── compassContext.ts
│   ├── hooks/
│   │   └── useCompassData.ts
│   ├── services/
│   │   ├── compassApi.ts        ← fetch registry/project/version
│   │   ├── persistence.ts       ← IndexedDB overrides
│   │   └── snapshotMerge.ts
│   ├── data/                    ← mock seeds (fallback when API unavailable)
│   ├── types/
│   │   ├── project.ts
│   │   └── snapshot.ts
│   └── utils/
│       ├── enrichSnapshot.ts    ← derived fields (prompts, loops, progress)
│       ├── promptGenerator.ts
│       ├── loopDetector.ts
│       └── progress.ts
└── vite.config.ts               ← compassApiPlugin()
```

---

## Data flow (read this before editing)

```text
nightraven-projects.conf
        │
        ▼
GET /api/registry  ──────────────────────────────┐
        │                                         │
        ▼                                         │
pickInitialProject() / Settings select            │
        │                                         │
        ▼                                         │
GET /api/project?path=&label=                     │
  └─ buildSnapshot.ts                             │
       ├─ read docs/14, overlay, Bible, etc.      │
       ├─ parseHandoff.ts                         │
       └─ computeSnapshotVersion() (mtime hash)   │
        │                                         │
        ▼                                         │
loadOverrides(path) from IndexedDB                │
        │                                         │
        ▼                                         │
mergeSnapshot(base, overrides)                    │
        │                                         │
        ▼                                         │
enrichSnapshot(merged, dataMode)                  │
  └─ prompt cards, loop signals, done criteria,     │
     progress dimensions, reports stubs           │
        │                                         │
        ▼                                         │
ProjectContext → useCompassData() → page components
        │
        ▼
updateTask / updateDecision / … → persistOverrides → IndexedDB
```

**Two-source model:**

1. **Base snapshot (read-only from disk)** — rebuilt on refresh; sourced from consumer project's NightRaven files.
2. **Overrides (IndexedDB)** — task/decision/blocker/audit/phase patches, settings; survives refresh.

User edits in the UI normally write **overrides only**. The one exception is explicit artifact generation actions, which may write constrained files under `docs/generated/` or `.codex/generated/` in the selected project.

---

## Project registry and default project

| Item | Location / behavior |
|------|---------------------|
| Registry file | `scripts/nightraven-projects.conf` (monorepo root) |
| Format | `ABS_PATH\|label\|role` per line (`framework`, `master`, `app`, `user-global`) |
| Default project | **NightRaven monorepo (framework)** when no `localStorage` selection |
| Stored selection | `localStorage` key `compass.selectedProject` |
| Switch project | Settings → registry list → Select |

**Handoff isolation:** When Compass shows HimFLer, it reads `E:/NightRaven/HimFLer/docs/14_SESSION_HANDOFF.md` — not framework `nightraven/docs/14`. Never bleed framework handoff into consumer app context.

---

## Auto-refresh (implemented)

When `settings.autoRefresh` is true and `dataMode === 'registry'`:

1. Client polls `GET /api/project/version?path=` every **10s** (`AUTO_REFRESH_POLL_MS`).
2. Server `computeSnapshotVersion()` hashes **mtime** of monitored artifacts (see `MONITORED_ARTIFACTS` in `server/buildSnapshot.ts`).
3. On version change → silent `loadProject()` → banner in `AppShell` ("NightRaven memory changed — snapshot refreshed").
4. Header badges: **Live** (watching) · **Refreshing…** · **Updated** (6s banner).

Toggle: Settings → Auto-refresh. Static `vite build` output has no API — polling fails silently; manual refresh unavailable without preview server.

---

## Phase 1–8 page map

Navigation ids live in `src/components/layout/navigation.ts`. Routes in `src/app/routeRegistry.tsx` — **must stay in sync** (startup throws if mismatch).

| Phase | Nav id | Page | Primary files |
|-------|--------|------|---------------|
| 1 | `dashboard` | Dashboard | `components/dashboard/*` |
| Monitor | `changed-files` | What Changed | `components/files/FileCatalogPage.tsx` |
| Monitor | `files` | Files | `components/files/FileCatalogPage.tsx` |
| Monitor | `runs` | Runs | `components/runs/RunsPage.tsx` |
| Monitor | `detach` | Detach | `components/detach/DetachPage.tsx` |
| Monitor | `evolution` | Evolution | `components/evolution/EvolutionPage.tsx` |
| 2 | `scope-map` | Scope Map | `components/scope/ScopeMapPage.tsx` |
| 2 | `roadmap` | Roadmap | `components/roadmap/RoadmapPage.tsx` |
| 2 | `priority-board` | Priority Board | `components/priority/PriorityBoardPage.tsx` |
| 2 | `coder-tasks` | Coder Tasks | `components/queues/CoderTasksPage.tsx` |
| 2 | `next-prompt` | Next Prompt | `components/prompts/NextPromptPage.tsx` |
| 2 | `nightraven-queue` | NightRaven Queue | `TaskQueuePage` queueId=`nightraven-queue` |
| 2 | `nr-queue` | NR Queue | `TaskQueuePage` queueId=`nr-queue` |
| 2 | `research-queue` | Research Queue | `TaskQueuePage` queueId=`research-queue` |
| 2 | `decisions` | Decisions | `components/lists/DecisionsPage.tsx` |
| 2 | `blockers` | Blockers | `components/lists/BlockersPage.tsx` |
| 2 | `not-now` | Not Now | `components/lists/NotNowPage.tsx` |
| 5 | `auditor-queue` | Auditor Queue | `components/auditor/AuditorQueuePage.tsx` |
| 6 | `progress` | Progress Tracker | `components/progress/ProgressTrackerPage.tsx` |
| 6 | `done-criteria` | Done Criteria | `components/criteria/DoneCriteriaPage.tsx` |
| 7 | `memory-feed` | Memory Feed | `components/memory/MemoryFeedPage.tsx` |
| 7 | `settings` | Settings | `components/settings/SettingsPage.tsx` |
| 8 | `back-and-forth` | Loop Detector | `components/loops/LoopDetectorPage.tsx` |
| 8 | `reports` | Reports | `components/reports/ReportsPage.tsx` |

---

## Data modes

| Mode | When | Source |
|------|------|--------|
| `registry` | Dev server API succeeds | Live handoff parse + enrich |
| `local` | API fails for selected path | Mock snapshot seeded with project label |
| `mock` | Bootstrap catastrophic failure | `buildMockSnapshot()` |

Set in snapshot `settings.dataMode`; user cannot pick mode directly — it follows API availability.

---

## How to verify

```bash
cd apps/compass
npm install
npm run dev      # API + UI — registry mode works
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # preview server also attaches compassApiPlugin
```

**Smoke checks:** Open Settings → confirm registry entries; select HimFLer; edit a task state → reload → override persists; edit a handoff file on disk → within ~10s see Live/Updated badge (auto-refresh on).

---

## Safe modification guide

| Task | Touch these files |
|------|-------------------|
| New sidebar page | `navigation.ts` + `routeRegistry.tsx` + new component |
| New snapshot field | `types/snapshot.ts` → `buildSnapshot.ts` → `enrichSnapshot.ts` → consumers |
| New override patch | `persistence.ts` → `snapshotMerge.ts` → `ProjectContext` updater |
| New API route | `compassApiPlugin.ts` + `compassApi.ts` |
| New monitor evidence field | `types/snapshot.ts` + `server/projectMonitor.ts` + consuming page |
| New evolution tracker field | `types/snapshot.ts` + `server/evolutionTracker.ts` + `components/evolution/EvolutionPage.tsx` |
| Prompt templates | `utils/promptGenerator.ts` |
| Handoff parsing | `server/parseHandoff.ts` |

**Exhaustive switches:** TypeScript unions use `never` in default cases (workspace rule).

**Imports:** Top of file only — no inline imports.

---

## Out of scope (locks — do not implement without explicit Brent approval)

- Cloud sync / multi-user database
- Autonomous AI agent execution from Compass UI
- Arbitrary repo auto-editing (generated Markdown artifacts only; no unrestricted writes)
- Plugin / MCP manager UI
- React Router / URL deep links (MVP uses in-memory view state)

## Command Center monitor boundaries

- Monitor truth comes from repo files, git status, ledgers, claims, audits, and explicit UI state.
- AI may explain or draft prompts only after deterministic evidence exists; AI never marks work done.
- File/folder explorer rows use friendly names and purposes, but must keep real `sourcePath` visible.
- Windows Explorer actions go through `/api/system/open-path`; only `open` and `reveal` are allowed, and targets must stay inside the selected project.
- Agent token/profile settings are local IndexedDB preferences only. They may describe provider credentials, model hints, roles, and bounded monitor permissions, but they do not make Compass an autonomous agent runner or plugin/MCP manager.

## Autonomous app evolution add-on

When Brent asks Compass to keep improving, use the app evolution loop for `apps/compass/` only.

Maintain these app-local tracking files:

- `PROJECT_STATE.md`
- `APP_FINAL_FORM_GOAL.md`
- `MOCKUP_COMPONENT_TRACKER.md`
- `APP_INTEGRITY_REPORT.md`
- `VERSION_EVOLUTION_PLAN.md`
- `CHANGELOG_EVOLUTION.md`

Loop:

1. Track mockups, placeholders, unfinished components, fake-data paths, disconnected screens, incomplete flows, bugs, integrity gaps, and future upgrade opportunities.
2. Define the current version final-form goal before calling the version complete.
3. Build one focused improvement at a time toward that goal.
4. Validate with the real Compass commands.
5. Audit gaps, bugs, weak logic, disconnected systems, accessibility, persistence, and security risks.
6. Fix critical/high integrity issues before planning the next version.
7. Plan the next version as a meaningful upgrade, not random change.
8. Repeat until Brent explicitly says stop.

Rules:

- Do not claim perfection; claim only that the version meets the documented completion gate when evidence proves it.
- Do not leave mockups, fake data, inert controls, or disconnected screens untracked.
- Do not rewrite working systems without a concrete correctness, maintainability, or user-flow reason.
- Do not make Compass an autonomous agent runner unless Brent separately approves that product boundary change.
- End each evolution task with current version, stage, goal, improvement completed, unfinished items found/completed, files changed, commands run, validation, remaining gaps, and next highest-impact action.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | Human-oriented run + feature table |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Snapshot shape, API routes, monitored files |
| [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md) | Product scope |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Domain types |
| Repo [`docs/NIGHTRAVEN_UNIFIED_PRODUCT.md`](../../docs/NIGHTRAVEN_UNIFIED_PRODUCT.md) | Monorepo boundaries |
| Repo [`docs/14_SESSION_HANDOFF.md`](../../docs/14_SESSION_HANDOFF.md) | Framework work only — not consumer app state |
