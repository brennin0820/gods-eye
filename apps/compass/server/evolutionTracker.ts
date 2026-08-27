import type { Stats } from 'node:fs'
import type {
  AppEvolutionSnapshot,
  EvolutionIntegrityFinding,
  EvolutionTrackerItem,
  EvolutionTrackerItemType,
  EvolutionTrackingFile,
} from '../src/types/snapshot'
import { readResolvedProjectFile, resolveProjectSource } from './projectMonitor.ts'

type TrackingFileDefinition = {
  name: string
  path: string
  purpose: string
}

const trackingFileDefinitions: TrackingFileDefinition[] = [
  {
    name: 'Project State',
    path: 'PROJECT_STATE.md',
    purpose: 'Current version, stage, goal, blockers, risks, commands, and next action.',
  },
  {
    name: 'App Final Form Goal',
    path: 'APP_FINAL_FORM_GOAL.md',
    purpose: 'Definition of what the current version must become before it is complete.',
  },
  {
    name: 'Mockup Component Tracker',
    path: 'MOCKUP_COMPONENT_TRACKER.md',
    purpose: 'All mockups, placeholders, unfinished components, fake data, and incomplete flows.',
  },
  {
    name: 'App Integrity Report',
    path: 'APP_INTEGRITY_REPORT.md',
    purpose: 'System-level audit for bugs, weak flows, missing tests, data risks, and security gaps.',
  },
  {
    name: 'Version Evolution Plan',
    path: 'VERSION_EVOLUTION_PLAN.md',
    purpose: 'Next major-version plan and upgrade thesis.',
  },
  {
    name: 'Evolution Changelog',
    path: 'CHANGELOG_EVOLUTION.md',
    purpose: 'Meaningful improvements across app evolution cycles.',
  },
]

type EvolutionEvidence = {
  definition: TrackingFileDefinition
  sourcePath: string
  content: string
  stat: Stats | null
}

function evidencePath(prefix: string, relativePath: string): string {
  return prefix ? `${prefix}/${relativePath}` : relativePath
}

function hasTrackingEntries(projectPath: string, prefix: string): boolean {
  return trackingFileDefinitions.some((definition) =>
    resolveProjectSource(projectPath, evidencePath(prefix, definition.path)).entryExists,
  )
}

function resolveEvolutionPrefix(projectPath: string): string {
  if (hasTrackingEntries(projectPath, '')) return ''
  if (hasTrackingEntries(projectPath, 'apps/compass')) return 'apps/compass'
  return ''
}

function readEvolutionEvidence(
  projectPath: string,
  prefix: string,
  definition: TrackingFileDefinition,
): EvolutionEvidence {
  const sourcePath = evidencePath(prefix, definition.path)
  const file = readResolvedProjectFile(resolveProjectSource(projectPath, sourcePath))
  return {
    definition,
    sourcePath,
    content: file?.content ?? '',
    stat: file?.stat ?? null,
  }
}

function fileInfo(evidence: EvolutionEvidence): EvolutionTrackingFile {
  return {
    name: evidence.definition.name,
    path: evidence.sourcePath,
    purpose: evidence.definition.purpose,
    status: evidence.stat ? 'present' : 'missing',
    lastUpdated: evidence.stat?.mtime.toISOString(),
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function bulletValue(content: string, label: string): string {
  const match = content.match(new RegExp(`^- ${escapeRegExp(label)}:\\s*(.+)$`, 'im'))
  return match?.[1]?.trim() ?? ''
}

function headingSection(content: string, heading: string): string {
  const match = content.match(new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'im'))
  if (!match || match.index === undefined) return ''
  const start = match.index + match[0].length
  const rest = content.slice(start)
  const nextHeading = rest.search(/^## /m)
  return nextHeading >= 0 ? rest.slice(0, nextHeading) : rest
}

function sectionBullets(content: string, heading: string): string[] {
  return headingSection(content, heading)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').trim())
}

function normalizeType(value: string): EvolutionTrackerItemType {
  const lower = value.toLowerCase()
  if (lower === 'mockup') return 'mockup'
  if (lower === 'placeholder') return 'placeholder'
  if (lower === 'disconnected') return 'disconnected'
  if (lower === 'fake data') return 'fake data'
  if (lower === 'broken') return 'broken'
  if (lower === 'production-ready') return 'production-ready'
  return 'unfinished'
}

function parseTrackerItems(content: string): EvolutionTrackerItem[] {
  const matches = [...content.matchAll(/^## Item: (.+)$/gm)]
  return matches.map((match, index) => {
    const name = match[1].trim()
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? content.length
    const block = content.slice(start, end)
    const checklist = [...block.matchAll(/^- \[[ xX]\] (.+)$/gm)].map((item) => item[1].trim())

    return {
      id: `item-${slugify(name)}`,
      name,
      filePath: bulletValue(block, 'File path'),
      currentStatus: bulletValue(block, 'Current status') || 'Unknown',
      type: normalizeType(bulletValue(block, 'Type')),
      missing: bulletValue(block, 'What is missing'),
      finalForm: bulletValue(block, 'What it must become in final form'),
      priority: (bulletValue(block, 'Priority') || 'P2') as EvolutionTrackerItem['priority'],
      dependencies: bulletValue(block, 'Dependencies') || 'None',
      checklist,
    }
  })
}

function normalizeSeverity(value: string): EvolutionIntegrityFinding['severity'] {
  const lower = value.toLowerCase()
  if (lower === 'critical') return 'critical'
  if (lower === 'high') return 'high'
  if (lower === 'low') return 'low'
  return 'medium'
}

function parseIntegrityFindings(content: string): EvolutionIntegrityFinding[] {
  const matches = [...content.matchAll(/^## Finding: (.+)$/gm)]
  return matches.map((match, index) => {
    const title = match[1].trim()
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? content.length
    const block = content.slice(start, end)

    return {
      id: `finding-${slugify(title)}`,
      title,
      severity: normalizeSeverity(bulletValue(block, 'Severity')),
      area: bulletValue(block, 'Area') || 'General',
      status: bulletValue(block, 'Status') || 'Unknown',
      requiredFix: bulletValue(block, 'Required fix') || 'Document and resolve.',
      evidence: bulletValue(block, 'Evidence') || 'See integrity report.',
    }
  })
}

function parseChangelogEntries(content: string): string[] {
  return [...content.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim()).slice(0, 5)
}

function latestTimestamp(files: EvolutionTrackingFile[]): string {
  const latest = files
    .map((file) => file.lastUpdated)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
  return latest ?? new Date().toISOString()
}

export function buildEvolutionSnapshot(projectPath: string): AppEvolutionSnapshot {
  const prefix = resolveEvolutionPrefix(projectPath)
  const evidence = trackingFileDefinitions.map((definition) =>
    readEvolutionEvidence(projectPath, prefix, definition),
  )
  const contentByPath = new Map(evidence.map((item) => [item.definition.path, item.content]))
  const files = evidence.map(fileInfo)
  const projectState = contentByPath.get('PROJECT_STATE.md') ?? ''
  const finalForm = contentByPath.get('APP_FINAL_FORM_GOAL.md') ?? ''
  const tracker = contentByPath.get('MOCKUP_COMPONENT_TRACKER.md') ?? ''
  const integrity = contentByPath.get('APP_INTEGRITY_REPORT.md') ?? ''
  const versionPlan = contentByPath.get('VERSION_EVOLUTION_PLAN.md') ?? ''
  const changelog = contentByPath.get('CHANGELOG_EVOLUTION.md') ?? ''

  return {
    currentVersion: bulletValue(projectState, 'Current version') || 'Untracked',
    currentStage: bulletValue(projectState, 'Current stage') || 'Stage unknown',
    goal: bulletValue(projectState, 'Current goal') || 'Create app evolution tracking files.',
    corePromise: bulletValue(finalForm, 'Core app promise') || 'Compass points to the next correct step.',
    lastUpdated: latestTimestamp(files),
    requiredScreens: sectionBullets(finalForm, 'Required Screens'),
    definitionOfDone: sectionBullets(finalForm, 'Definition Of Done'),
    mockupItems: parseTrackerItems(tracker),
    integrityFindings: parseIntegrityFindings(integrity),
    nextVersionTarget: bulletValue(versionPlan, 'Current version target') || 'Next version not planned',
    upgradeThesis: headingSection(versionPlan, 'Upgrade Thesis').trim() || 'No upgrade thesis recorded.',
    versionDeltaGate: headingSection(versionPlan, 'Version Delta Gate').trim() || 'No delta gate recorded.',
    trackingFiles: files,
    changelogEntries: parseChangelogEntries(changelog),
  }
}

export const evolutionTrackingPaths = trackingFileDefinitions.map((definition) => definition.path)
