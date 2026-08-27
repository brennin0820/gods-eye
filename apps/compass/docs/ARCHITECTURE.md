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

Git changes use NUL-delimited porcelain v1 records. For Git renames and copies, Compass reports the current destination path—the path a builder, auditor, or Explorer action can use—while preserving literal ` -> ` text when it is part of an ordinary filename.

Claim precision is stateful, not substring-based. An existing `.nightraven/file-claims.json` is the authoritative current set; Compass accepts top-level claim arrays plus `claims` / `activeClaims` / `files` / `paths` collections, including statusless path entries. Claim-array members must be nonblank safely contained path strings, path-bearing claim objects, or nested arrays of those forms; one unsupported primitive, pathless object, outside-root path, traversal, foreign absolute/Windows path, or symlink escape invalidates the full canonical source rather than silently dropping evidence or interpreting metadata keys as file paths. A direct object under a named collection must be a path-bearing claim record or a keyed claim map; record metadata without a path is invalid. Reserved record-field names such as `status`, `owner`, or `stream` are not accepted as ambiguous extensionless keyed-map paths; use an explicit `{ "path": "status" }` record when that is the real filename. Compass blocks progression when canonical evidence is blank, malformed, structurally unsupported, or contains an unsafe path. Compass falls back to `AGENT_WORK_LOG.md` only when the canonical file is absent, and only the owning stream's later `RELEASED` entry clears a legacy claim. Every valid active claim becomes visible as a blocking file row even when its target is clean in Git or missing from the fixed catalog; invalid paths never become catalog rows or metadata claims.

The monitor catalog and API snapshot resolve fixed evidence sources against the selected project's real filesystem root before Compass reads content or target metadata. A canonical source that is outside-root, broken, unverifiable, or the wrong file/folder type remains authoritative and fails closed instead of falling through to a legacy alias; build, audit, run, claim, memory, report, refresh-version, and detach truth cannot be imported from another project. File reads and metadata use the same descriptor, whose device and inode must still match the validated file; catalog size/time and snapshot report/version timestamps therefore describe the opened evidence rather than a later path lookup. Git-derived paths keep literal POSIX backslashes and pass through the same containment gate before any metadata lookup. The snapshot and catalog share canonical-first handoff and run-status selection. Symlinks whose resolved targets remain inside the selected project continue to work, including configured legacy aliases.

Run precision prefers current status snapshots over append-only history. When `docs/PARALLEL_RUN_STATUS.md` or `PARALLEL_RUN_STATUS.md` exists, Compass parses only the exact stream table states (`pending`, `running`, `passed`, `failed`) and uses active or failed streams for project lifecycle/build status instead of treating old ledger `BuildStarted` text as a current run. Active project-run state does not mark every changed file planned; file-level build truth still requires exact ledger attribution. Compact and space-padded Markdown tables are both valid. The canonical Planner schema (`Stream | Division | Phase | State | Detail`), the established Compass compatibility schema (`Stream | Agent | Scope | Status | Notes`), their separator row, and the exact canonical empty-state row (`— | — | — | — | no streams run yet`) are recognized explicitly. The empty row must occur once and cannot be mixed with current stream rows. Blank evidence, missing or unknown schemas, malformed stream rows, header-only tables, and unsupported stream states fail closed as repair-required run evidence instead of disappearing as zero streams. Invalid evidence and genuine failed streams retain distinct monitor diagnostics, and parsed run failure stays distinct from an audit-ledger failure attributed to the status file. Snapshot reports reuse these authoritative counts, including compact and empty tables. A pending or running stream is also a hard detach gate: lifecycle remains `in_build` until the current status snapshot becomes terminal.

Ledger precision is recency-aware. Compass parses build/audit ledger entries by heading and event, prefers the latest entry that mentions a path, and falls back to the latest ledger entry overall; old `BuildStarted` or failed audit text does not override newer completion/pass evidence.

Supersedes the file-level fallback above: path attribution now uses exact structured ledger values—semicolon-delimited file/scope fields and exact status-qualified audit findings—so prefix collisions such as `src/app.ts` versus `src/app.tsx` or `src/app.ts copy` do not share evidence. Narrative mentions, negative metadata fields, comma-delimited ambiguity, and indented prose fail closed; multiple paths must use semicolons or separate recognized fields. Mixed audit findings retain each path's own outcome instead of inheriting another file's failure; `needs_user_decision` and `scope_creep` fail the file gate, while `pending` / `in_progress` remain required. Entry-level fallback evaluates semicolon-delimited Findings clauses independently and ignores a blocking token only when the entire clause matches the closed no/zero/without-failure grammar with known audit/test modifiers; unknown, causal, trailing, or separate failure language remains blocking. A changed file is `built` only when its own latest path-specific entry is complete; the latest overall build entry remains visible as project context but cannot prove an unrelated file complete.

Attach/align memory is a hard detach gate. Missing attach or align artifacts, including the project overlay, keep the monitor in `attached` unless higher-severity failed evidence is present; `ready_to_detach` requires the required attach/align files and overlay to be present, and the handoff must be newer than the seven-day freshness window with a valid timestamp. A stale or malformed handoff freshness value remains a memory watch state and blocks detach until refreshed or repaired.

The Detach checklist mirrors the lifecycle gates instead of using weaker labels: pending or failed audit evidence marks the audit row blocked, and any file with `build: planned` marks the active run/build row blocked until its current evidence becomes terminal.

The Detach checklist explicitly reports the monitor's open high/critical blocker gate, so that blocker cannot be hidden behind otherwise-clear build, audit, claim, or memory rows.

Rendered monitor smoke has two levels. `npm run test:monitor:render` uses Vite SSR to render the real Files, Runs, and Detach page components for ready, failed-run, active-claim, missing-handoff, stale-handoff, malformed-handoff, and missing-memory fixtures without launching Chrome; the Detach checklist fails both handoff rows when the handoff is absent and visibly reports stale or invalid freshness evidence as blocked. `npm run test:monitor:browser` remains the optional full browser/CDP smoke when local Chrome remote debugging is healthy; it warms the Vite entry, verifies the fixture HTML/API contract, then attaches CDP to an isolated blank target before explicitly navigating to each fixture state. Target discovery uses the page endpoint when available and falls back to Chrome's confirmed browser WebSocket when `/json/list` stalls. Vite listen, warmup, and close operations, the complete browser scenario, Chrome spawn confirmation, CDP WebSocket connection, CDP commands, remote-debug probes, visible-text waits, partial page-session setup, and browser shutdown are all bounded or explicitly released so a failed run reports diagnostics and removes its Chrome profile instead of remaining pending. The browser gate includes both an injected never-opening socket and a real local TCP peer that accepts but never completes a WebSocket handshake; both must time out and release their transport. `npm run test:monitor:all` is the canonical monitor gate: it runs parser/API, SSR, then browser evidence checks in that order.

### Evolution data

`evolution` is built by `server/evolutionTracker.ts` from app-local markdown files:

- `PROJECT_STATE.md`
- `APP_FINAL_FORM_GOAL.md`
- `MOCKUP_COMPONENT_TRACKER.md`
- `APP_INTEGRITY_REPORT.md`
- `VERSION_EVOLUTION_PLAN.md`
- `CHANGELOG_EVOLUTION.md`

The Evolution page renders current version, stage, goal, final-form screens, Definition of Done, mockup/unfinished component rows, integrity findings, tracking file health, and the next-version delta gate. These files are evidence for Compass product evolution; they are not a license for autonomous agent execution.

Evolution discovery is canonical-first: project-root tracking files take precedence over `apps/compass/` files. Content and metadata use the same descriptor-bound, project-contained resolver as monitor evidence. Unsafe, outside-root, broken, or wrong-type canonical entries fail closed without falling through to nested or process-working-directory state; contained in-project symlinks remain supported.

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
