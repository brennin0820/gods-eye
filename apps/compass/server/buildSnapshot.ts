import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type {
  AuditItem,
  Blocker,
  Decision,
  NotNowItem,
  Phase,
  ProgressSnapshot,
  Project,
  Task,
} from '../src/types/project'
import type { CompassReport, ProjectSnapshot } from '../src/types/snapshot'
import { enrichSnapshot } from '../src/utils/enrichSnapshot'
import { buildEvolutionSnapshot, evolutionTrackingPaths } from './evolutionTracker'
import { parseHandoff, parseOverlayNotNow } from './parseHandoff'
import {
  buildNextMove,
  buildProjectFileCatalog,
  buildProjectMonitorSnapshot,
  inspectResolvedProjectFile,
  parseRunStatusEvidence,
  readResolvedProjectFile,
  resolveFirstProjectSource,
  resolveProjectSource,
} from './projectMonitor'
import type { RegistryEntry } from './types'

/** NightRaven memory files Compass watches for auto-refresh. */
export const MONITORED_ARTIFACTS = [
  'docs/37_NIGHTRAVEN.md',
  'docs/NIGHTRAVEN_REPO_OVERLAY.md',
  'docs/PROJECT_HANDOFF.md',
  'docs/14_SESSION_HANDOFF.md',
  'docs/PROJECT_CHANGELOG.md',
  'docs/02_ENGINEERING_CHANGELOG.md',
  'docs/PROJECT_LEARNING.md',
  'docs/04_LEARNING_LOG.md',
  'docs/PROJECT_SCOPE.md',
  'docs/PROJECT_ROADMAP.md',
  'docs/PROJECT_DECISIONS.md',
  'docs/PARALLEL_RUN_STATUS.md',
  'PARALLEL_RUN_STATUS.md',
  'docs/ledgers/BUILD_LEDGER.md',
  'docs/ledgers/AUDIT_LEDGER.md',
  '.nightraven/file-claims.json',
  '.nightraven/manifest.yaml',
  '.nightraven/manifest.yml',
  'AGENT_WORK_LOG.md',
  'AGENTS.md',
  '.cursor/rules/nightraven-context-intent.mdc',
  '.cursor/hooks.json',
  ...evolutionTrackingPaths,
  ...evolutionTrackingPaths.map((trackingPath) => `apps/compass/${trackingPath}`),
] as const

const ARTIFACTS = MONITORED_ARTIFACTS

function readFirstFileSafe(base: string, candidates: string[]) {
  const source = resolveFirstProjectSource(base, candidates)
  if (!source.entryExists || !source.contained || !source.realPath || !source.stat?.isFile()) return null
  const file = readResolvedProjectFile(source)
  if (!file) return null
  return {
    content: file.content,
    sourcePath: source.sourcePath,
    modifiedAt: file.stat.mtime.toISOString(),
  }
}

function readFileSafe(base: string, rel: string): string | null {
  return readFirstFileSafe(base, [rel])?.content ?? null
}

function countArtifacts(base: string): number {
  return ARTIFACTS.filter((rel) => {
    const source = resolveProjectSource(base, rel)
    return Boolean(inspectResolvedProjectFile(source))
  }).length
}

function parseGeneratedAt(value: string): string | undefined {
  const stamp = Date.parse(value)
  return Number.isNaN(stamp) ? undefined : new Date(stamp).toISOString()
}

function latestSection(content: string): { heading: string; body: string[] } | null {
  const matches = [...content.matchAll(/^## \[(.+?)\] (.+)$/gm)]
  const match = matches.at(-1)
  if (!match || match.index === undefined) return null
  const start = match.index + match[0].length
  const rest = content.slice(start)
  const nextIndex = rest.search(/^## \[/m)
  const body = (nextIndex >= 0 ? rest.slice(0, nextIndex) : rest)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  return { heading: match[2], body }
}

function buildArtifactReports(projectPath: string): CompassReport[] {
  const reports: CompassReport[] = []

  const statusSource = readFirstFileSafe(projectPath, ['docs/PARALLEL_RUN_STATUS.md', 'PARALLEL_RUN_STATUS.md'])
  if (statusSource) {
    const generatedMatch = statusSource.content.match(/^_Generated (.+?) by NightRaven Orchestrator\./m)
    const runStatus = parseRunStatusEvidence(projectPath)
    reports.push({
      id: 'report-parallel-run-status',
      title: 'Parallel run status',
      kind: 'build',
      generatedAt:
        parseGeneratedAt(generatedMatch?.[1] ?? '') ??
        statusSource.modifiedAt,
      excerpt: `${runStatus.total} stream row(s); ${runStatus.running} running; ${runStatus.failed} failed.${runStatus.invalid ? ' Evidence is invalid.' : ''}`,
      artifactPath: statusSource.sourcePath,
    })
  }

  const buildLedgerSource = readFirstFileSafe(projectPath, ['docs/ledgers/BUILD_LEDGER.md'])
  if (buildLedgerSource) {
    const latest = latestSection(buildLedgerSource.content)
    if (latest) {
      const event = latest.body.find((line) => line.startsWith('- Event:'))?.replace('- Event: ', '')
      const actions = latest.body
        .find((line) => line.startsWith('- Actions performed:'))
        ?.replace('- Actions performed: ', '')
      reports.push({
        id: 'report-build-ledger-latest',
        title: `Latest build ledger — ${latest.heading}`,
        kind: 'build',
        generatedAt: buildLedgerSource.modifiedAt,
        excerpt: [event, actions].filter(Boolean).join(' · ') || 'Latest build ledger entry available.',
        artifactPath: buildLedgerSource.sourcePath,
      })
    }
  }

  const auditLedgerSource = readFirstFileSafe(projectPath, ['docs/ledgers/AUDIT_LEDGER.md'])
  if (auditLedgerSource) {
    const latest = latestSection(auditLedgerSource.content)
    if (latest) {
      const event = latest.body.find((line) => line.startsWith('- Event:'))?.replace('- Event: ', '')
      const findings = latest.body.find((line) => line.startsWith('- Findings:'))?.replace('- Findings: ', '')
      reports.push({
        id: 'report-audit-ledger-latest',
        title: `Latest audit ledger — ${latest.heading}`,
        kind: 'audit',
        generatedAt: auditLedgerSource.modifiedAt,
        excerpt: [event, findings].filter(Boolean).join(' · ') || 'Latest audit ledger entry available.',
        artifactPath: auditLedgerSource.sourcePath,
      })
    }
  }

  return reports
}

/** Stable hash from monitored file mtimes — used for lightweight change detection. */
export function computeSnapshotVersion(projectPath: string): string {
  const parts: string[] = []
  for (const rel of MONITORED_ARTIFACTS) {
    const source = resolveProjectSource(projectPath, rel)
    const stat = inspectResolvedProjectFile(source)
    if (stat) {
      parts.push(`${rel}:${stat.mtimeMs}`)
    }
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16)
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function inferStatus(focus: string): Project['status'] {
  const lower = focus.toLowerCase()
  if (lower.includes('blocked')) return 'blocked'
  if (lower.includes('audit')) return 'auditing'
  if (lower.includes('shipped') || lower.includes('on `origin/main`')) return 'building'
  if (lower.includes('plan until code it') || lower.includes('scope defined')) return 'planning'
  return 'building'
}

function buildPhases(projectId: string, handoff: ReturnType<typeof parseHandoff>): Phase[] {
  return [
    {
      id: 'phase-memory',
      projectId,
      name: 'Memory & scope',
      goal: 'NightRaven chain wired; product scope clear.',
      order: 0,
      status: handoff.alreadyDoneCount > 5 ? 'done' : 'active',
      doneCriteria: ['Handoff exists', 'Overlay exists', 'Recent sessions updating'],
      notAllowedYet: ['Skip +# only on memory docs'],
    },
    {
      id: 'phase-build',
      projectId,
      name: 'Build',
      goal: 'Implement next approved task only.',
      order: 1,
      status: 'active',
      doneCriteria: handoff.nextItems.length > 0 ? handoff.nextItems : ['Define next task in handoff'],
      notAllowedYet: ['Scope creep', 'Cross-repo handoff bleed', 'Code before ship signal'],
    },
    {
      id: 'phase-ship',
      projectId,
      name: 'Ship & sync',
      goal: 'Always Sync — commit, push, Touch 3 AFTER.',
      order: 2,
      status: 'not_started',
      doneCriteria: ['Green build', 'Handoff appended', 'Remote up to date'],
      notAllowedYet: ['Local-only commits without note'],
    },
  ]
}

function buildTasksFromHandoff(
  projectId: string,
  label: string,
  handoff: ReturnType<typeof parseHandoff>,
): Task[] {
  const tasks: Task[] = []
  const nextItems = handoff.nextItems.length > 0 ? handoff.nextItems : ['Define next step in handoff **Next:** line']

  nextItems.forEach((item, index) => {
    tasks.push({
      id: `task-next-${index}`,
      projectId,
      phaseId: 'phase-build',
      title: item.length > 80 ? `${item.slice(0, 77)}…` : item,
      description: item,
      why: 'Parsed from handoff **Next:** — current correct step.',
      type: 'documentation',
      priority: index === 0 ? 'P0' : 'P1',
      lane: index === 0 ? 'now' : 'next',
      state: index === 0 ? 'build' : 'think',
      owner: item.toLowerCase().includes('audit') ? 'nightraven_auditor' : 'nightraven_builder',
      dependencies: [],
      acceptanceCriteria: ['Task completed per handoff intent', 'Scope preserved'],
      allowedAreas: ['docs/', 'src/', 'apps/'],
      notAllowedChanges: ['Do not expand scope without approval', 'Do not delete memory history'],
      auditRequired: true,
    })
  })

  handoff.recentSessions.slice(0, 5).forEach((session, index) => {
    tasks.push({
      id: `task-session-${index}`,
      projectId,
      phaseId: 'phase-memory',
      title: session.text.length > 72 ? `${session.text.slice(0, 69)}…` : session.text,
      description: session.text,
      why: 'Recent session — compounding memory.',
      type: 'documentation',
      priority: 'P2',
      lane: 'done',
      state: 'done',
      owner: 'nightraven',
      dependencies: [],
      acceptanceCriteria: ['Recorded in handoff'],
      allowedAreas: ['docs/14_SESSION_HANDOFF.md'],
      notAllowedChanges: ['-# on memory docs'],
      auditRequired: false,
    })
  })

  if (tasks.length === 0) {
    tasks.push({
      id: 'task-bootstrap',
      projectId,
      phaseId: 'phase-memory',
      title: `Bootstrap ${label}`,
      description: 'Add docs/14_SESSION_HANDOFF.md with Current state and **Next:** line.',
      why: 'Compass needs handoff to point forward.',
      type: 'documentation',
      priority: 'P0',
      lane: 'now',
      state: 'think',
      owner: 'nightraven',
      dependencies: [],
      acceptanceCriteria: ['Handoff file exists', 'Next line present'],
      allowedAreas: ['docs/'],
      notAllowedChanges: ['Feature code before scope'],
      auditRequired: false,
    })
  }

  return tasks
}

function buildNotNow(overlayLines: string[], projectId: string): NotNowItem[] {
  const defaults = [
    {
      title: 'Cross-repo memory bleed',
      reasonDelayed: 'Bible §2.6 — this repo only.',
      earliestPhaseAllowed: 'Never',
      riskIfBuiltTooEarly: 'Wrong handoff drives wrong work.',
      revisitCondition: 'Never — use overlay boundaries.',
    },
    {
      title: 'Code before ship signal',
      reasonDelayed: 'Bible §2.8 — plan until code it.',
      earliestPhaseAllowed: 'After explicit **code it**',
      riskIfBuiltTooEarly: 'Scope creep and wasted build cycles.',
      revisitCondition: 'Brent says **code it** / **implement** / **build**.',
    },
  ]

  const fromOverlay = overlayLines.map((line, index) => ({
    id: `notnow-overlay-${index}`,
    projectId,
    title: line.slice(0, 60),
    reasonDelayed: line,
    earliestPhaseAllowed: 'Per overlay',
    riskIfBuiltTooEarly: 'Boundary violation.',
    revisitCondition: 'Update overlay with Brent.',
  }))

  return [
    ...fromOverlay,
    ...defaults.map((item, index) => ({
      id: `notnow-default-${index}`,
      projectId,
      ...item,
    })),
  ]
}

function buildProgress(
  projectId: string,
  handoff: ReturnType<typeof parseHandoff>,
  artifactCount: number,
  tasks: Task[],
): ProgressSnapshot {
  const doneTasks = tasks.filter((task) => task.state === 'done').length
  const totalTasks = Math.max(tasks.length, 1)
  const artifactProgress = Math.round((artifactCount / ARTIFACTS.length) * 100)
  return {
    projectId,
    scopeProgress: Math.min(100, Math.max(artifactProgress, 40 + handoff.alreadyDoneCount * 2)),
    buildProgress: Math.round((doneTasks / totalTasks) * 100),
    auditProgress: 0,
    decisionProgress: handoff.nextItems.length > 0 ? 70 : 30,
    shippingProgress: handoff.focus.includes('origin/main') ? 60 : 20,
    learningProgress: Math.min(100, handoff.recentSessions.length * 12),
  }
}

export function loadRegistry(confPath: string, monorepoRoot: string): RegistryEntry[] {
  const entries: RegistryEntry[] = []
  const seen = new Set<string>()

  function addEntry(entryPath: string, label: string, role: string) {
    const normalized = path.normalize(entryPath)
    if (seen.has(normalized)) return
    seen.add(normalized)
    entries.push({
      path: normalized,
      label,
      role,
      available: fs.existsSync(normalized),
    })
  }

  if (fs.existsSync(confPath)) {
    const lines = fs.readFileSync(confPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [entryPath, label, role] = trimmed.split('|')
      if (entryPath && label) addEntry(entryPath, label, role ?? 'app')
    }
  }

  addEntry(monorepoRoot, 'NightRaven monorepo (framework)', 'framework')

  return entries
}

export function buildProjectSnapshot(
  projectPath: string,
  label: string,
  registry: RegistryEntry[],
): ProjectSnapshot {
  const projectId = slugify(label) || slugify(path.basename(projectPath))
  const handoffSource = readFirstFileSafe(projectPath, ['docs/PROJECT_HANDOFF.md', 'docs/14_SESSION_HANDOFF.md'])
  const handoffContent = handoffSource?.content ?? null
  const overlayContent = readFileSafe(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md')
  const handoff = parseHandoff(handoffContent ?? '')
  const overlayNotNow = overlayContent ? parseOverlayNotNow(overlayContent) : []

  const project: Project = {
    id: projectId,
    name: label,
    concept: handoff.focus,
    status: inferStatus(handoff.focus),
    currentPhaseId: 'phase-build',
    scopeLocked: true,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  const phases = buildPhases(projectId, handoff)
  const tasks = buildTasksFromHandoff(projectId, label, handoff)
  const notNowItems = buildNotNow(overlayNotNow, projectId)
  const _currentPhase = phases.find((phase) => phase.id === project.currentPhaseId) ?? phases[0]
  void _currentPhase
  const nextTask = tasks.find((task) => task.lane === 'now') ?? tasks[0]

  const auditItems: AuditItem[] = tasks
    .filter((task) => task.auditRequired && task.lane === 'now')
    .map((task, index) => ({
      id: `audit-${index}`,
      projectId,
      taskId: task.id,
      status: 'pending' as const,
      findings: [],
      requiredFixes: [],
      canMoveForward: false,
    }))

  const blockers: Blocker[] = []
  if (!handoffContent) {
    blockers.push({
      id: 'blocker-no-handoff',
      projectId,
      title: 'No handoff file',
      reason: 'Project handoff missing or unsafe — Compass cannot read project state.',
      severity: 'high',
      blockedTaskIds: tasks.map((task) => task.id),
      owner: 'nightraven',
      resolutionNeeded: 'Bootstrap NightRaven or add handoff.',
      status: 'open',
    })
  }

  if (handoff.nextItems.length === 0) {
    blockers.push({
      id: 'blocker-no-next',
      projectId,
      title: 'No **Next:** line in handoff',
      reason: 'Current state / focus should end with **Next:** items.',
      severity: 'medium',
      blockedTaskIds: nextTask ? [nextTask.id] : [],
      owner: 'nightraven',
      resolutionNeeded: 'Append **Next:** to handoff focus paragraph.',
      status: 'open',
    })
  }

  const decisions: Decision[] = [
    {
      id: 'decision-code-it',
      projectId,
      question: 'Has Brent given ship signal (**code it** / **implement** / **build**)?',
      options: ['Not yet — memory/plan only', 'Yes — implement scoped task'],
      recommendation: 'Default plan until explicit ship signal.',
      status: 'open',
      impact: 'high',
      unlocksTaskIds: tasks.filter((task) => task.state === 'build').map((task) => task.id),
    },
  ]

  const artifactCount = countArtifacts(projectPath)
  const artifactReports = buildArtifactReports(projectPath)
  const evolution = buildEvolutionSnapshot(projectPath)
  const fileCatalog = buildProjectFileCatalog(projectPath, {
    handoffFound: handoffContent !== null,
    overlayFound: overlayContent !== null,
    tasks,
    blockers,
    decisions,
    auditItems,
  })
  const monitor = buildProjectMonitorSnapshot(fileCatalog, {
    handoffFound: handoffContent !== null,
    overlayFound: overlayContent !== null,
    tasks,
    blockers,
    decisions,
    auditItems,
  })
  const nextMove = buildNextMove(monitor)

  const raw: ProjectSnapshot = {
    registry,
    project,
    phases,
    tasks,
    decisions,
    blockers,
    notNowItems,
    auditItems,
    promptCards: [],
    progress: buildProgress(projectId, handoff, artifactCount, tasks),
    memoryFeed: handoff.recentSessions.map((item, index) => ({
      ...item,
      kind: 'session' as const,
      title: item.text.slice(0, 72),
      source: handoffSource?.sourcePath ?? 'docs/PROJECT_HANDOFF.md',
      id: item.id || `session-${index}`,
    })),
    loopSignals: [],
    doneCriteria: [],
    reports: artifactReports,
    fileCatalog,
    monitor,
    nextMove,
    evolution,
    settings: {
      dataMode: 'registry',
      autoRefresh: true,
      showPhaseBadges: true,
      projectRootHint: projectPath,
      openAiApiKey: undefined,
      claudeApiKey: undefined,
      tokenVaultMode: 'browser_local',
      agentProviders: [],
      agentProfiles: [],
    },
    meta: {
      projectPath,
      handoffFound: handoffContent !== null,
      overlayFound: overlayContent !== null,
      artifactCount,
      artifactTotal: ARTIFACTS.length,
      snapshotVersion: computeSnapshotVersion(projectPath),
      loadedAt: new Date().toISOString(),
    },
  }

  return enrichSnapshot(raw, 'registry')
}
