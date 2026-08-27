import type {
  AuditItem,
  Blocker,
  Decision,
  NotNowItem,
  Phase,
  ProgressSnapshot,
  Project,
  PromptCard,
  Task,
} from './project'

export type RegistryEntry = {
  path: string
  label: string
  role: string
  available: boolean
}

export type MemoryFeedKind = 'task' | 'decision' | 'audit' | 'blocker' | 'session'

export type MemoryFeedItem = {
  id: string
  date: string
  text: string
  kind: MemoryFeedKind
  title: string
  source?: string
}

export type LoopCategory =
  | 'reopened_decision'
  | 'future_phase_work'
  | 'planning_audit_loop'
  | 'shipping_stall'

export type LoopSignal = {
  id: string
  category: LoopCategory
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
  count: number
  lastSeen: string
  evidence: string[]
}

export type DoneCriterionStatus = {
  id: string
  phaseId: string
  phaseName: string
  criterion: string
  status: 'met' | 'partial' | 'open'
  note?: string
}

export type CompassReport = {
  id: string
  title: string
  kind: 'build' | 'audit' | 'handoff' | 'learning' | 'scope'
  generatedAt: string
  excerpt: string
  artifactPath?: string
}

export type FileCatalogStatus = 'present' | 'missing'
export type FileCatalogType = 'file' | 'folder'
export type FileCatalogRequirement = 'attach' | 'align' | 'build' | 'audit' | 'detach'
export type FileCatalogMonitorRole =
  | 'memory'
  | 'scope'
  | 'plan'
  | 'build'
  | 'audit'
  | 'run'
  | 'attachment'
  | 'source'
  | 'unknown'

export type FilePrecisionState = {
  changed: 'yes' | 'no' | 'unknown'
  expected: 'yes' | 'no' | 'unknown'
  claim: 'unclaimed' | 'claimed' | 'conflict' | 'unknown'
  build: 'not_required' | 'not_started' | 'planned' | 'changed' | 'built'
  audit: 'not_required' | 'required' | 'pending' | 'pass' | 'fail'
  runStatus?: 'empty' | 'active' | 'passed' | 'failed' | 'invalid'
  blocking: boolean
  nextAction: string
  evidence: string[]
}

export type FileCatalogEntry = {
  id: string
  name: string
  type: FileCatalogType
  purpose: string
  canonicalPath: string
  aliases: string[]
  sourcePath: string
  absolutePath: string
  status: FileCatalogStatus
  lastUpdated?: string
  sizeBytes?: number
  monitorRole: FileCatalogMonitorRole
  usedByMonitor: boolean
  requiredFor: FileCatalogRequirement[]
  precision: FilePrecisionState
}

export type MonitorLifecycle =
  | 'unregistered'
  | 'attached'
  | 'aligned'
  | 'planned'
  | 'ready_to_build'
  | 'in_build'
  | 'built'
  | 'in_audit'
  | 'fix_needed'
  | 'ready_to_detach'
  | 'detached'
  | 'archived'

export type MonitorDimensionStatus =
  | 'clear'
  | 'watch'
  | 'blocked'
  | 'failed'
  | 'ready'
  | 'detached'
  | 'missing'

export type MonitorDimension = {
  id: 'scope' | 'build' | 'audit' | 'decisions' | 'shippingDetach' | 'memory'
  label: string
  status: MonitorDimensionStatus
  detail: string
  evidence: string[]
}

export type NextMoveTarget =
  | 'Codex'
  | 'Claude'
  | 'Gemini'
  | 'Antigravity'
  | 'Cursor'
  | 'LM Studio'
  | 'User'

export type NextMove = {
  action: string
  targetAgent: NextMoveTarget
  prompt: string
  reason: string
  requiredFiles: string[]
  forbiddenFiles: string[]
  approvalRequired: boolean
  verification: string
}

export type AgentProviderId = 'openai' | 'claude' | 'github' | 'local' | 'custom'

export type AgentCredentialStatus =
  | 'not_configured'
  | 'stored_local'
  | 'format_warning'
  | 'checked_local'

export type AgentProviderCredential = {
  id: AgentProviderId
  label: string
  token?: string
  endpoint?: string
  modelHint?: string
  status: AgentCredentialStatus
  lastCheckedAt?: string
}

export type AgentPermission =
  | 'explain_status'
  | 'summarize_evidence'
  | 'draft_prompts'
  | 'read_project_files'
  | 'open_project_paths'

export type AgentProfile = {
  id: string
  name: string
  providerId: AgentProviderId
  model: string
  role: string
  purpose: string
  permissions: AgentPermission[]
  enabled: boolean
}

export type EvolutionTrackingFile = {
  name: string
  path: string
  purpose: string
  status: FileCatalogStatus
  lastUpdated?: string
}

export type EvolutionTrackerItemType =
  | 'mockup'
  | 'placeholder'
  | 'unfinished'
  | 'disconnected'
  | 'fake data'
  | 'broken'
  | 'production-ready'

export type EvolutionPriority = 'P0' | 'P1' | 'P2' | 'P3'

export type EvolutionTrackerItem = {
  id: string
  name: string
  filePath: string
  currentStatus: string
  type: EvolutionTrackerItemType
  missing: string
  finalForm: string
  priority: EvolutionPriority
  dependencies: string
  checklist: string[]
}

export type EvolutionIntegrityFinding = {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  area: string
  status: string
  requiredFix: string
  evidence: string
}

export type AppEvolutionSnapshot = {
  currentVersion: string
  currentStage: string
  goal: string
  corePromise: string
  lastUpdated: string
  requiredScreens: string[]
  definitionOfDone: string[]
  mockupItems: EvolutionTrackerItem[]
  integrityFindings: EvolutionIntegrityFinding[]
  nextVersionTarget: string
  upgradeThesis: string
  versionDeltaGate: string
  trackingFiles: EvolutionTrackingFile[]
  changelogEntries: string[]
}

export type ProjectMonitorSnapshot = {
  lifecycle: MonitorLifecycle
  lifecycleLabel: string
  summary: string
  blockingReason?: string
  dimensions: MonitorDimension[]
  activeFiles: FileCatalogEntry[]
  changedFiles: FileCatalogEntry[]
  missingRequiredFiles: FileCatalogEntry[]
  lastEvidenceSource: string
}

export type CompassSettingsProfile = {
  dataMode: 'mock' | 'local' | 'registry'
  autoRefresh: boolean
  showPhaseBadges: boolean
  projectRootHint: string
  openAiApiKey?: string
  claudeApiKey?: string
  tokenVaultMode?: 'browser_local'
  agentProviders?: AgentProviderCredential[]
  agentProfiles?: AgentProfile[]
}

export type RefreshStatus = {
  state: 'idle' | 'watching' | 'refreshing' | 'updated'
  lastRefreshedAt?: string
  lastChangeDetectedAt?: string
  lastSnapshotVersion?: string
}

export type ProjectSnapshot = {
  registry: RegistryEntry[]
  project: Project
  phases: Phase[]
  tasks: Task[]
  decisions: Decision[]
  blockers: Blocker[]
  notNowItems: NotNowItem[]
  auditItems: AuditItem[]
  promptCards: PromptCard[]
  progress: ProgressSnapshot
  memoryFeed: MemoryFeedItem[]
  loopSignals: LoopSignal[]
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

export type CompassData = {
  snapshot: ProjectSnapshot
  nextTask: Task
  currentPhase: Phase
}

export function selectCompassData(snapshot: ProjectSnapshot): CompassData {
  const currentPhase =
    snapshot.phases.find((phase) => phase.id === snapshot.project.currentPhaseId) ??
    snapshot.phases[0]
  const nextTask =
    snapshot.tasks.find((task) => task.lane === 'now' && task.state !== 'done') ??
    snapshot.tasks.find((task) => task.lane === 'now') ??
    snapshot.tasks[0]

  return { snapshot, nextTask, currentPhase }
}
