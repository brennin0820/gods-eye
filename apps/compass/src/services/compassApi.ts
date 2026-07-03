import type { FileCatalogEntry, ProjectSnapshot, RegistryEntry } from '../types/snapshot'
import type { PromptCard } from '../types/project'

const STORAGE_KEY = 'compass.selectedProject'
/** One-time: drop legacy localStorage default of nightraven-1 monorepo (pre pickInitialProject). */
const LEGACY_MONOREPO_MIGRATION_KEY = 'compass.himflerDefaultMigration.v1'
/** One-time: drop legacy HimFLer auto-pick so Compass opens on the active monorepo by default. */
const LEGACY_HIMFLER_DEFAULT_MIGRATION_KEY = 'compass.himflerDefaultMigration.v2'

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase()
}

function isLegacyFrameworkMonorepo(entry: RegistryEntry): boolean {
  const p = normalizePath(entry.path)
  return (
    entry.role === 'framework' &&
    (p.includes('nightraven-1') || p.includes('/nightraven/nightraven') || p.endsWith('/nightraven'))
  )
}

function findHimFlerEntry(registry: RegistryEntry[]): RegistryEntry | undefined {
  return registry.find(
    (entry) =>
      entry.available &&
      (normalizePath(entry.path).includes('himfler') ||
        entry.label.toLowerCase().includes('himfl')),
  )
}

function findFrameworkEntry(registry: RegistryEntry[]): RegistryEntry | undefined {
  return registry.find(
    (entry) =>
      entry.available &&
      entry.role === 'framework' &&
      (normalizePath(entry.path).includes('/nightraven') ||
        entry.label.toLowerCase().includes('nightraven')),
  )
}

function tryRestoreStoredProject(registry: RegistryEntry[]): SelectedProject | null {
  const stored = loadStoredProject()
  if (!stored) return null

  const match = registry.find(
    (entry) => entry.available && normalizePath(entry.path) === normalizePath(stored.path),
  )
  if (!match) return null

  // Pre-ca783f2 builds auto-picked the first registry row (nightraven-1). Migrate once to HimFLer.
  if (
    !localStorage.getItem(LEGACY_MONOREPO_MIGRATION_KEY) &&
    isLegacyFrameworkMonorepo(match)
  ) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(LEGACY_MONOREPO_MIGRATION_KEY, 'done')
    return null
  }

  if (
    !localStorage.getItem(LEGACY_HIMFLER_DEFAULT_MIGRATION_KEY) &&
    findHimFlerEntry([match])
  ) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(LEGACY_HIMFLER_DEFAULT_MIGRATION_KEY, 'done')
    return null
  }

  return { path: match.path, label: match.label }
}

export function pickInitialProject(registry: RegistryEntry[]): SelectedProject {
  const restored = tryRestoreStoredProject(registry)
  if (restored) return restored

  const framework = findFrameworkEntry(registry)
  if (framework) return { path: framework.path, label: framework.label }

  const himfler = findHimFlerEntry(registry)
  if (himfler) return { path: himfler.path, label: himfler.label }

  const appEntry = registry.find((entry) => entry.available && entry.role === 'app')
  if (appEntry) return { path: appEntry.path, label: appEntry.label }

  const any = registry.find((entry) => entry.available)
  if (any) return { path: any.path, label: any.label }

  return {
    path: '',
    label: 'Select a project',
  }
}

export type SelectedProject = {
  path: string
  label: string
}

export function loadStoredProject(): SelectedProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SelectedProject
  } catch {
    return null
  }
}

export function storeProject(project: SelectedProject) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export async function fetchRegistry(): Promise<RegistryEntry[]> {
  const response = await fetch('/api/registry')
  if (!response.ok) throw new Error(`Registry failed: ${response.status}`)
  const data = (await response.json()) as { registry: RegistryEntry[] }
  return data.registry
}

export async function fetchProjectSnapshot(
  path: string,
  label: string,
): Promise<ProjectSnapshot> {
  const params = new URLSearchParams({ path, label })
  const response = await fetch(`/api/project?${params.toString()}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Project load failed: ${response.status}`)
  }
  return response.json() as Promise<ProjectSnapshot>
}

export type ProjectVersionInfo = {
  snapshotVersion: string
  checkedAt: string
}

export type GeneratedFileResult = {
  ok: true
  artifactPath: string
  absolutePath: string
  writtenAt: string
}

export type ProjectFilesResult = {
  fileCatalog: FileCatalogEntry[]
  checkedAt: string
}

export type OpenPathResult = {
  ok: true
  mode: 'open' | 'reveal'
  targetPath: string
  openedAt: string
}

export async function fetchProjectVersion(path: string): Promise<ProjectVersionInfo> {
  const params = new URLSearchParams({ path })
  const response = await fetch(`/api/project/version?${params.toString()}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Version check failed: ${response.status}`)
  }
  return response.json() as Promise<ProjectVersionInfo>
}

export async function fetchProjectFiles(path: string): Promise<ProjectFilesResult> {
  const params = new URLSearchParams({ path })
  const response = await fetch(`/api/project/files?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Project files failed: ${response.status}`)
  }
  return response.json() as Promise<ProjectFilesResult>
}

export async function openSystemPath(args: {
  projectPath: string
  targetPath: string
  mode: 'open' | 'reveal'
}): Promise<OpenPathResult> {
  const response = await fetch('/api/system/open-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Open path failed: ${response.status}`)
  }

  return response.json() as Promise<OpenPathResult>
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function generatePromptFile(args: {
  projectPath: string
  projectLabel: string
  phaseName: string
  taskTitle: string
  promptCard: PromptCard
}): Promise<GeneratedFileResult> {
  const date = new Date().toISOString().slice(0, 10)
  const target = slugify(args.promptCard.target)
  const task = slugify(args.taskTitle).slice(0, 48) || 'task'
  const relativePath = `docs/generated/compass/${date}-${task}-${target}-prompt.md`
  const content = [
    `# Compass Prompt — ${args.taskTitle}`,
    '',
    `- Project: ${args.projectLabel}`,
    `- Phase: ${args.phaseName}`,
    `- Target: ${args.promptCard.target}`,
    `- Generated by: NightRaven Compass`,
    `- Generated at: ${new Date().toISOString()}`,
    '',
    '## Prompt',
    '',
    args.promptCard.prompt,
    '',
    '## Required output',
    '',
    ...args.promptCard.requiredOutput.map((item) => `- ${item}`),
    '',
  ].join('\n')

  const response = await fetch('/api/generate-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectPath: args.projectPath,
      relativePath,
      content,
    }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Generate file failed: ${response.status}`)
  }

  return response.json() as Promise<GeneratedFileResult>
}

/** Poll interval when auto-refresh is enabled (registry mode). */
export const AUTO_REFRESH_POLL_MS = 10_000
