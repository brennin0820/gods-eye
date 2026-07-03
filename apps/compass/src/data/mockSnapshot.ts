import type {
  AppEvolutionSnapshot,
  FileCatalogEntry,
  MemoryFeedItem,
  NextMove,
  ProjectMonitorSnapshot,
  ProjectSnapshot,
} from '../types/snapshot'
import { mockPhase2Tasks } from './mockPhase2'
import {
  phase34PromptCards,
  phase34SupplementalBlockers,
  phase34SupplementalDecisions,
  phase34SupplementalTasks,
} from './mockPhase34'
import {
  mockPhase56AuditItems,
  mockPhase56Progress,
  mockPhase56Tasks,
} from './mockPhase56'
import {
  mockDoneCriteria,
  mockExtraAudits,
  mockExtraBlockers,
  mockExtraDecisions,
  mockExtraTasks,
  mockLoopSignals,
  mockMemoryFeed,
  mockRegistry,
  mockReports,
  mockSettingsProfile,
} from './mockPhase78'
import { mockBlockers, mockDecisions, mockNotNowItems, mockPhases, mockProject, mockPromptCards, mockTasks } from './mockProject'

function mergeById<T extends { id: string }>(...groups: T[][]): T[] {
  const map = new Map<string, T>()
  for (const group of groups) {
    for (const item of group) {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

const mockFileCatalog: FileCatalogEntry[] = [
  {
    id: 'project-handoff',
    name: 'Project Handoff',
    type: 'file',
    purpose: 'Current state, recent sessions, guardrails, and next safest step.',
    canonicalPath: 'docs/PROJECT_HANDOFF.md',
    aliases: ['docs/14_SESSION_HANDOFF.md'],
    sourcePath: 'docs/14_SESSION_HANDOFF.md',
    absolutePath: 'mock://nightraven-compass/docs/14_SESSION_HANDOFF.md',
    status: 'present',
    lastUpdated: new Date().toISOString(),
    monitorRole: 'memory',
    usedByMonitor: true,
    requiredFor: ['align', 'detach'],
    precision: {
      changed: 'no',
      expected: 'unknown',
      claim: 'unclaimed',
      build: 'not_required',
      audit: 'not_required',
      blocking: false,
      nextAction: 'No action needed.',
      evidence: ['mock handoff present'],
    },
  },
  {
    id: 'build-ledger',
    name: 'Build Ledger',
    type: 'file',
    purpose: 'Append-only evidence of build starts, file changes, and build completion.',
    canonicalPath: 'docs/ledgers/BUILD_LEDGER.md',
    aliases: [],
    sourcePath: 'docs/ledgers/BUILD_LEDGER.md',
    absolutePath: 'mock://nightraven-compass/docs/ledgers/BUILD_LEDGER.md',
    status: 'missing',
    monitorRole: 'build',
    usedByMonitor: true,
    requiredFor: ['build', 'detach'],
    precision: {
      changed: 'unknown',
      expected: 'unknown',
      claim: 'unknown',
      build: 'not_started',
      audit: 'not_required',
      blocking: false,
      nextAction: 'Create when an orchestrated build starts.',
      evidence: ['mock build ledger missing'],
    },
  },
]

const mockMonitor: ProjectMonitorSnapshot = {
  lifecycle: 'planned',
  lifecycleLabel: 'Planned',
  summary: 'Planned · mock project evidence loaded.',
  dimensions: [
    {
      id: 'scope',
      label: 'Scope',
      status: 'clear',
      detail: 'Mock scope is defined.',
      evidence: ['Mock data'],
    },
    {
      id: 'build',
      label: 'Build',
      status: 'watch',
      detail: 'Mock build evidence is not live.',
      evidence: ['Mock data'],
    },
    {
      id: 'audit',
      label: 'Audit',
      status: 'blocked',
      detail: 'Mock audit queue has pending items.',
      evidence: ['Mock data'],
    },
    {
      id: 'decisions',
      label: 'Decisions',
      status: 'watch',
      detail: 'Mock decisions remain open.',
      evidence: ['Mock data'],
    },
    {
      id: 'shippingDetach',
      label: 'Shipping / Detach',
      status: 'watch',
      detail: 'Mock project is not ready to detach.',
      evidence: ['Mock data'],
    },
    {
      id: 'memory',
      label: 'Memory',
      status: 'clear',
      detail: 'Mock handoff is present.',
      evidence: ['Mock data'],
    },
  ],
  activeFiles: mockFileCatalog,
  changedFiles: [],
  missingRequiredFiles: [],
  lastEvidenceSource: 'docs/14_SESSION_HANDOFF.md',
}

const mockNextMove: NextMove = {
  action: 'Review mock audit queue',
  targetAgent: 'User',
  prompt: 'Review the mock Compass audit queue, then switch to a registry project for live evidence.',
  reason: 'Mock data cannot prove real project progress.',
  requiredFiles: ['Project Handoff'],
  forbiddenFiles: ['Application source files'],
  approvalRequired: false,
  verification: 'Registry mode loads live project evidence.',
}

const mockEvolution: AppEvolutionSnapshot = {
  currentVersion: 'v0.3 Command Center Evolution Tracker',
  currentStage: 'Stage 4 - Build Toward Final Form',
  goal: 'Expose mockups, unfinished components, integrity gaps, and next-version planning in Compass.',
  corePromise: 'Compass points to the next correct step using evidence from project files and explicit user action.',
  lastUpdated: new Date().toISOString(),
  requiredScreens: ['Overview', 'Files', 'Settings', 'Evolution'],
  definitionOfDone: [
    'Required screens exist and route correctly.',
    'Mockup tracker has no unhandled critical item.',
    'Build and lint pass.',
  ],
  mockupItems: [
    {
      id: 'item-mock-fallback-data-path',
      name: 'Mock/Fallback Data Path',
      filePath: 'src/data/mockSnapshot.ts',
      currentStatus: 'Open',
      type: 'fake data',
      missing: 'Mock mode must stay clearly separated from live evidence.',
      finalForm: 'Mock data remains only as a labeled fallback/demo path.',
      priority: 'P1',
      dependencies: 'Vite API availability; snapshot error states.',
      checklist: ['Mock mode is clearly labeled everywhere.', 'No production claim depends on mock-only values.'],
    },
  ],
  integrityFindings: [
    {
      id: 'finding-mock-data-still-appears',
      title: 'Mock data still appears in fallback mode',
      severity: 'high',
      area: 'Data integrity',
      status: 'Open',
      requiredFix: 'Keep mock mode clearly labeled and remove direct mock imports over time.',
      evidence: 'Mock snapshot fallback is present.',
    },
  ],
  nextVersionTarget: 'v0.3 Command Center Evolution Tracker',
  upgradeThesis: 'This version turns Compass from a project monitor into a self-evolving app monitor.',
  versionDeltaGate: 'Evolution tracking is visible in the app from repo-tracked evidence files.',
  trackingFiles: [
    {
      name: 'Mockup Component Tracker',
      path: 'MOCKUP_COMPONENT_TRACKER.md',
      purpose: 'Track unfinished work.',
      status: 'present',
      lastUpdated: new Date().toISOString(),
    },
  ],
  changelogEntries: ['2026-07-02 - v0.3 - Evolution tracker setup'],
}

export function buildMockSnapshot(): ProjectSnapshot {
  return {
    registry: mockRegistry,
    project: mockProject,
    phases: mockPhases,
    tasks: mergeById(
      mockTasks,
      mockPhase2Tasks,
      mockPhase56Tasks,
      phase34SupplementalTasks,
      mockExtraTasks,
    ),
    decisions: mergeById(mockDecisions, phase34SupplementalDecisions, mockExtraDecisions),
    blockers: mergeById(mockBlockers, phase34SupplementalBlockers, mockExtraBlockers),
    notNowItems: mockNotNowItems,
    auditItems: mergeById(mockPhase56AuditItems, mockExtraAudits),
    promptCards: mergeById(mockPromptCards, phase34PromptCards),
    progress: mockPhase56Progress,
    memoryFeed: mockMemoryFeed,
    loopSignals: mockLoopSignals,
    doneCriteria: mockDoneCriteria,
    reports: mockReports,
    fileCatalog: mockFileCatalog,
    monitor: mockMonitor,
    nextMove: mockNextMove,
    evolution: mockEvolution,
    settings: mockSettingsProfile,
    meta: {
      projectPath: 'mock://nightraven-compass',
      handoffFound: true,
      overlayFound: false,
      artifactCount: 5,
      artifactTotal: 8,
      loadedAt: new Date().toISOString(),
    },
  }
}

/** Unified activity feed for Memory Feed page — mock entries plus live snapshot slices. */
export function buildActivityFeed(snapshot: ProjectSnapshot): MemoryFeedItem[] {
  const base = snapshot.memoryFeed
  const seen = new Set(base.map((item) => item.id))

  const extras: MemoryFeedItem[] = []

  for (const task of snapshot.tasks.filter((t) => t.lane === 'now' && t.state !== 'done').slice(0, 2)) {
    const id = `live-task-${task.id}`
    if (!seen.has(id)) {
      extras.push({
        id,
        date: snapshot.project.updatedAt,
        kind: 'task',
        title: task.title,
        source: task.id,
        text: `${task.state} in ${task.lane} lane — ${task.owner.replaceAll('_', ' ')}.`,
      })
    }
  }

  for (const decision of snapshot.decisions.filter((d) => d.status === 'open').slice(0, 2)) {
    const id = `live-decision-${decision.id}`
    if (!seen.has(id)) {
      extras.push({
        id,
        date: snapshot.project.updatedAt,
        kind: 'decision',
        title: decision.question.slice(0, 60),
        source: decision.id,
        text: `Open (${decision.impact} impact) — ${decision.recommendation ?? 'No recommendation yet.'}`,
      })
    }
  }

  return [...base, ...extras]
}
