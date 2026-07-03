import type { Phase, Project, PromptCard, Task } from '../types/project'
import type {
  CompassReport,
  CompassSettingsProfile,
  DoneCriterionStatus,
  LoopSignal,
  ProjectSnapshot,
} from '../types/snapshot'
import {
  generateAuditorPrompt,
  generateBuilderPrompt,
  generateNightRavenPrompt,
  generateResearchPrompt,
} from './promptGenerator'
import { normalizeAgentProfiles, normalizeAgentProviders } from './agentSettings'
import {
  calculateAuditProgress,
  calculateBuildProgress,
  calculateDecisionProgress,
} from './progress'
import { detectLoopThemes, detectProjectLoops } from './loopDetector'

function buildPromptCards(
  project: Project,
  phase: Phase,
  task: Task,
): PromptCard[] {
  return [
    {
      id: 'prompt-ge',
      projectId: project.id,
      taskId: task.id,
      target: 'nightraven',
      prompt: generateNightRavenPrompt(project, phase, task),
      requiredOutput: ['Scope verdict', 'Risks', 'Refined task', 'Next step'],
    },
    {
      id: 'prompt-builder',
      projectId: project.id,
      taskId: task.id,
      target: 'nightraven_builder',
      prompt: generateBuilderPrompt(project, phase, task),
      requiredOutput: ['Files changed', 'Criteria met', 'Next step'],
    },
    {
      id: 'prompt-auditor',
      projectId: project.id,
      taskId: task.id,
      target: 'nightraven_auditor',
      prompt: generateAuditorPrompt(project, phase, task),
      requiredOutput: ['Pass/Fix/Blocked', 'Findings', 'Can move forward'],
    },
    {
      id: 'prompt-research',
      projectId: project.id,
      taskId: task.id,
      target: 'research',
      prompt: generateResearchPrompt(project, phase, task),
      requiredOutput: ['Findings', 'Recommendation', 'Decision needed', 'Next step'],
    },
  ]
}

function buildDoneCriteria(phases: Phase[]): DoneCriterionStatus[] {
  const rows: DoneCriterionStatus[] = []
  for (const phase of phases) {
    for (const [index, criterion] of phase.doneCriteria.entries()) {
      const met =
        phase.status === 'done'
          ? 'met'
          : phase.status === 'active'
            ? index === 0
              ? 'partial'
              : 'open'
            : 'open'
      rows.push({
        id: `${phase.id}-criterion-${index}`,
        phaseId: phase.id,
        phaseName: phase.name,
        criterion,
        status: met,
        note:
          phase.status === 'active' && index === 0
            ? 'Active phase — first criterion in progress.'
            : undefined,
      })
    }
  }
  return rows
}

function buildLoopSignals(snapshot: ProjectSnapshot): LoopSignal[] {
  const warnings = detectProjectLoops(snapshot)
  const themes = detectLoopThemes(snapshot.memoryFeed)

  const fromWarnings: LoopSignal[] = warnings.map((warning) => ({
    id: warning.id,
    category:
      warning.category === 'decision'
        ? 'reopened_decision'
        : warning.category === 'future_phase'
          ? 'future_phase_work'
          : warning.category === 'planning_audit'
            ? 'planning_audit_loop'
            : 'shipping_stall',
    title: warning.title,
    detail: warning.detail,
    severity:
      warning.severity === 'critical'
        ? 'high'
        : warning.severity === 'high'
          ? 'high'
          : warning.severity === 'medium'
            ? 'medium'
            : 'low',
    count: 1,
    lastSeen: snapshot.project.updatedAt,
    evidence: [warning.detail],
  }))

  const fromThemes: LoopSignal[] = themes.slice(0, 3).map((theme) => ({
    id: `loop-theme-${theme.theme}`,
    category: 'planning_audit_loop' as const,
    title: `Repeated theme: "${theme.theme}"`,
    detail: `Appeared in ${theme.count} memory entries.`,
    severity: 'low' as const,
    count: theme.count,
    lastSeen: theme.sessions[theme.sessions.length - 1] ?? snapshot.project.updatedAt,
    evidence: theme.sessions,
  }))

  return [...fromWarnings, ...fromThemes]
}

function buildReports(snapshot: ProjectSnapshot): CompassReport[] {
  const reports: CompassReport[] = []
  const loadedAt = snapshot.meta.loadedAt

  if (snapshot.meta.handoffFound) {
    reports.push({
      id: 'report-handoff',
      title: 'Session handoff digest',
      kind: 'handoff',
      generatedAt: loadedAt,
      excerpt: `${snapshot.memoryFeed.length} recent session(s) parsed from NightRaven handoff.`,
      artifactPath: 'docs/14_SESSION_HANDOFF.md',
    })
  }

  if (snapshot.meta.overlayFound) {
    reports.push({
      id: 'report-overlay',
      title: 'Repo overlay boundary',
      kind: 'scope',
      generatedAt: loadedAt,
      excerpt: `${snapshot.notNowItems.length} Not Now / boundary item(s) from overlay.`,
      artifactPath: 'docs/NIGHTRAVEN_REPO_OVERLAY.md',
    })
  }

  reports.push({
    id: 'report-build-progress',
    title: 'Build progress snapshot',
    kind: 'build',
    generatedAt: loadedAt,
    excerpt: `${snapshot.tasks.filter((task) => task.state === 'done').length}/${snapshot.tasks.length} tasks done; ${snapshot.meta.artifactCount}/${snapshot.meta.artifactTotal} memory artifacts present.`,
  })

  const openAudits = snapshot.auditItems.filter((audit) => audit.status !== 'pass').length
  if (snapshot.auditItems.length > 0) {
    reports.push({
      id: 'report-audit-queue',
      title: 'Auditor queue status',
      kind: 'audit',
      generatedAt: loadedAt,
      excerpt: `${openAudits} audit item(s) need review before forward movement.`,
    })
  }

  if (snapshot.memoryFeed.length > 0) {
    reports.push({
      id: 'report-learning',
      title: 'Recent learning signals',
      kind: 'learning',
      generatedAt: loadedAt,
      excerpt: snapshot.memoryFeed[0]?.text.slice(0, 160) ?? 'No session text.',
      artifactPath: 'docs/04_LEARNING_LOG.md',
    })
  }

  return reports
}

export function enrichSnapshot(
  snapshot: ProjectSnapshot,
  dataMode: CompassSettingsProfile['dataMode'] = 'registry',
): ProjectSnapshot {
  const currentPhase =
    snapshot.phases.find((phase) => phase.id === snapshot.project.currentPhaseId) ??
    snapshot.phases[0]
  const nextTask =
    snapshot.tasks.find((task) => task.lane === 'now' && task.state !== 'done') ??
    snapshot.tasks.find((task) => task.lane === 'now') ??
    snapshot.tasks[0]

  const promptCards =
    nextTask && currentPhase
      ? buildPromptCards(snapshot.project, currentPhase, nextTask)
      : snapshot.promptCards

  const enriched: ProjectSnapshot = {
    ...snapshot,
    promptCards,
    doneCriteria:
      snapshot.doneCriteria.length > 0
        ? snapshot.doneCriteria
        : buildDoneCriteria(snapshot.phases),
    loopSignals:
      snapshot.loopSignals.length > 0
        ? snapshot.loopSignals
        : buildLoopSignals({ ...snapshot, promptCards }),
    reports:
      snapshot.reports.length > 0 ? snapshot.reports : buildReports({ ...snapshot, promptCards }),
    progress: {
      ...snapshot.progress,
      buildProgress: calculateBuildProgress(snapshot.tasks),
      auditProgress: calculateAuditProgress(snapshot.auditItems),
      decisionProgress: calculateDecisionProgress(snapshot.decisions),
    },
    settings: {
      dataMode,
      autoRefresh: snapshot.settings?.autoRefresh ?? true,
      showPhaseBadges: snapshot.settings?.showPhaseBadges ?? true,
      projectRootHint: snapshot.settings?.projectRootHint ?? snapshot.meta.projectPath,
      openAiApiKey: snapshot.settings?.openAiApiKey,
      claudeApiKey: snapshot.settings?.claudeApiKey,
      tokenVaultMode: 'browser_local',
      agentProviders: normalizeAgentProviders(snapshot.settings),
      agentProfiles: normalizeAgentProfiles(snapshot.settings),
    },
    meta: {
      ...snapshot.meta,
      loadedAt: new Date().toISOString(),
    },
  }

  return enriched
}
