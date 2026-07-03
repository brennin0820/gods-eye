# Compass architecture (agent reference)

Compact reference for snapshot shape, API routes, and monitored files. Entry point: [`../AGENTS.md`](../AGENTS.md).

---

## API routes (Vite dev / preview only)

Registered in `server/compassApiPlugin.ts`. Not available in static `dist/` without preview server.

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/registry` | — | `{ registry: RegistryEntry[] }` |
| GET | `/api/project` | `path`, `label?` | `ProjectSnapshot` (full) |
| GET | `/api/project/files` | `path` | `{ fileCatalog: FileCatalogEntry[], checkedAt }` |
| GET | `/api/project/version` | `path` | `{ snapshotVersion, checkedAt }` |
| POST | `/api/generate-file` | JSON body: `projectPath`, `relativePath`, `content` | `{ ok, artifactPath, absolutePath, writtenAt }` |
| POST | `/api/system/open-path` | JSON body: `projectPath`, `targetPath`, `mode: "open" \| "reveal"` | Opens/reveals a validated project path in Windows Explorer |

Registry loaded from `{monorepoRoot}/scripts/nightraven-projects.conf`. Monorepo root discovered by walking up from `cwd` until `scripts/nightraven-projects.conf` exists.

---

## Monitored artifacts (auto-refresh)

`computeSnapshotVersion(projectPath)` hashes mtime of these paths (if present):

- `docs/37_NIGHTRAVEN.md`
- `docs/NIGHTRAVEN_REPO_OVERLAY.md`
- `docs/14_SESSION_HANDOFF.md`
- `docs/02_ENGINEERING_CHANGELOG.md`
- `docs/04_LEARNING_LOG.md`
- `AGENTS.md`
- `.cursor/rules/nightraven-context-intent.mdc`
- `.cursor/hooks.json`
- `docs/PROJECT_HANDOFF.md`
- `docs/PROJECT_CHANGELOG.md`
- `docs/PROJECT_LEARNING.md`
- `docs/PROJECT_SCOPE.md`
- `docs/PROJECT_ROADMAP.md`
- `docs/PROJECT_DECISIONS.md`
- `docs/PARALLEL_RUN_STATUS.md`
- `PARALLEL_RUN_STATUS.md`
- `docs/ledgers/BUILD_LEDGER.md`
- `docs/ledgers/AUDIT_LEDGER.md`
- `.nightraven/file-claims.json`
- `.nightraven/manifest.yaml`
- `.nightraven/manifest.yml`
- `AGENT_WORK_LOG.md`
- `PROJECT_STATE.md`
- `APP_FINAL_FORM_GOAL.md`
- `MOCKUP_COMPONENT_TRACKER.md`
- `APP_INTEGRITY_REPORT.md`
- `VERSION_EVOLUTION_PLAN.md`
- `CHANGELOG_EVOLUTION.md`

16-char SHA-256 prefix of `rel:mtimeMs|…` joined string.

---

## ProjectSnapshot (top-level)

```typescript
// src/types/snapshot.ts — abbreviated
type ProjectSnapshot = {
  registry: RegistryEntry[]
  project: Project
  phases: Phase[]
  tasks: Task[]
  decisions: Decision[]
  blockers: Blocker[]
  notNowItems: NotNowItem[]
  auditItems: AuditItem[]
  promptCards: PromptCard[]      // enrichSnapshot
  progress: ProgressSnapshot     // enrichSnapshot
  memoryFeed: MemoryFeedItem[]
  loopSignals: LoopSignal[]      // enrichSnapshot
  doneCriteria: DoneCriterionStatus[]
  reports: CompassReport[]
  fileCatalog: FileCatalogEntry[]
  monitor: ProjectMonitorSnapshot
  nextMove: NextMove
  evolution: AppEvolutionSnapshot
  settings: CompassSettingsProfile
  meta: {
    projectPath: string
    handoffFound: boolean
    overlayFound: boolean
    artifactCount: number
    artifactTotal: number
    snapshotVersion?: string
    loadedAt: string
  }
}
```

Domain entities (`Task`, `Phase`, etc.) live in `src/types/project.ts`.

### Monitor data

`fileCatalog` presents human-friendly names and purposes over real source paths. Canonical future names are preferred, but legacy aliases remain supported:

- `docs/PROJECT_HANDOFF.md` or `docs/14_SESSION_HANDOFF.md` → Project Handoff
- `docs/PROJECT_CHANGELOG.md` or `docs/02_ENGINEERING_CHANGELOG.md` → Project Changelog
- `docs/PROJECT_LEARNING.md` or `docs/04_LEARNING_LOG.md` → Project Learning
- `docs/NIGHTRAVEN_REPO_OVERLAY.md` → Project Overlay
- `docs/ledgers/BUILD_LEDGER.md` → Build Ledger
- `docs/ledgers/AUDIT_LEDGER.md` → Audit Ledger
- `.nightraven/` → NightRaven Attachment Data

`monitor.lifecycle` uses evidence-backed states: `unregistered`, `attached`, `aligned`, `planned`, `ready_to_build`, `in_build`, `built`, `in_audit`, `fix_needed`, `ready_to_detach`, `detached`, `archived`.

`nextMove` is deterministic: AI may explain or draft prompts later, but monitor truth comes from repo files, git status, ledgers, claims, audits, and explicit UI state only.

### Evolution data

`evolution` is built by `server/evolutionTracker.ts` from app-local markdown files:

- `PROJECT_STATE.md`
- `APP_FINAL_FORM_GOAL.md`
- `MOCKUP_COMPONENT_TRACKER.md`
- `APP_INTEGRITY_REPORT.md`
- `VERSION_EVOLUTION_PLAN.md`
- `CHANGELOG_EVOLUTION.md`

The Evolution page renders current version, stage, goal, final-form screens, Definition of Done, mockup/unfinished component rows, integrity findings, tracking file health, and the next-version delta gate. These files are evidence for Compass product evolution; they are not a license for autonomous agent execution.

---

## IndexedDB overrides

Store: `nightraven-compass` / `project-overrides` keyed by `projectPath`.

```typescript
type ProjectOverrides = {
  projectPath: string
  version: 1
  taskPatches?: Record<string, Partial<Task>>
  customTasks?: Task[]
  deletedTaskIds?: string[]
  decisionPatches?: Record<string, Partial<Decision>>
  customDecisions?: Decision[]
  blockerPatches?: Record<string, Partial<Blocker>>
  customBlockers?: Blocker[]
  auditPatches?: Record<string, Partial<AuditItem>>
  notNowPatches?: Record<string, Partial<NotNowItem>>
  customNotNow?: NotNowItem[]
  phasePatches?: Record<string, Partial<Phase>>
  settings?: Partial<CompassSettingsProfile>
}
```

`mergeSnapshot` applies patches then `enrichSnapshot` recomputes derived arrays.

`CompassSettingsProfile` also carries local-only provider preferences and agent profile design:

- `agentProviders`: provider label, optional token, optional endpoint, model hint, status, last local check time.
- `agentProfiles`: name, provider, model, role, purpose, enabled state, and bounded monitor permissions.
- Legacy `openAiApiKey` / `claudeApiKey` remain for compatibility and are mirrored from provider cards.

These settings stay in IndexedDB for the selected project and are never written back into NightRaven files. Agent profiles describe future AI-assisted explanation or prompt drafting only; they do not grant command execution, autonomous repo edits, plugin/MCP management, or authority to mark monitor evidence complete.

---

## Generated files

Compass can now create generated Markdown artifacts from prompt cards through the dev API.

Constraints:

- Writes are limited to `docs/generated/` and `.codex/generated/` inside the selected project root.
- The route rejects paths that escape the project root.
- This is artifact generation, not arbitrary repo editing.

---

## Context API

`ProjectContext` (via `useCompassData()`):

| Method | Effect |
|--------|--------|
| `selectProject(path, label)` | Load base + overrides for project |
| `refresh({ silent? })` | Re-fetch base snapshot from API |
| `updateTask / updateDecision / updateBlocker / updateAuditItem / updatePhase` | Patch IndexedDB |
| `updateSettings` | Patch settings in IndexedDB (e.g. autoRefresh) |

`refreshStatus`: `idle` | `watching` | `refreshing` | `updated`
