import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { AuditItem, Blocker, Decision, Task } from '../src/types/project'
import type {
  FileCatalogEntry,
  FileCatalogMonitorRole,
  FileCatalogRequirement,
  FileCatalogType,
  FilePrecisionState,
  MonitorDimension,
  MonitorLifecycle,
  NextMove,
  ProjectMonitorSnapshot,
} from '../src/types/snapshot'

type CatalogDefinition = {
  name: string
  type: FileCatalogType
  purpose: string
  canonicalPath: string
  aliases?: string[]
  monitorRole: FileCatalogMonitorRole
  requiredFor: FileCatalogRequirement[]
  usedByMonitor: boolean
}

type MonitorContext = {
  handoffFound: boolean
  overlayFound: boolean
  tasks: Task[]
  blockers: Blocker[]
  decisions: Decision[]
  auditItems: AuditItem[]
}

type GitChange = {
  sourcePath: string
  code: string
}

const catalogDefinitions: CatalogDefinition[] = [
  {
    name: 'Agent Instructions',
    type: 'file',
    purpose: 'Project-specific instructions for coding agents before they act.',
    canonicalPath: 'AGENTS.md',
    monitorRole: 'memory',
    requiredFor: ['attach', 'align'],
    usedByMonitor: true,
  },
  {
    name: 'Project Handoff',
    type: 'file',
    purpose: 'Current state, recent sessions, guardrails, and next safest step.',
    canonicalPath: 'docs/PROJECT_HANDOFF.md',
    aliases: ['docs/14_SESSION_HANDOFF.md'],
    monitorRole: 'memory',
    requiredFor: ['align', 'detach'],
    usedByMonitor: true,
  },
  {
    name: 'Project Overlay',
    type: 'file',
    purpose: 'Local vocabulary, project boundaries, and NightRaven disambiguation.',
    canonicalPath: 'docs/NIGHTRAVEN_REPO_OVERLAY.md',
    monitorRole: 'scope',
    requiredFor: ['align'],
    usedByMonitor: true,
  },
  {
    name: 'Project Scope',
    type: 'file',
    purpose: 'Scope, Not Now boundaries, and work that is intentionally excluded.',
    canonicalPath: 'docs/PROJECT_SCOPE.md',
    monitorRole: 'scope',
    requiredFor: ['align'],
    usedByMonitor: true,
  },
  {
    name: 'Project Roadmap',
    type: 'file',
    purpose: 'Phases, build order, and forward plan for the attached project.',
    canonicalPath: 'docs/PROJECT_ROADMAP.md',
    aliases: ['docs/NIGHTRAVEN_ROADMAP.md'],
    monitorRole: 'plan',
    requiredFor: ['align', 'build'],
    usedByMonitor: true,
  },
  {
    name: 'Project Decisions',
    type: 'file',
    purpose: 'Open, decided, and superseded decisions that affect forward progress.',
    canonicalPath: 'docs/PROJECT_DECISIONS.md',
    monitorRole: 'scope',
    requiredFor: ['align'],
    usedByMonitor: true,
  },
  {
    name: 'Project Changelog',
    type: 'file',
    purpose: 'Append-only engineering history and shipped changes.',
    canonicalPath: 'docs/PROJECT_CHANGELOG.md',
    aliases: ['docs/02_ENGINEERING_CHANGELOG.md'],
    monitorRole: 'memory',
    requiredFor: ['detach'],
    usedByMonitor: true,
  },
  {
    name: 'Project Learning',
    type: 'file',
    purpose: 'Reusable lessons and patterns discovered during the project.',
    canonicalPath: 'docs/PROJECT_LEARNING.md',
    aliases: ['docs/04_LEARNING_LOG.md'],
    monitorRole: 'memory',
    requiredFor: ['detach'],
    usedByMonitor: true,
  },
  {
    name: 'Build Ledger',
    type: 'file',
    purpose: 'Append-only evidence of build starts, file changes, and build completion.',
    canonicalPath: 'docs/ledgers/BUILD_LEDGER.md',
    monitorRole: 'build',
    requiredFor: ['build', 'detach'],
    usedByMonitor: true,
  },
  {
    name: 'Audit Ledger',
    type: 'file',
    purpose: 'Append-only evidence of audit checks, findings, and pass/fail gates.',
    canonicalPath: 'docs/ledgers/AUDIT_LEDGER.md',
    monitorRole: 'audit',
    requiredFor: ['audit', 'detach'],
    usedByMonitor: true,
  },
  {
    name: 'Run Status',
    type: 'file',
    purpose: 'Current orchestrator run state and stream status.',
    canonicalPath: 'docs/PARALLEL_RUN_STATUS.md',
    aliases: ['PARALLEL_RUN_STATUS.md'],
    monitorRole: 'run',
    requiredFor: ['build', 'audit'],
    usedByMonitor: true,
  },
  {
    name: 'NightRaven Attachment Data',
    type: 'folder',
    purpose: 'Attachment metadata, run state, manifests, and file claims.',
    canonicalPath: '.nightraven',
    monitorRole: 'attachment',
    requiredFor: ['attach'],
    usedByMonitor: true,
  },
  {
    name: 'File Claims',
    type: 'file',
    purpose: 'Active file ownership and conflict evidence for one-file precision.',
    canonicalPath: '.nightraven/file-claims.json',
    aliases: ['AGENT_WORK_LOG.md'],
    monitorRole: 'attachment',
    requiredFor: ['build', 'detach'],
    usedByMonitor: true,
  },
  {
    name: 'Orchestration Manifest',
    type: 'file',
    purpose: 'Current NightRaven run manifest and allowed build streams.',
    canonicalPath: '.nightraven/manifest.yaml',
    aliases: ['.nightraven/manifest.yml'],
    monitorRole: 'plan',
    requiredFor: ['build'],
    usedByMonitor: true,
  },
  {
    name: 'Project Docs',
    type: 'folder',
    purpose: 'Project memory, reports, roadmaps, and evidence files.',
    canonicalPath: 'docs',
    monitorRole: 'memory',
    requiredFor: ['align'],
    usedByMonitor: true,
  },
  {
    name: 'Evidence Ledgers',
    type: 'folder',
    purpose: 'Append-only build and audit evidence used by the monitor.',
    canonicalPath: 'docs/ledgers',
    monitorRole: 'build',
    requiredFor: ['build', 'audit'],
    usedByMonitor: true,
  },
  {
    name: 'App Project State',
    type: 'file',
    purpose: 'Current Compass version, stage, blockers, risks, commands, and next action.',
    canonicalPath: 'PROJECT_STATE.md',
    aliases: ['apps/compass/PROJECT_STATE.md'],
    monitorRole: 'plan',
    requiredFor: ['align', 'build'],
    usedByMonitor: true,
  },
  {
    name: 'App Final Form Goal',
    type: 'file',
    purpose: 'Definition of what the current Compass version must become before completion.',
    canonicalPath: 'APP_FINAL_FORM_GOAL.md',
    aliases: ['apps/compass/APP_FINAL_FORM_GOAL.md'],
    monitorRole: 'plan',
    requiredFor: ['align', 'build'],
    usedByMonitor: true,
  },
  {
    name: 'Mockup Component Tracker',
    type: 'file',
    purpose: 'Tracker for mockups, placeholders, fake data, disconnected screens, and unfinished UI.',
    canonicalPath: 'MOCKUP_COMPONENT_TRACKER.md',
    aliases: ['apps/compass/MOCKUP_COMPONENT_TRACKER.md'],
    monitorRole: 'plan',
    requiredFor: ['build', 'audit'],
    usedByMonitor: true,
  },
  {
    name: 'App Integrity Report',
    type: 'file',
    purpose: 'Whole-app audit of bugs, weak flows, missing tests, persistence, security, and UX gaps.',
    canonicalPath: 'APP_INTEGRITY_REPORT.md',
    aliases: ['apps/compass/APP_INTEGRITY_REPORT.md'],
    monitorRole: 'audit',
    requiredFor: ['audit', 'detach'],
    usedByMonitor: true,
  },
  {
    name: 'Version Evolution Plan',
    type: 'file',
    purpose: 'Next major-version upgrade thesis, planned improvements, and version delta gate.',
    canonicalPath: 'VERSION_EVOLUTION_PLAN.md',
    aliases: ['apps/compass/VERSION_EVOLUTION_PLAN.md'],
    monitorRole: 'plan',
    requiredFor: ['build'],
    usedByMonitor: true,
  },
  {
    name: 'Evolution Changelog',
    type: 'file',
    purpose: 'Meaningful improvements made across Compass evolution cycles.',
    canonicalPath: 'CHANGELOG_EVOLUTION.md',
    aliases: ['apps/compass/CHANGELOG_EVOLUTION.md'],
    monitorRole: 'memory',
    requiredFor: ['detach'],
    usedByMonitor: true,
  },
]

function normalizeRel(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '')
}

function catalogId(value: string): string {
  return normalizeRel(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function readTextSafe(projectPath: string, relativePath: string): string {
  const full = path.join(projectPath, relativePath)
  if (!fs.existsSync(full)) return ''
  return fs.readFileSync(full, 'utf8')
}

function resolveCatalogPath(projectPath: string, definition: CatalogDefinition) {
  const candidates = [definition.canonicalPath, ...(definition.aliases ?? [])]
  const sourcePath =
    candidates.find((candidate) => fs.existsSync(path.join(projectPath, candidate))) ??
    definition.canonicalPath
  const absolutePath = path.resolve(projectPath, sourcePath)
  const exists = fs.existsSync(absolutePath)
  const stat = exists ? fs.statSync(absolutePath) : null
  return {
    sourcePath: normalizeRel(sourcePath),
    absolutePath,
    status: exists ? 'present' as const : 'missing' as const,
    lastUpdated: stat?.mtime.toISOString(),
    sizeBytes: stat?.isFile() ? stat.size : undefined,
  }
}

function parseGitChanges(projectPath: string): Map<string, GitChange> {
  try {
    const output = execFileSync('git', ['-C', projectPath, 'status', '--short'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const changes = new Map<string, GitChange>()
    for (const rawLine of output.split('\n')) {
      const line = rawLine.trimEnd()
      if (!line.trim()) continue
      const code = line.slice(0, 2).trim() || 'modified'
      const rawPath = line.slice(3).trim()
      const sourcePath = normalizeRel(rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1) ?? rawPath : rawPath)
      changes.set(sourcePath, { sourcePath, code })
    }
    return changes
  } catch {
    return new Map()
  }
}

function pathIsExpected(sourcePath: string, tasks: Task[], knownMonitorFile: boolean): FilePrecisionState['expected'] {
  if (knownMonitorFile) return 'yes'
  const activeTasks = tasks.filter((task) => task.lane === 'now' || task.state === 'build')
  if (activeTasks.length === 0) return 'unknown'
  const allowed = activeTasks.some((task) =>
    task.allowedAreas.some((area) => sourcePath.startsWith(normalizeRel(area))),
  )
  return allowed ? 'yes' : 'no'
}

function buildPrecision(args: {
  projectPath: string
  sourcePath: string
  monitorRole: FileCatalogMonitorRole
  exists: boolean
  gitChanges: Map<string, GitChange>
  tasks: Task[]
  knownMonitorFile: boolean
  buildLedgerText: string
  auditLedgerText: string
  claimText: string
}): FilePrecisionState {
  const changed = args.gitChanges.has(args.sourcePath) ? 'yes' : 'no'
  const expected = changed === 'yes' ? pathIsExpected(args.sourcePath, args.tasks, args.knownMonitorFile) : 'unknown'
  const claim = args.claimText.includes(args.sourcePath) ? 'claimed' : 'unclaimed'
  const buildLedgerMentionsFile = args.buildLedgerText.includes(args.sourcePath)
  const auditLedgerMentionsFile = args.auditLedgerText.includes(args.sourcePath)
  const auditLooksFailed = /fail|fix_needed|blocked|scope_creep/i.test(args.auditLedgerText)
  const buildLooksActive = /BuildStarted|running|in progress/i.test(args.buildLedgerText)
  const buildLooksComplete = /FeatureBuilt|BuildCompleted|completed|done/i.test(args.buildLedgerText)

  let build: FilePrecisionState['build'] = 'not_required'
  if (changed === 'yes') {
    build = buildLedgerMentionsFile || buildLooksComplete ? 'built' : buildLooksActive ? 'planned' : 'changed'
  } else if (args.exists && args.monitorRole === 'build') {
    build = args.buildLedgerText ? 'built' : 'not_started'
  }

  let audit: FilePrecisionState['audit'] = 'not_required'
  if (changed === 'yes' && args.monitorRole !== 'memory') {
    audit = auditLedgerMentionsFile ? (auditLooksFailed ? 'fail' : 'pass') : 'required'
  } else if (args.monitorRole === 'audit') {
    audit = args.auditLedgerText ? (auditLooksFailed ? 'fail' : 'pass') : 'pending'
  }

  const blocking = expected === 'no' || claim === 'claimed' || audit === 'required' || audit === 'fail'
  const evidence = [
    changed === 'yes' ? `git status: ${args.gitChanges.get(args.sourcePath)?.code ?? 'changed'}` : 'git status: clean for this path',
    claim === 'claimed' ? 'claim evidence mentions this path' : 'no active claim evidence for this path',
    buildLedgerMentionsFile ? 'build ledger mentions this path' : undefined,
    auditLedgerMentionsFile ? 'audit ledger mentions this path' : undefined,
  ].filter((item): item is string => Boolean(item))

  let nextAction = 'No action needed.'
  if (!args.exists) nextAction = 'Create or attach this file if required for the current lifecycle.'
  else if (expected === 'no') nextAction = 'Review this unexpected change before forward progress.'
  else if (audit === 'required') nextAction = 'Audit this changed file before marking done.'
  else if (audit === 'fail') nextAction = 'Fix the failed audit finding for this file.'
  else if (claim === 'claimed') nextAction = 'Release or resolve the active file claim.'
  else if (changed === 'yes') nextAction = 'Confirm this changed file is recorded in build evidence.'

  return { changed, expected, claim, build, audit, blocking, nextAction, evidence }
}

export function buildProjectFileCatalog(projectPath: string, context?: Partial<MonitorContext>): FileCatalogEntry[] {
  const gitChanges = parseGitChanges(projectPath)
  const buildLedgerText = readTextSafe(projectPath, 'docs/ledgers/BUILD_LEDGER.md')
  const auditLedgerText = readTextSafe(projectPath, 'docs/ledgers/AUDIT_LEDGER.md')
  const claimText = [
    readTextSafe(projectPath, '.nightraven/file-claims.json'),
    readTextSafe(projectPath, 'AGENT_WORK_LOG.md'),
  ].join('\n')
  const tasks = context?.tasks ?? []
  const entries: FileCatalogEntry[] = []
  const seen = new Set<string>()

  for (const definition of catalogDefinitions) {
    const resolved = resolveCatalogPath(projectPath, definition)
    const sourcePath = resolved.sourcePath
    seen.add(sourcePath)
    entries.push({
      id: catalogId(definition.canonicalPath),
      name: definition.name,
      type: definition.type,
      purpose: definition.purpose,
      canonicalPath: normalizeRel(definition.canonicalPath),
      aliases: (definition.aliases ?? []).map(normalizeRel),
      sourcePath,
      absolutePath: resolved.absolutePath,
      status: resolved.status,
      lastUpdated: resolved.lastUpdated,
      sizeBytes: resolved.sizeBytes,
      monitorRole: definition.monitorRole,
      usedByMonitor: definition.usedByMonitor,
      requiredFor: definition.requiredFor,
      precision: buildPrecision({
        projectPath,
        sourcePath,
        monitorRole: definition.monitorRole,
        exists: resolved.status === 'present',
        gitChanges,
        tasks,
        knownMonitorFile: true,
        buildLedgerText,
        auditLedgerText,
        claimText,
      }),
    })
  }

  for (const change of gitChanges.values()) {
    if (seen.has(change.sourcePath)) continue
    if (change.sourcePath.startsWith('node_modules/') || change.sourcePath.startsWith('dist/')) continue
    const absolutePath = path.resolve(projectPath, change.sourcePath)
    const exists = fs.existsSync(absolutePath)
    const stat = exists ? fs.statSync(absolutePath) : null
    entries.push({
      id: `changed-${catalogId(change.sourcePath)}`,
      name: path.basename(change.sourcePath),
      type: stat?.isDirectory() ? 'folder' : 'file',
      purpose: 'Changed project file detected by git status; verify it belongs to the current task.',
      canonicalPath: change.sourcePath,
      aliases: [],
      sourcePath: change.sourcePath,
      absolutePath,
      status: exists ? 'present' : 'missing',
      lastUpdated: stat?.mtime.toISOString(),
      sizeBytes: stat?.isFile() ? stat.size : undefined,
      monitorRole: 'source',
      usedByMonitor: true,
      requiredFor: ['build', 'audit'],
      precision: buildPrecision({
        projectPath,
        sourcePath: change.sourcePath,
        monitorRole: 'source',
        exists,
        gitChanges,
        tasks,
        knownMonitorFile: false,
        buildLedgerText,
        auditLedgerText,
        claimText,
      }),
    })
  }

  return entries.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'missing' ? -1 : 1
    if (a.precision.blocking !== b.precision.blocking) return a.precision.blocking ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function dimension(
  id: MonitorDimension['id'],
  label: string,
  status: MonitorDimension['status'],
  detail: string,
  evidence: string[],
): MonitorDimension {
  return { id, label, status, detail, evidence }
}

function lifecycleLabel(lifecycle: MonitorLifecycle): string {
  return lifecycle.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function buildProjectMonitorSnapshot(
  fileCatalog: FileCatalogEntry[],
  context: MonitorContext,
): ProjectMonitorSnapshot {
  const changedFiles = fileCatalog.filter((entry) => entry.precision.changed === 'yes')
  const missingRequiredFiles = fileCatalog.filter(
    (entry) => entry.status === 'missing' && entry.requiredFor.some((requirement) => requirement === 'align' || requirement === 'attach'),
  )
  const blockingFiles = fileCatalog.filter((entry) => entry.precision.blocking)
  const handoff = fileCatalog.find((entry) => entry.name === 'Project Handoff')
  const staleHandoff =
    handoff?.lastUpdated && Date.now() - new Date(handoff.lastUpdated).getTime() > 7 * 24 * 60 * 60 * 1000
  const openCriticalBlocker = context.blockers.some(
    (blocker) => blocker.status === 'open' && (blocker.severity === 'critical' || blocker.severity === 'high'),
  )
  const failedAudit =
    context.auditItems.some((audit) =>
      ['fix_needed', 'blocked', 'scope_creep', 'needs_user_decision'].includes(audit.status),
    ) || fileCatalog.some((entry) => entry.precision.audit === 'fail')
  const pendingAudit =
    context.auditItems.some((audit) => audit.status === 'pending') ||
    fileCatalog.some((entry) => entry.precision.audit === 'required' || entry.precision.audit === 'pending')
  const auditPassed =
    context.auditItems.length > 0 && context.auditItems.every((audit) => audit.status === 'pass')
  const activeClaim = fileCatalog.some((entry) => entry.precision.claim === 'claimed')
  const activeBuild = fileCatalog.some((entry) => entry.precision.build === 'planned')
  const buildEvidence = fileCatalog.some((entry) => entry.monitorRole === 'build' && entry.status === 'present')
  const openHighDecision = context.decisions.some(
    (decision) => decision.status === 'open' && decision.impact === 'high',
  )

  const memoryStatus: MonitorDimension['status'] = !context.handoffFound
    ? 'missing'
    : staleHandoff
      ? 'watch'
      : 'clear'
  const scopeStatus: MonitorDimension['status'] =
    missingRequiredFiles.length > 0 || !context.overlayFound ? 'blocked' : openHighDecision ? 'watch' : 'clear'
  const scopeDetail =
    missingRequiredFiles.length > 0
      ? `${missingRequiredFiles.length} required attach/align file(s) are missing.`
      : !context.overlayFound
        ? 'Project overlay is missing.'
        : openHighDecision
          ? 'A high-impact decision remains open.'
          : 'Scope evidence is present.'
  const buildStatus: MonitorDimension['status'] =
    activeBuild ? 'watch' : changedFiles.length > 0 ? 'watch' : buildEvidence ? 'clear' : 'missing'
  const auditStatus: MonitorDimension['status'] =
    failedAudit ? 'failed' : pendingAudit ? 'blocked' : auditPassed ? 'clear' : 'missing'
  const decisionStatus: MonitorDimension['status'] = openHighDecision ? 'watch' : 'clear'
  const detachReady =
    changedFiles.length === 0 &&
    !pendingAudit &&
    !failedAudit &&
    !activeClaim &&
    context.handoffFound &&
    !openCriticalBlocker
  const detachStatus: MonitorDimension['status'] = detachReady ? 'ready' : openCriticalBlocker ? 'blocked' : 'watch'

  let lifecycle: MonitorLifecycle = 'attached'
  if (missingRequiredFiles.length === 0 && context.handoffFound && context.overlayFound) lifecycle = 'aligned'
  if (context.tasks.length > 0 && lifecycle === 'aligned') lifecycle = 'planned'
  if (!openHighDecision && !openCriticalBlocker && lifecycle === 'planned') lifecycle = 'ready_to_build'
  if (activeBuild) lifecycle = 'in_build'
  if (changedFiles.length > 0 && !activeBuild) lifecycle = 'built'
  if (pendingAudit) lifecycle = 'in_audit'
  if (failedAudit || openCriticalBlocker || blockingFiles.some((entry) => entry.precision.expected === 'no')) {
    lifecycle = 'fix_needed'
  }
  if (detachReady) lifecycle = 'ready_to_detach'

  const dimensions = [
    dimension('scope', 'Scope', scopeStatus, scopeDetail, [
      context.overlayFound ? 'Project overlay found' : 'Project overlay missing',
      `${missingRequiredFiles.length} required attach/align file(s) missing`,
    ]),
    dimension('build', 'Build', buildStatus, changedFiles.length > 0 ? `${changedFiles.length} changed file(s) detected.` : 'No changed files detected by git status.', [
      buildEvidence ? 'Build ledger present' : 'No build ledger present',
      `${changedFiles.length} changed file(s)`,
    ]),
    dimension('audit', 'Audit', auditStatus, failedAudit ? 'Audit evidence is failing or blocked.' : pendingAudit ? 'Audit is required before done.' : 'No failing audit evidence.', [
      `${context.auditItems.length} audit item(s)`,
      `${fileCatalog.filter((entry) => entry.precision.audit === 'required').length} file(s) require audit`,
    ]),
    dimension('decisions', 'Decisions', decisionStatus, openHighDecision ? 'High-impact decision remains open.' : 'No high-impact open decision detected.', [
      `${context.decisions.filter((decision) => decision.status === 'open').length} open decision(s)`,
    ]),
    dimension('shippingDetach', 'Shipping / Detach', detachStatus, detachReady ? 'Detach gates are clear.' : 'Detach is blocked until evidence, audit, claims, and blockers are clear.', [
      activeClaim ? 'Active file claim detected' : 'No active file claims detected',
      openCriticalBlocker ? 'Open high/critical blocker detected' : 'No high/critical blocker detected',
    ]),
    dimension('memory', 'Memory', memoryStatus, !context.handoffFound ? 'Project handoff is missing.' : staleHandoff ? 'Project handoff is stale.' : 'Project handoff is fresh enough for monitor use.', [
      context.handoffFound ? 'Project handoff found' : 'Project handoff missing',
      handoff?.lastUpdated ? `Handoff updated ${handoff.lastUpdated}` : 'No handoff timestamp',
    ]),
  ]

  const firstBlocking = dimensions.find((item) => item.status === 'failed' || item.status === 'blocked')
  return {
    lifecycle,
    lifecycleLabel: lifecycleLabel(lifecycle),
    summary: `${lifecycleLabel(lifecycle)} · ${changedFiles.length} changed file(s), ${blockingFiles.length} blocking file state(s).`,
    blockingReason: firstBlocking?.detail,
    dimensions,
    activeFiles: fileCatalog.filter((entry) => entry.precision.changed === 'yes' || entry.precision.claim === 'claimed' || entry.precision.blocking).slice(0, 12),
    changedFiles,
    missingRequiredFiles,
    lastEvidenceSource: changedFiles[0]?.sourcePath ?? handoff?.sourcePath ?? 'project registry',
  }
}

export function buildNextMove(monitor: ProjectMonitorSnapshot): NextMove {
  const failedDimension = monitor.dimensions.find((item) => item.status === 'failed')
  const blockedDimension = monitor.dimensions.find((item) => item.status === 'blocked')

  if (failedDimension) {
    return {
      action: `Fix ${failedDimension.label.toLowerCase()} failure`,
      targetAgent: 'Codex',
      prompt: `Fix the NightRaven monitor blocker: ${failedDimension.detail}. Use the source evidence first, keep scope narrow, and report the files changed plus verification run.`,
      reason: failedDimension.detail,
      requiredFiles: failedDimension.evidence,
      forbiddenFiles: ['Unrelated files', 'Unapproved scope changes'],
      approvalRequired: true,
      verification: 'Failing dimension becomes clear or watch with source evidence.',
    }
  }

  if (blockedDimension) {
    const targetAgent = blockedDimension.id === 'audit' ? 'Codex' : 'User'
    return {
      action: `Clear ${blockedDimension.label.toLowerCase()} blocker`,
      targetAgent,
      prompt: `Resolve this NightRaven monitor blocker: ${blockedDimension.detail}. Cite the evidence source and update only the required project file or audit path.`,
      reason: blockedDimension.detail,
      requiredFiles: blockedDimension.evidence,
      forbiddenFiles: ['Unrelated implementation files'],
      approvalRequired: blockedDimension.id !== 'memory',
      verification: 'Blocking dimension no longer blocks forward progress.',
    }
  }

  if (monitor.lifecycle === 'ready_to_detach') {
    return {
      action: 'Prepare detach package',
      targetAgent: 'Codex',
      prompt: 'Create the final NightRaven detach report from the existing handoff, build evidence, audit evidence, and changelog. Do not edit application runtime code.',
      reason: 'Detach gates are clear.',
      requiredFiles: ['Project Handoff', 'Build Ledger', 'Audit Ledger', 'Project Changelog'],
      forbiddenFiles: ['Application source files unless explicitly requested'],
      approvalRequired: true,
      verification: 'Detach report exists and no active claims/blockers remain.',
    }
  }

  return {
    action: 'Review next changed file evidence',
    targetAgent: 'User',
    prompt: 'Review the changed-files view, confirm the changes belong to the current task, then send the generated audit or build prompt to the recommended agent.',
    reason: monitor.summary,
    requiredFiles: monitor.activeFiles.map((entry) => entry.sourcePath),
    forbiddenFiles: ['Unrelated project paths'],
    approvalRequired: false,
    verification: 'Next action is tied to a source file and monitor dimension.',
  }
}
