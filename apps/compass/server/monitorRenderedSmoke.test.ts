import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import React, { type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import react from '@vitejs/plugin-react'
import { createServer, type ViteDevServer } from 'vite'
import { buildNextMove, buildProjectFileCatalog, buildProjectMonitorSnapshot } from './projectMonitor.ts'
import type { ProjectContextValue } from '../src/context/compassContext'
import type { Project } from '../src/types/project'
import type { ProjectSnapshot, RegistryEntry } from '../src/types/snapshot'

type FixtureMode = 'ready' | 'blocked' | 'missingMemory' | 'missingHandoff' | 'staleMemory' | 'invalidMemory'

type CompassContextModule = {
  CompassContext: React.Context<ProjectContextValue | null>
}

type FilesModule = {
  FileCatalogPage: ComponentType<{ changedOnly?: boolean }>
}

type RunsModule = {
  RunsPage: ComponentType
}

type DetachModule = {
  DetachPage: ComponentType
}

function writeProjectFile(projectPath: string, relativePath: string, content: string): void {
  const fullPath = path.join(projectPath, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function commitProject(projectPath: string, message: string): void {
  execFileSync('git', ['-C', projectPath, 'add', '.'], { stdio: 'ignore' })
  execFileSync('git', ['-C', projectPath, 'commit', '-m', message], { stdio: 'ignore' })
}

function createFixtureProject(mode: FixtureMode): string {
  const blocked = mode === 'blocked'
  const missingMemory = mode === 'missingMemory'
  const missingHandoff = mode === 'missingHandoff'
  const staleMemory = mode === 'staleMemory'
  const invalidMemory = mode === 'invalidMemory'
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-render-'))
  execFileSync('git', ['init'], { cwd: projectPath, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'compass-render@example.invalid'], { cwd: projectPath, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'Compass Render Test'], { cwd: projectPath, stdio: 'ignore' })

  writeProjectFile(projectPath, 'AGENTS.md', '# Agent instructions\n')
  if (!missingHandoff) {
    writeProjectFile(
      projectPath,
      'docs/14_SESSION_HANDOFF.md',
      [
        '# Handoff',
        '',
        '## Current state / focus',
        '',
        missingMemory
          ? 'Rendered monitor fixture. **Next:** clear scope blocker.'
          : staleMemory
            ? 'Rendered monitor fixture. **Next:** refresh stale handoff memory.'
            : invalidMemory
              ? 'Rendered monitor fixture. **Next:** repair invalid handoff freshness evidence.'
          : blocked
            ? 'Rendered monitor fixture. **Next:** fix failed run.'
            : 'Rendered monitor fixture. **Next:** prepare detach package.',
        '',
        '## Recent sessions',
        '- **2026-08-08** - Rendered monitor fixture session.',
        '',
      ].join('\n'),
    )
  }
  if (!missingMemory) {
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n')
    writeProjectFile(projectPath, 'docs/PROJECT_SCOPE.md', '# Scope\n')
    writeProjectFile(projectPath, 'docs/PROJECT_DECISIONS.md', '# Decisions\n')
  }
  writeProjectFile(projectPath, 'docs/NIGHTRAVEN_ROADMAP.md', '# Roadmap\n')
  writeProjectFile(projectPath, 'docs/02_ENGINEERING_CHANGELOG.md', '# Changelog\n')
  writeProjectFile(projectPath, 'docs/04_LEARNING_LOG.md', '# Learning\n')
  writeProjectFile(projectPath, 'PROJECT_STATE.md', '# Project State\n')
  writeProjectFile(projectPath, 'APP_FINAL_FORM_GOAL.md', '# App Final Form Goal\n')
  writeProjectFile(
    projectPath,
    '.nightraven/file-claims.json',
    blocked ? '{"claims":[{"path":".nightraven/file-claims.json","status":"claimed"}]}\n' : '{"claims":[]}\n',
  )
  writeProjectFile(
    projectPath,
    'docs/PARALLEL_RUN_STATUS.md',
    [
      '_Generated 2026-08-08T12:00:00.000Z by NightRaven Orchestrator._',
      '',
      '| Stream | Agent | Scope | Status | Notes |',
      '| --- | --- | --- | --- | --- |',
      blocked
        ? '| rendered-monitor | Codex | apps/compass/server/monitorRenderedSmoke.test.ts | failed | render smoke failed |'
        : '| rendered-monitor | Codex | apps/compass/server/monitorRenderedSmoke.test.ts | passed | render smoke passed |',
      '',
    ].join('\n'),
  )
  writeProjectFile(
    projectPath,
    'docs/ledgers/BUILD_LEDGER.md',
    [
      '## [2026-08-08] Feature Builder - rendered monitor smoke',
      '- Event: FeatureBuilt',
      '- Files modified: apps/compass/server/monitorRenderedSmoke.test.ts',
      '',
    ].join('\n'),
  )
  writeProjectFile(
    projectPath,
    'docs/ledgers/AUDIT_LEDGER.md',
    [
      '## [2026-08-08] General Auditor - rendered monitor smoke',
      '- Event: AuditCompleted',
      '- Findings: pass',
      '',
    ].join('\n'),
  )
  commitProject(projectPath, 'render fixture')
  if (staleMemory) {
    const stale = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    fs.utimesSync(path.join(projectPath, 'docs/14_SESSION_HANDOFF.md'), stale, stale)
  }
  return projectPath
}

function createSnapshot(
  projectPath: string,
  mode: FixtureMode,
  includeCriticalBlocker = mode === 'blocked',
): ProjectSnapshot {
  const missingHandoff = mode === 'missingHandoff'
  const loadedAt = new Date().toISOString()
  const registry: RegistryEntry[] = [
    {
      path: projectPath,
      label: 'Rendered Monitor Fixture',
      role: 'framework',
      available: true,
    },
  ]
  const project: Project = {
    id: 'fixture',
    name: 'Rendered Monitor Fixture',
    concept: 'Fixture-backed monitor rendered smoke.',
    status:
      mode === 'blocked' || mode === 'missingHandoff' || mode === 'staleMemory' || mode === 'invalidMemory' || includeCriticalBlocker
        ? 'blocked'
        : 'ready',
    currentPhaseId: 'phase-monitor',
    scopeLocked: true,
    createdAt: loadedAt,
    updatedAt: loadedAt,
  }
  const fileCatalog = buildProjectFileCatalog(projectPath)
  if (mode === 'invalidMemory') {
    const handoff = fileCatalog.find((entry) => entry.sourcePath === 'docs/14_SESSION_HANDOFF.md')
    if (handoff) handoff.lastUpdated = 'not-a-valid-timestamp'
  }
  const overlayFound = mode !== 'missingMemory'
  const blockers: ProjectSnapshot['blockers'] = includeCriticalBlocker
    ? [
        {
          id: 'release-blocker',
          projectId: project.id,
          title: 'Release evidence missing',
          reason: 'The release gate has not received its required proof.',
          severity: 'critical',
          blockedTaskIds: [],
          owner: 'user',
          resolutionNeeded: 'Provide release proof before detach.',
          status: 'open',
        },
      ]
    : []
  const monitor = buildProjectMonitorSnapshot(fileCatalog, {
    handoffFound: !missingHandoff,
    overlayFound,
    tasks: [],
    blockers,
    decisions: [],
    auditItems: [],
  })

  return {
    registry,
    project,
    phases: [
      {
        id: 'phase-monitor',
        projectId: project.id,
        name: 'Monitor smoke',
        goal: 'Validate monitor pages render current evidence.',
        order: 1,
        status: 'done',
        doneCriteria: ['Files page renders', 'Runs page renders', 'Detach page renders'],
        notAllowedYet: [],
      },
    ],
    tasks: [],
    decisions: [],
    blockers,
    notNowItems: [],
    auditItems: [],
    promptCards: [],
    progress: {
      projectId: project.id,
      scopeProgress: 100,
      buildProgress: 100,
      auditProgress: 100,
      decisionProgress: 100,
      shippingProgress: 100,
      learningProgress: 100,
    },
    memoryFeed: [],
    loopSignals: [],
    doneCriteria: [],
    reports: [],
    fileCatalog,
    monitor,
    nextMove: buildNextMove(monitor),
    evolution: {
      currentVersion: 'fixture',
      currentStage: 'smoke',
      goal: 'Validate monitor rendering',
      corePromise: 'Compass points to evidence-backed next steps.',
      lastUpdated: loadedAt,
      requiredScreens: ['Files', 'Runs', 'Detach'],
      definitionOfDone: ['Rendered smoke passes'],
      mockupItems: [],
      integrityFindings: [],
      nextVersionTarget: 'fixture',
      upgradeThesis: 'No upgrade in fixture.',
      versionDeltaGate: 'Smoke only.',
      trackingFiles: [],
      changelogEntries: [],
    },
    settings: {
      dataMode: 'registry',
      autoRefresh: false,
      showPhaseBadges: true,
      projectRootHint: projectPath,
    },
    meta: {
      projectPath,
      handoffFound: !missingHandoff,
      overlayFound,
      artifactCount: fileCatalog.filter((entry) => entry.status === 'present').length,
      artifactTotal: fileCatalog.length,
      snapshotVersion: `fixture-${mode}`,
      loadedAt,
    },
  }
}

function createContextValue(snapshot: ProjectSnapshot): ProjectContextValue {
  async function noopAsync(): Promise<void> {
    return undefined
  }

  return {
    registry: snapshot.registry,
    snapshot,
    loading: false,
    error: null,
    selected: { path: snapshot.meta.projectPath, label: snapshot.project.name },
    selectProject: () => undefined,
    refresh: noopAsync,
    refreshStatus: { state: 'idle' },
    updateTask: noopAsync,
    updateDecision: noopAsync,
    updateBlocker: noopAsync,
    updateAuditItem: noopAsync,
    updatePhase: noopAsync,
    updateSettings: noopAsync,
  }
}

async function startSsrServer(): Promise<ViteDevServer> {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    plugins: [react()],
    server: { middlewareMode: true },
  })
  return server
}

async function renderMonitorPages(snapshot: ProjectSnapshot): Promise<string> {
  const server = await startSsrServer()
  try {
    const [{ CompassContext }, { FileCatalogPage }, { RunsPage }, { DetachPage }] = await Promise.all([
      server.ssrLoadModule('/src/context/compassContext.ts') as Promise<CompassContextModule>,
      server.ssrLoadModule('/src/components/files/FileCatalogPage.tsx') as Promise<FilesModule>,
      server.ssrLoadModule('/src/components/runs/RunsPage.tsx') as Promise<RunsModule>,
      server.ssrLoadModule('/src/components/detach/DetachPage.tsx') as Promise<DetachModule>,
    ])
    const value = createContextValue(snapshot)
    const page = React.createElement(
      CompassContext.Provider,
      { value },
      React.createElement(
        React.Fragment,
        null,
        React.createElement(FileCatalogPage),
        React.createElement(RunsPage),
        React.createElement(DetachPage),
      ),
    )
    return renderToStaticMarkup(page)
  } finally {
    await server.close()
  }
}

async function assertRenderedMode(mode: FixtureMode, patterns: RegExp[]): Promise<void> {
  const projectPath = createFixtureProject(mode)
  try {
    const markup = await renderMonitorPages(createSnapshot(projectPath, mode))
    for (const pattern of patterns) {
      assert.match(markup, pattern)
    }
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
}

test('open critical blocker alone blocks shipping and detach monitor truth', () => {
  const projectPath = createFixtureProject('ready')
  try {
    const snapshot = createSnapshot(projectPath, 'ready', true)
    const shippingDetach = snapshot.monitor.dimensions.find((dimension) => dimension.id === 'shippingDetach')

    assert.equal(snapshot.monitor.lifecycle, 'fix_needed')
    assert.equal(shippingDetach?.status, 'blocked')
    assert.match(shippingDetach?.evidence.join(' ') ?? '', /Open high\/critical blocker detected/)
    assert.equal(snapshot.nextMove.action, 'Clear shipping / detach blocker')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('SSR-rendered monitor pages show ready-to-detach evidence', async () => {
  await assertRenderedMode('ready', [
    /Friendly file and folder map/,
    /Run Status/,
    /Build: built/,
    /Build, audit, and run evidence/,
    /Ready To Detach/,
    /Project can prepare to detach/,
    /Pass.*Project handoff fresh/,
    /Project Handoff freshness evidence is valid for detach/,
    /Prepare detach package/,
  ])
})

test('SSR-rendered monitor pages show failed run and claim blockers', async () => {
  await assertRenderedMode('blocked', [
    /File Claims/,
    /Claim: claimed/,
    /Audit: fail/,
    /Fix Needed/,
    /Fix build failure/,
    /Project is not ready to detach/,
    /No blocking file claims/,
    /data-passed="false"><strong>Blocked<\/strong><span>No open high\/critical blockers<\/span>/,
    /Open high or critical blockers must be resolved before detach/,
    /Current run status has failed stream evidence/,
  ])
})

test('SSR-rendered monitor pages show missing attach and align memory blockers', async () => {
  await assertRenderedMode('missingMemory', [
    /Project Overlay/,
    /Project Scope/,
    /Project Decisions/,
    /Missing/,
    /Attached/,
    /Project is not ready to detach/,
    /Memory artifacts present/,
    /Clear scope blocker/,
    /required attach\/align file\(s\) are missing/,
  ])
})

test('SSR-rendered Detach checklist fails both handoff checks when the handoff is absent', async () => {
  await assertRenderedMode('missingHandoff', [
    /Project is not ready to detach/,
    /Blocked.*Project handoff present/,
    /Blocked.*Project handoff fresh/,
    /Project Handoff must exist before freshness can be verified/,
  ])
})

test('SSR-rendered monitor pages show stale handoff freshness blocker', async () => {
  await assertRenderedMode('staleMemory', [
    /Project is not ready to detach/,
    /Blocked.*Project handoff fresh/,
    /A stale Project Handoff must be refreshed before detach/,
  ])
})

test('SSR-rendered monitor pages show invalid handoff freshness blocker', async () => {
  await assertRenderedMode('invalidMemory', [
    /Project is not ready to detach/,
    /Blocked.*Project handoff fresh/,
    /Project handoff freshness evidence is invalid and must be repaired before detach/,
  ])
})
