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

type ClaimEvidence = {
  paths: Set<string>
  sourceLabels: string[]
  invalidSource?: string
}

type RunStatusEvidence = {
  present: boolean
  sourcePath?: string
  invalid: boolean
  total: number
  pending: number
  running: number
  passed: number
  failed: number
}

type LedgerEntry = {
  heading: string
  body: string
  text: string
  event?: string
}

type LedgerEvidence = {
  present: boolean
  entries: LedgerEntry[]
  latest?: LedgerEntry
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

function isContainedPath(projectRoot: string, targetPath: string): boolean {
  const relativePath = path.relative(projectRoot, targetPath)
  return relativePath === '' || (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  )
}

function isMissingPathError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error.code === 'ENOENT' || error.code === 'ENOTDIR'),
  )
}

export function resolveProjectSource(projectPath: string, relativePath: string) {
  const sourcePath = path.sep === '\\' ? normalizeRel(relativePath) : relativePath.replace(/^\.\//, '')
  const projectRoot = path.resolve(projectPath)
  const absolutePath = path.resolve(projectRoot, sourcePath)
  const invalidPath =
    relativePath.includes('\0') ||
    (path.win32.isAbsolute(relativePath) && !path.isAbsolute(relativePath)) ||
    !isContainedPath(projectRoot, absolutePath)
  if (invalidPath) {
    return { sourcePath, absolutePath, entryExists: false, contained: false }
  }

  try {
    const realProjectRoot = fs.realpathSync(projectRoot)
    try {
      fs.lstatSync(absolutePath)
    } catch (error) {
      if (!isMissingPathError(error)) {
        return { sourcePath, absolutePath, entryExists: true, contained: false }
      }
      let existingAncestor = path.dirname(absolutePath)
      while (isContainedPath(projectRoot, existingAncestor)) {
        try {
          const ancestorStat = fs.lstatSync(existingAncestor)
          let realAncestor: string
          try {
            realAncestor = fs.realpathSync(existingAncestor)
          } catch {
            void ancestorStat
            return { sourcePath, absolutePath, entryExists: true, contained: false }
          }
          if (!isContainedPath(realProjectRoot, realAncestor)) {
            return { sourcePath, absolutePath, entryExists: true, contained: false }
          }
          break
        } catch (ancestorError) {
          if (!isMissingPathError(ancestorError)) {
            return { sourcePath, absolutePath, entryExists: true, contained: false }
          }
          if (existingAncestor === projectRoot) break
          const parentPath = path.dirname(existingAncestor)
          if (parentPath === existingAncestor) break
          existingAncestor = parentPath
        }
      }
      return { sourcePath, absolutePath, entryExists: false, contained: false }
    }

    const realPath = fs.realpathSync(absolutePath)
    if (!isContainedPath(realProjectRoot, realPath)) {
      return { sourcePath, absolutePath, entryExists: true, contained: false }
    }
    return {
      sourcePath,
      absolutePath,
      entryExists: true,
      contained: true,
      realPath,
      stat: fs.statSync(realPath),
    }
  } catch {
    return { sourcePath, absolutePath, entryExists: true, contained: false }
  }
}

export function resolveFirstProjectSource(projectPath: string, candidates: string[]) {
  const resolved = candidates.map((candidate) => resolveProjectSource(projectPath, candidate))
  return resolved.find((candidate) => candidate.entryExists) ?? resolved[0]
}

function withResolvedProjectFile<T>(
  source: ReturnType<typeof resolveProjectSource>,
  operation: (descriptor: number, stat: fs.Stats) => T,
): T | null {
  if (!source.entryExists || !source.contained || !source.realPath || !source.stat?.isFile()) return null
  let descriptor: number | undefined
  try {
    descriptor = fs.openSync(source.realPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0))
    const openedStat = fs.fstatSync(descriptor)
    if (!openedStat.isFile() || openedStat.dev !== source.stat.dev || openedStat.ino !== source.stat.ino) return null
    return operation(descriptor, openedStat)
  } catch {
    return null
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor)
  }
}

export function inspectResolvedProjectFile(source: ReturnType<typeof resolveProjectSource>): fs.Stats | null {
  return withResolvedProjectFile(source, (_descriptor, stat) => stat)
}

export function readResolvedProjectFile(
  source: ReturnType<typeof resolveProjectSource>,
): { content: string; stat: fs.Stats } | null {
  return withResolvedProjectFile(source, (descriptor, stat) => ({
    content: fs.readFileSync(descriptor, 'utf8'),
    stat,
  }))
}

export function readResolvedProjectSource(source: ReturnType<typeof resolveProjectSource>): string | null {
  return readResolvedProjectFile(source)?.content ?? null
}

function normalizeClaimPath(projectPath: string, value: string): string | undefined {
  const claimPath = value.trim()
  if (!claimPath || claimPath.includes('\0')) return undefined
  if (path.win32.isAbsolute(claimPath) && !path.isAbsolute(claimPath)) return undefined

  const normalized = normalizeRel(claimPath)
  if (!path.isAbsolute(claimPath) && normalized.split('/').some((segment) => segment === '..')) return undefined

  const projectRoot = path.resolve(projectPath)
  const absolutePath = path.isAbsolute(claimPath) ? path.resolve(claimPath) : path.resolve(projectRoot, normalized)
  const relativePath = path.relative(projectRoot, absolutePath)
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    return undefined
  }

  let existingPath = absolutePath
  while (!fs.existsSync(existingPath)) {
    try {
      fs.lstatSync(existingPath)
      return undefined
    } catch {
      const parentPath = path.dirname(existingPath)
      if (parentPath === existingPath) return undefined
      existingPath = parentPath
    }
  }

  try {
    const realProjectRoot = fs.realpathSync(projectRoot)
    const realExistingPath = fs.realpathSync(existingPath)
    const realRelativePath = path.relative(realProjectRoot, realExistingPath)
    if (realRelativePath === '..' || realRelativePath.startsWith(`..${path.sep}`) || path.isAbsolute(realRelativePath)) {
      return undefined
    }
  } catch {
    return undefined
  }

  return normalizeRel(relativePath)
}

function catalogId(value: string): string {
  return normalizeRel(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function readTextSafe(projectPath: string, relativePath: string): string {
  const source = resolveProjectSource(projectPath, relativePath)
  return readResolvedProjectSource(source) ?? ''
}

function resolveCatalogPath(projectPath: string, definition: CatalogDefinition) {
  const candidates = [definition.canonicalPath, ...(definition.aliases ?? [])]
  const resolved = resolveFirstProjectSource(projectPath, candidates)
  const descriptorStat = definition.type === 'file' ? inspectResolvedProjectFile(resolved) : null
  const metadataStat = descriptorStat ?? resolved.stat
  const expectedType = definition.type === 'file' ? Boolean(descriptorStat) : metadataStat?.isDirectory()
  const present = resolved.entryExists && resolved.contained && expectedType
  return {
    sourcePath: resolved.sourcePath,
    absolutePath: resolved.absolutePath,
    status: present ? 'present' as const : 'missing' as const,
    lastUpdated: present ? metadataStat?.mtime.toISOString() : undefined,
    sizeBytes: present && descriptorStat ? descriptorStat.size : undefined,
    invalidSource: resolved.entryExists && (!resolved.contained || !expectedType),
  }
}

function parseGitChanges(projectPath: string): Map<string, GitChange> {
  try {
    const output = execFileSync('git', ['-C', projectPath, 'status', '--porcelain=v1', '-z'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const changes = new Map<string, GitChange>()
    const entries = output.split('\0')
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]
      if (!entry) continue
      const code = entry.slice(0, 2).trim() || 'modified'
      const sourcePath = path.sep === '\\' ? normalizeRel(entry.slice(3)) : entry.slice(3).replace(/^\.\//, '')
      changes.set(sourcePath, { sourcePath, code })
      if (code.includes('R') || code.includes('C')) index += 1
    }
    return changes
  } catch {
    return new Map()
  }
}

function isActiveClaimStatus(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return undefined
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, '')
  if (['released', 'release', 'done', 'complete', 'completed', 'closed', 'inactive'].includes(normalized)) {
    return false
  }
  if (['claimed', 'claim', 'active', 'running', 'inprogress'].includes(normalized)) return true
  return undefined
}

function objectPathValue(value: Record<string, unknown>): string | undefined {
  const candidates = ['path', 'file', 'sourcePath', 'targetPath', 'relativePath']
  for (const candidate of candidates) {
    const item = value[candidate]
    if (typeof item === 'string' && item.trim()) return item
  }
  return undefined
}

function objectActiveClaimState(value: Record<string, unknown>): boolean | undefined {
  const candidates = ['action', 'status', 'state']
  for (const candidate of candidates) {
    const state = isActiveClaimStatus(value[candidate])
    if (state !== undefined) return state
  }
  return undefined
}

function collectJsonClaims(value: unknown, projectPath: string, paths: Set<string>, assumeActive = false): void {
  if (typeof value === 'string') {
    const claimPath = assumeActive ? normalizeClaimPath(projectPath, value) : undefined
    if (claimPath) paths.add(claimPath)
    return
  }
  if (!value || typeof value !== 'object') return

  if (Array.isArray(value)) {
    const latest = new Map<string, boolean>()
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        collectJsonClaims(item, projectPath, paths, assumeActive)
        continue
      }
      const object = item as Record<string, unknown>
      const claimPath = objectPathValue(object)
      const active = objectActiveClaimState(object)
      const normalizedClaimPath = claimPath ? normalizeClaimPath(projectPath, claimPath) : undefined
      if (claimPath) {
        if (normalizedClaimPath && (active !== undefined || assumeActive)) {
          latest.set(normalizedClaimPath, active ?? true)
        }
        continue
      }
      collectJsonClaims(item, projectPath, paths, assumeActive)
    }
    for (const [claimPath, active] of latest) {
      if (active) paths.add(claimPath)
    }
    return
  }

  const object = value as Record<string, unknown>
  const claimPath = objectPathValue(object)
  const active = objectActiveClaimState(object)
  const normalizedClaimPath = claimPath ? normalizeClaimPath(projectPath, claimPath) : undefined
  if (claimPath) {
    if (normalizedClaimPath && (active !== undefined || assumeActive) && (active ?? true)) {
      paths.add(normalizedClaimPath)
    }
    return
  }

  for (const [key, nested] of Object.entries(object)) {
    const directState = isActiveClaimStatus(nested)
    const keyedClaimPath = normalizeClaimPath(projectPath, key)
    const keyLooksLikePath = assumeActive || key.includes('/') || key.includes('\\') || /\.[A-Za-z0-9_-]+$/.test(key)
    if (keyLooksLikePath && keyedClaimPath) {
      if (directState === false || nested === null) continue
      if (directState === true) {
        paths.add(keyedClaimPath)
        continue
      }
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const nestedState = objectActiveClaimState(nested as Record<string, unknown>)
        if (nestedState === false) continue
        if (nestedState === true) {
          paths.add(keyedClaimPath)
          continue
        }
      }
      if (assumeActive) paths.add(keyedClaimPath)
      continue
    }
    const childIsCurrentClaimSet = /^(?:claims|activeClaims|files|paths)$/i.test(key)
    collectJsonClaims(nested, projectPath, paths, assumeActive || childIsCurrentClaimSet)
  }
}

function hasUnsupportedClaimArrayMember(value: unknown, projectPath: string): boolean {
  if (!Array.isArray(value)) return false
  return value.some((item) => {
    if (typeof item === 'string') return item.trim().length === 0
    if (Array.isArray(item)) return hasUnsupportedClaimArrayMember(item, projectPath)
    if (item === null || typeof item !== 'object') return true
    const claimPath = objectPathValue(item as Record<string, unknown>)
    return claimPath === undefined || normalizeClaimPath(projectPath, claimPath) === undefined
  })
}

function hasUnsafeClaimPath(value: unknown, projectPath: string, assumeActive = false): boolean {
  if (typeof value === 'string') return assumeActive && normalizeClaimPath(projectPath, value) === undefined
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some((item) => hasUnsafeClaimPath(item, projectPath, assumeActive))

  const object = value as Record<string, unknown>
  const claimPath = objectPathValue(object)
  if (claimPath) return normalizeClaimPath(projectPath, claimPath) === undefined

  return Object.entries(object).some(([key, nested]) => {
    const childIsCurrentClaimSet = /^(?:claims|activeClaims|files|paths)$/i.test(key)
    const keyLooksLikePath = assumeActive || key.includes('/') || key.includes('\\') || /\.[A-Za-z0-9_-]+$/.test(key)
    if (keyLooksLikePath && normalizeClaimPath(projectPath, key) === undefined) return true
    return hasUnsafeClaimPath(nested, projectPath, assumeActive || childIsCurrentClaimSet)
  })
}

function isPathlessClaimRecord(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const object = value as Record<string, unknown>
  if (objectPathValue(object)) return false
  return Object.keys(object).some((key) =>
    /^(?:path|file|sourcePath|targetPath|relativePath|action|status|state|owner|stream|streamId|agent|reason|claimedAt|releasedAt|timestamp)$/i.test(key),
  )
}

function parseJsonClaimEvidence(projectPath: string): ClaimEvidence {
  const sourcePath = '.nightraven/file-claims.json'
  const source = resolveProjectSource(projectPath, sourcePath)
  if (source.entryExists && !source.contained) {
    return { paths: new Set(), sourceLabels: [sourcePath], invalidSource: sourcePath }
  }
  const content = readTextSafe(projectPath, '.nightraven/file-claims.json')
  const paths = new Set<string>()
  if (!content.trim()) return { paths, sourceLabels: [sourcePath], invalidSource: sourcePath }
  try {
    const parsed = JSON.parse(content) as unknown
    const parsedObject =
      parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : undefined
    const currentSetEntries = parsedObject
      ? Object.entries(parsedObject).filter(([key]) => /^(?:claims|activeClaims|files|paths)$/i.test(key))
      : []
    const unsupportedCollection = currentSetEntries.some(([, value]) =>
      value === null ||
      !['string', 'object'].includes(typeof value) ||
      isPathlessClaimRecord(value) ||
      (typeof value === 'object' && !Array.isArray(value) && objectPathValue(value as Record<string, unknown>) !== undefined &&
        normalizeClaimPath(projectPath, objectPathValue(value as Record<string, unknown>) ?? '') === undefined),
    )
    const unsupportedArrayMember =
      (Array.isArray(parsed) && hasUnsupportedClaimArrayMember(parsed, projectPath)) ||
      currentSetEntries.some(([, value]) => hasUnsupportedClaimArrayMember(value, projectPath))
    const unsafeClaimPath = hasUnsafeClaimPath(parsed, projectPath, Array.isArray(parsed))
    const recognizedObject =
      parsedObject &&
      Object.keys(parsedObject).some((key) =>
        /^(?:claims|activeClaims|files|paths)$/i.test(key) || key.includes('/') || key.includes('\\') || /\.[A-Za-z0-9_-]+$/.test(key),
      )
    if (unsupportedCollection || unsupportedArrayMember || unsafeClaimPath || (!Array.isArray(parsed) && !recognizedObject)) {
      return { paths, sourceLabels: [sourcePath], invalidSource: sourcePath }
    }
    collectJsonClaims(parsed, projectPath, paths, Array.isArray(parsed))
    return { paths, sourceLabels: paths.size > 0 ? [sourcePath] : [] }
  } catch {
    return { paths, sourceLabels: [sourcePath], invalidSource: sourcePath }
  }
}

function parseClaimLogEvidence(projectPath: string): ClaimEvidence {
  const sourcePath = 'AGENT_WORK_LOG.md'
  const source = resolveProjectSource(projectPath, sourcePath)
  if (source.entryExists && !source.contained) {
    return { paths: new Set(), sourceLabels: [sourcePath], invalidSource: sourcePath }
  }
  const content = readTextSafe(projectPath, 'AGENT_WORK_LOG.md')
  const paths = new Set<string>()
  if (!content.trim()) return { paths, sourceLabels: [] }

  const activeOwners = new Map<string, string>()
  const claimLine = /^- \[(CLAIMED|RELEASED)\] `([^`]+)` — stream:([^\s—]+) — ([^\s—]+)(?: — (.*))?$/
  for (const line of content.split('\n')) {
    const match = line.match(claimLine)
    if (!match) continue
    const claimPath = normalizeClaimPath(projectPath, match[2])
    if (!claimPath) continue
    const streamId = match[3]
    if (match[1] === 'CLAIMED') {
      activeOwners.set(claimPath, streamId)
    } else if (activeOwners.get(claimPath) === streamId) {
      activeOwners.delete(claimPath)
    }
  }
  for (const claimPath of activeOwners.keys()) paths.add(claimPath)

  return { paths, sourceLabels: paths.size > 0 ? ['AGENT_WORK_LOG.md'] : [] }
}

function buildClaimEvidence(projectPath: string): ClaimEvidence {
  if (resolveProjectSource(projectPath, '.nightraven/file-claims.json').entryExists) {
    return parseJsonClaimEvidence(projectPath)
  }
  return parseClaimLogEvidence(projectPath)
}

function normalizeRunState(value: string): keyof Pick<RunStatusEvidence, 'pending' | 'running' | 'passed' | 'failed'> | undefined {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'pending' || normalized === 'running' || normalized === 'passed' || normalized === 'failed') return normalized
  return undefined
}

export function parseRunStatusEvidence(projectPath: string): RunStatusEvidence {
  const source = resolveFirstProjectSource(projectPath, ['docs/PARALLEL_RUN_STATUS.md', 'PARALLEL_RUN_STATUS.md'])
  const sourcePath = source.entryExists ? source.sourcePath : undefined
  const evidence: RunStatusEvidence = {
    present: Boolean(sourcePath),
    sourcePath,
    invalid: source.entryExists && !source.contained,
    total: 0,
    pending: 0,
    running: 0,
    passed: 0,
    failed: 0,
  }
  if (!sourcePath) return evidence

  const content = readTextSafe(projectPath, sourcePath)
  const rowPattern = /^\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/
  const separatorCell = /^:?-{3,}:?$/
  const recognizedHeaders = new Set([
    'stream|division|phase|state|detail',
    'stream|agent|scope|status|notes',
  ])
  let recognizedHeader = false
  let recognizedSeparator = false
  let recognizedCurrentState = false
  let recognizedEmptyState = false

  if (!content.trim()) evidence.invalid = true
  for (const line of content.split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) continue
    const row = line.trim().match(rowPattern)
    if (!row) {
      evidence.invalid = true
      continue
    }

    const cells = row.slice(1).map((cell) => cell.trim())
    const [stream, , , stateCell] = cells
    const headerKey = cells.map((cell) => cell.toLowerCase()).join('|')
    if (recognizedHeaders.has(headerKey)) {
      if (recognizedHeader || recognizedSeparator || recognizedCurrentState || recognizedEmptyState) evidence.invalid = true
      recognizedHeader = true
      continue
    }
    if (cells.every((cell) => separatorCell.test(cell))) {
      if (!recognizedHeader || recognizedSeparator || recognizedCurrentState || recognizedEmptyState) evidence.invalid = true
      recognizedSeparator = true
      continue
    }
    if (!recognizedHeader || !recognizedSeparator) evidence.invalid = true
    const canonicalEmptyRow =
      cells[0] === '—' &&
      cells[1] === '—' &&
      cells[2] === '—' &&
      cells[3] === '—' &&
      cells[4].toLowerCase() === 'no streams run yet'
    if (canonicalEmptyRow) {
      if (recognizedEmptyState || recognizedCurrentState) evidence.invalid = true
      recognizedEmptyState = true
      continue
    }

    const state = normalizeRunState(stateCell)
    if (!stream || !state) {
      evidence.invalid = true
      continue
    }
    if (recognizedEmptyState) evidence.invalid = true
    recognizedCurrentState = true
    evidence.total += 1
    evidence[state] += 1
  }
  if (!recognizedHeader || !recognizedSeparator || (!recognizedCurrentState && !recognizedEmptyState)) evidence.invalid = true
  return evidence
}

function parseLedgerEvidence(content: string): LedgerEvidence {
  const headingPattern = /^## \[[^\]]+\] .+$/gm
  const matches = [...content.matchAll(headingPattern)]
  const entries = matches.map((match, index) => {
    const start = match.index ?? 0
    const end = matches[index + 1]?.index ?? content.length
    const text = content.slice(start, end).trim()
    const [heading = '', ...bodyLines] = text.split('\n')
    const body = bodyLines.join('\n')
    const event = bodyLines.find((line) => line.startsWith('- Event:'))?.replace('- Event:', '').trim()
    return { heading: heading.replace(/^## /, ''), body, text, event }
  })
  return { present: content.trim().length > 0, entries, latest: entries.at(-1) }
}

function normalizeLedgerPathCandidate(value: string): string {
  const trimmed = value.trim()
  const unwrapped =
    (trimmed.startsWith('`') && trimmed.endsWith('`')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed
  return normalizeRel(unwrapped).trim()
}

type AuditPathOutcome = 'pass' | 'fail' | 'pending'

function auditOutcomeForPath(entry: LedgerEntry, sourcePath: string): AuditPathOutcome | undefined {
  const normalizedPath = normalizeRel(sourcePath).trim()
  let outcome: AuditPathOutcome | undefined
  for (const rawLine of entry.text.split('\n')) {
    const line = rawLine.replaceAll('\\', '/')
    const findings = line.match(/^- Findings:\s*(.*)$/i)
    if (!findings) continue
    for (const clause of findings[1].split(';')) {
      const qualified = normalizeLedgerPathCandidate(clause).match(
        /^(pass(?:ed)?|fail(?:ed)?|blocked|fix_needed|scope_creep|needs_user_decision|pending|in_progress|fixed|verified|audited|reviewed)\s+(.+)$/i,
      )
      if (!qualified || normalizeLedgerPathCandidate(qualified[2]) !== normalizedPath) continue
      if (/^(?:pending|in_progress)$/i.test(qualified[1])) outcome = 'pending'
      else if (/^(?:fail(?:ed)?|blocked|fix_needed|scope_creep|needs_user_decision)$/i.test(qualified[1])) outcome = 'fail'
      else outcome = 'pass'
    }
  }
  return outcome
}

function ledgerEntryMentionsPath(entry: LedgerEntry, sourcePath: string): boolean {
  const normalizedPath = normalizeRel(sourcePath).trim()
  if (auditOutcomeForPath(entry, sourcePath)) return true

  for (const rawLine of entry.text.split('\n')) {
    const line = rawLine.replaceAll('\\', '/')
    const field = line.match(/^- ([^:]+):\s*(.*)$/)
    if (!field) continue
    const fieldName = field[1].trim().toLowerCase()
    const isFileList = /^(?:files? (?:created|modified|changed|deleted|audited|reviewed)|paths?|targets?|scope)$/.test(fieldName)
    for (const clause of field[2].split(';')) {
      const candidate = normalizeLedgerPathCandidate(clause)
      if (isFileList) {
        if (candidate === normalizedPath) return true
      }
    }
  }
  return false
}

function latestLedgerEntryForPath(evidence: LedgerEvidence, sourcePath: string): LedgerEntry | undefined {
  for (const entry of [...evidence.entries].reverse()) {
    if (ledgerEntryMentionsPath(entry, sourcePath)) return entry
  }
  return undefined
}

function ledgerEntryIsActiveBuild(entry: LedgerEntry | undefined): boolean {
  if (!entry) return false
  if (entry.event && ['BuildStarted', 'BuildRunning'].includes(entry.event)) return true
  return /running|in progress/i.test(entry.text) && !ledgerEntryIsCompleteBuild(entry)
}

function ledgerEntryIsCompleteBuild(entry: LedgerEntry | undefined): boolean {
  if (!entry) return false
  if (entry.event && ['FeatureBuilt', 'BuildCompleted'].includes(entry.event)) return true
  return /completed|complete|done|passed/i.test(entry.text)
}

function ledgerEntryIsFailedAudit(entry: LedgerEntry | undefined): boolean {
  if (!entry) return false
  const findings = entry.body
    .split('\n')
    .filter((line) => /^- Findings:/i.test(line))
    .map((line) => line.replace(/^- Findings:\s*/i, ''))
    .flatMap((value) => value.split(';'))
    .map((value) => value.trim())
  const failureToken = /\b(?:fail(?:ed|ures?)?|fix_needed|blocked|scope_creep|needs_user_decision)\b/i
  const fullyNegatedFailure = /^(?:no|zero|without)\s+(?:(?:critical|high|medium|low|remaining|unresolved|known|browser|runtime|test|tests|build|audit|verification|monitor|blocking)\s+){0,6}(?:fail(?:ed|ures?)?|fix_needed|blocked|scope_creep|needs_user_decision)$/i
  return findings.some((finding) => failureToken.test(finding) && !fullyNegatedFailure.test(finding))
}

function ledgerEntryIsPendingAudit(entry: LedgerEntry | undefined): boolean {
  if (!entry) return false
  if (entry.event === 'AuditStarted') return true
  return !entry.event && /\bpending\b|\bin_progress\b/i.test(entry.text)
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
  buildLedgerEvidence: LedgerEvidence
  auditLedgerEvidence: LedgerEvidence
  claimEvidence: ClaimEvidence
  runStatusEvidence: RunStatusEvidence
  invalidSource?: boolean
}): FilePrecisionState {
  const changed = args.gitChanges.has(args.sourcePath) ? 'yes' : 'no'
  const expected = changed === 'yes' ? pathIsExpected(args.sourcePath, args.tasks, args.knownMonitorFile) : 'unknown'
  const invalidClaimEvidence = args.claimEvidence.invalidSource === args.sourcePath
  const claim = args.claimEvidence.paths.has(args.sourcePath) || invalidClaimEvidence ? 'claimed' : 'unclaimed'
  const latestBuildForFile = latestLedgerEntryForPath(args.buildLedgerEvidence, args.sourcePath)
  const latestAuditForFile = latestLedgerEntryForPath(args.auditLedgerEvidence, args.sourcePath)
  const buildLedgerMentionsFile = Boolean(latestBuildForFile)
  const auditLedgerMentionsFile = Boolean(latestAuditForFile)
  const pathAuditOutcome = latestAuditForFile
    ? auditOutcomeForPath(latestAuditForFile, args.sourcePath)
    : undefined
  const auditLooksFailed = pathAuditOutcome
    ? pathAuditOutcome === 'fail'
    : ledgerEntryIsFailedAudit(latestAuditForFile ?? args.auditLedgerEvidence.latest)
  const auditLooksPending = pathAuditOutcome
    ? pathAuditOutcome === 'pending'
    : ledgerEntryIsPendingAudit(latestAuditForFile)
  const currentRunActive = args.runStatusEvidence.running > 0 || args.runStatusEvidence.pending > 0
  const currentRunFailed = args.runStatusEvidence.failed > 0
  const currentRunInvalid = args.runStatusEvidence.invalid
  const latestBuildEntry = changed === 'yes'
    ? latestBuildForFile
    : latestBuildForFile ?? args.buildLedgerEvidence.latest
  const buildLooksActive = ledgerEntryIsActiveBuild(latestBuildEntry)
  const buildLooksComplete = ledgerEntryIsCompleteBuild(latestBuildEntry)
  const isRunStatusFile = args.runStatusEvidence.sourcePath === args.sourcePath
  const runStatus: FilePrecisionState['runStatus'] = !isRunStatusFile
    ? undefined
    : currentRunInvalid
      ? 'invalid'
      : currentRunFailed
        ? 'failed'
        : currentRunActive
          ? 'active'
          : args.runStatusEvidence.passed > 0
            ? 'passed'
            : 'empty'

  let build: FilePrecisionState['build'] = 'not_required'
  if (isRunStatusFile && currentRunActive) {
    build = 'planned'
  } else if (isRunStatusFile && args.runStatusEvidence.passed > 0 && !currentRunFailed) {
    build = 'built'
  } else if (changed === 'yes') {
    build = buildLooksActive ? 'planned' : buildLooksComplete ? 'built' : 'changed'
  } else if (args.exists && args.monitorRole === 'build') {
    build = args.buildLedgerEvidence.present ? (buildLooksActive ? 'planned' : 'built') : 'not_started'
  }

  let audit: FilePrecisionState['audit'] = 'not_required'
  if (args.invalidSource) {
    audit = 'fail'
  } else if (isRunStatusFile && (currentRunFailed || currentRunInvalid)) {
    audit = 'fail'
  } else if (changed === 'yes' && args.monitorRole !== 'memory') {
    audit = auditLedgerMentionsFile ? (auditLooksPending ? 'required' : auditLooksFailed ? 'fail' : 'pass') : 'required'
  } else if (args.monitorRole === 'audit') {
    audit = args.auditLedgerEvidence.present ? (auditLooksFailed ? 'fail' : 'pass') : 'pending'
  }

  const blocking = args.invalidSource || expected === 'no' || claim === 'claimed' || audit === 'required' || audit === 'fail'
  const evidence = [
    changed === 'yes' ? `git status: ${args.gitChanges.get(args.sourcePath)?.code ?? 'changed'}` : 'git status: clean for this path',
    args.invalidSource ? 'monitored evidence source resolves outside the project, is broken, or has the wrong type' : undefined,
    invalidClaimEvidence
      ? 'canonical claim evidence is blank, malformed, or uses an unsupported shape'
      : claim === 'claimed'
      ? `active claim found in ${args.claimEvidence.sourceLabels.join(', ')}`
      : 'no active claim evidence for this path',
    isRunStatusFile
      ? currentRunInvalid
        ? 'current run-status evidence is blank, malformed, or uses an unsupported stream state'
        : `${args.runStatusEvidence.total} run stream(s): ${args.runStatusEvidence.running} running, ${args.runStatusEvidence.failed} failed, ${args.runStatusEvidence.passed} passed`
      : undefined,
    buildLedgerMentionsFile ? 'build ledger mentions this path' : undefined,
    auditLedgerMentionsFile ? 'audit ledger mentions this path' : undefined,
    !buildLedgerMentionsFile && args.buildLedgerEvidence.latest
      ? `latest build ledger event: ${args.buildLedgerEvidence.latest.event ?? args.buildLedgerEvidence.latest.heading}`
      : undefined,
    !auditLedgerMentionsFile && args.auditLedgerEvidence.latest
      ? `latest audit ledger event: ${args.auditLedgerEvidence.latest.event ?? args.auditLedgerEvidence.latest.heading}`
      : undefined,
  ].filter((item): item is string => Boolean(item))

  let nextAction = 'No action needed.'
  if (args.invalidSource) nextAction = 'Replace the invalid evidence source with the expected file or folder inside this project.'
  else if (invalidClaimEvidence) nextAction = 'Repair the canonical claim evidence before marking done.'
  else if (claim === 'claimed') nextAction = 'Release or resolve the active file claim.'
  else if (isRunStatusFile && currentRunInvalid) nextAction = 'Repair the current run-status evidence before marking done.'
  else if (!args.exists) nextAction = 'Create or attach this file if required for the current lifecycle.'
  else if (expected === 'no') nextAction = 'Review this unexpected change before forward progress.'
  else if (audit === 'required') nextAction = 'Audit this changed file before marking done.'
  else if (audit === 'fail') nextAction = 'Fix the failed audit finding for this file.'
  else if (changed === 'yes') nextAction = 'Confirm this changed file is recorded in build evidence.'

  return { changed, expected, claim, build, audit, runStatus, blocking, nextAction, evidence }
}

export function buildProjectFileCatalog(projectPath: string, context?: Partial<MonitorContext>): FileCatalogEntry[] {
  const gitChanges = parseGitChanges(projectPath)
  const buildLedgerEvidence = parseLedgerEvidence(readTextSafe(projectPath, 'docs/ledgers/BUILD_LEDGER.md'))
  const auditLedgerEvidence = parseLedgerEvidence(readTextSafe(projectPath, 'docs/ledgers/AUDIT_LEDGER.md'))
  const claimEvidence = buildClaimEvidence(projectPath)
  const runStatusEvidence = parseRunStatusEvidence(projectPath)
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
        buildLedgerEvidence,
        auditLedgerEvidence,
        claimEvidence,
        runStatusEvidence,
        invalidSource: resolved.invalidSource,
      }),
    })
  }

  for (const change of gitChanges.values()) {
    if (seen.has(change.sourcePath)) continue
    if (change.sourcePath.startsWith('node_modules/') || change.sourcePath.startsWith('dist/')) continue
    seen.add(change.sourcePath)
    const resolved = resolveProjectSource(projectPath, change.sourcePath)
    const exists = resolved.entryExists && resolved.contained
    const stat = exists ? resolved.stat : undefined
    entries.push({
      id: `changed-${catalogId(change.sourcePath)}`,
      name: path.basename(change.sourcePath),
      type: stat?.isDirectory() ? 'folder' : 'file',
      purpose: 'Changed project file detected by git status; verify it belongs to the current task.',
      canonicalPath: change.sourcePath,
      aliases: [],
      sourcePath: change.sourcePath,
      absolutePath: resolved.absolutePath,
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
        buildLedgerEvidence,
        auditLedgerEvidence,
        claimEvidence,
        runStatusEvidence,
        invalidSource: resolved.entryExists && !resolved.contained,
      }),
    })
  }

  for (const sourcePath of [...claimEvidence.paths].sort()) {
    if (seen.has(sourcePath)) continue
    const safeSourcePath = normalizeClaimPath(projectPath, sourcePath)
    if (!safeSourcePath) continue
    seen.add(sourcePath)
    const absolutePath = path.resolve(projectPath, safeSourcePath)
    const exists = fs.existsSync(absolutePath)
    const stat = exists ? fs.lstatSync(absolutePath) : null
    entries.push({
      id: `claimed:${safeSourcePath}`,
      name: path.basename(safeSourcePath),
      type: stat?.isDirectory() ? 'folder' : 'file',
      purpose: 'Project file with an active ownership claim; resolve or release it before detach.',
      canonicalPath: safeSourcePath,
      aliases: [],
      sourcePath: safeSourcePath,
      absolutePath,
      status: exists ? 'present' : 'missing',
      lastUpdated: stat?.mtime.toISOString(),
      sizeBytes: stat?.isFile() ? stat.size : undefined,
      monitorRole: 'source',
      usedByMonitor: true,
      requiredFor: ['build', 'detach'],
      precision: buildPrecision({
        projectPath,
        sourcePath: safeSourcePath,
        monitorRole: 'source',
        exists,
        gitChanges,
        tasks,
        knownMonitorFile: false,
        buildLedgerEvidence,
        auditLedgerEvidence,
        claimEvidence,
        runStatusEvidence,
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
  const handoffTimestamp = handoff?.lastUpdated ? new Date(handoff.lastUpdated).getTime() : Number.NaN
  const staleHandoff =
    handoff?.lastUpdated !== undefined &&
    (!Number.isFinite(handoffTimestamp) || Date.now() - handoffTimestamp > 7 * 24 * 60 * 60 * 1000)
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
  const failedRunStatus = fileCatalog.some(
    (entry) => entry.monitorRole === 'run' && entry.precision.runStatus === 'failed',
  )
  const invalidRunStatus = fileCatalog.some(
    (entry) => entry.monitorRole === 'run' && entry.precision.runStatus === 'invalid',
  )
  const blockedRunStatus = failedRunStatus || invalidRunStatus
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
    blockedRunStatus ? 'failed' : activeBuild ? 'watch' : changedFiles.length > 0 ? 'watch' : buildEvidence ? 'clear' : 'missing'
  const auditStatus: MonitorDimension['status'] =
    failedAudit ? 'failed' : pendingAudit ? 'blocked' : auditPassed ? 'clear' : 'missing'
  const decisionStatus: MonitorDimension['status'] = openHighDecision ? 'watch' : 'clear'
  const detachReady =
    changedFiles.length === 0 &&
    missingRequiredFiles.length === 0 &&
    !staleHandoff &&
    !pendingAudit &&
    !failedAudit &&
    !activeClaim &&
    !activeBuild &&
    context.handoffFound &&
    context.overlayFound &&
    !openCriticalBlocker
  const detachStatus: MonitorDimension['status'] = detachReady ? 'ready' : openCriticalBlocker ? 'blocked' : 'watch'

  let lifecycle: MonitorLifecycle = 'attached'
  if (missingRequiredFiles.length === 0 && context.handoffFound && context.overlayFound) lifecycle = 'aligned'
  if (context.tasks.length > 0 && lifecycle === 'aligned') lifecycle = 'planned'
  if (!openHighDecision && !openCriticalBlocker && lifecycle === 'planned') lifecycle = 'ready_to_build'
  if (activeBuild) lifecycle = 'in_build'
  if (changedFiles.length > 0 && !activeBuild) lifecycle = 'built'
  if (pendingAudit) lifecycle = 'in_audit'
  if (blockedRunStatus || failedAudit || openCriticalBlocker || blockingFiles.some((entry) => entry.precision.expected === 'no')) {
    lifecycle = 'fix_needed'
  }
  if ((missingRequiredFiles.length > 0 || !context.overlayFound) && lifecycle !== 'fix_needed') {
    lifecycle = 'attached'
  }
  if (detachReady) lifecycle = 'ready_to_detach'

  const dimensions = [
    dimension('scope', 'Scope', scopeStatus, scopeDetail, [
      context.overlayFound ? 'Project overlay found' : 'Project overlay missing',
      `${missingRequiredFiles.length} required attach/align file(s) missing`,
    ]),
    dimension('build', 'Build', buildStatus, invalidRunStatus ? 'Current run status evidence is invalid and must be repaired.' : failedRunStatus ? 'Current run status has failed stream evidence.' : changedFiles.length > 0 ? `${changedFiles.length} changed file(s) detected.` : 'No changed files detected by git status.', [
      buildEvidence ? 'Build ledger present' : 'No build ledger present',
      `${changedFiles.length} changed file(s)`,
      invalidRunStatus ? 'Run status evidence is invalid' : failedRunStatus ? 'Run status reports failed stream(s)' : activeBuild ? 'Run status reports active stream(s)' : 'No active run status detected',
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
      activeBuild ? 'Active run/build evidence detected' : 'No active run/build evidence detected',
      openCriticalBlocker ? 'Open high/critical blocker detected' : 'No high/critical blocker detected',
    ]),
    dimension('memory', 'Memory', memoryStatus, !context.handoffFound ? 'Project handoff is missing.' : staleHandoff && !Number.isFinite(handoffTimestamp) ? 'Project handoff freshness evidence is invalid and must be repaired before detach.' : staleHandoff ? 'Project handoff is stale and must be refreshed before detach.' : 'Project handoff is fresh enough for monitor use.', [
      context.handoffFound ? 'Project handoff found' : 'Project handoff missing',
      staleHandoff && !Number.isFinite(handoffTimestamp) ? 'Handoff freshness evidence is invalid' : staleHandoff ? 'Handoff freshness gate blocks detach' : 'Handoff freshness gate clear',
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
