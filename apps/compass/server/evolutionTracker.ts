import fs from 'node:fs'
import path from 'node:path'
import type {
  AppEvolutionSnapshot,
  EvolutionIntegrityFinding,
  EvolutionTrackerItem,
  EvolutionTrackerItemType,
  EvolutionTrackingFile,
} from '../src/types/snapshot'

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

function hasTrackingFiles(basePath: string): boolean {
  return trackingFileDefinitions.some((definition) => fs.existsSync(path.join(basePath, definition.path)))
}

function resolveEvolutionBase(projectPath: string): string {
  if (hasTrackingFiles(projectPath)) return projectPath

  const nestedCompass = path.join(projectPath, 'apps', 'compass')
  if (hasTrackingFiles(nestedCompass)) return nestedCompass

  const cwd = process.cwd()
  if (hasTrackingFiles(cwd)) return cwd

  return projectPath
}

function displayPath(projectPath: string, fullPath: string, fallback: string): string {
  const relative = path.relative(projectPath, fullPath)
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, '/')
  }
  return fallback
}

function readFile(basePath: string, relativePath: string): string {
  const full = path.join(basePath, relativePath)
  if (!fs.existsSync(full)) return ''
  return fs.readFileSync(full, 'utf8')
}

function fileInfo(
  projectPath: string,
  basePath: string,
  definition: TrackingFileDefinition,
): EvolutionTrackingFile {
  const full = path.join(basePath, definition.path)
  const exists = fs.existsSync(full)
  const stat = exists ? fs.statSync(full) : null
  return {
    name: definition.name,
    path: displayPath(projectPath, full, definition.path),
    purpose: definition.purpose,
    status: exists ? 'present' : 'missing',
    lastUpdated: stat?.mtime.toISOString(),
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
  const basePath = resolveEvolutionBase(projectPath)
  const files = trackingFileDefinitions.map((definition) =>
    fileInfo(projectPath, basePath, definition),
  )
  const projectState = readFile(basePath, 'PROJECT_STATE.md')
  const finalForm = readFile(basePath, 'APP_FINAL_FORM_GOAL.md')
  const tracker = readFile(basePath, 'MOCKUP_COMPONENT_TRACKER.md')
  const integrity = readFile(basePath, 'APP_INTEGRITY_REPORT.md')
  const versionPlan = readFile(basePath, 'VERSION_EVOLUTION_PLAN.md')
  const changelog = readFile(basePath, 'CHANGELOG_EVOLUTION.md')

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
