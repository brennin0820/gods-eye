// Cross-project rollup — reads what each registered project's chain already exposes
// (handoff focus, ledger entry counts, manifest presence) without ever importing another
// project's memory content into this one (Bible §2.6 — metadata only, same discipline as
// docs/NIGHTRAVEN_PROJECT_INVENTORY.md and scan-nightraven-projects.sh).

import { access, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { RegistryEntry } from './registry.js'

export type ProjectStatus = {
  entry: RegistryEntry
  available: boolean
  focus?: string
  manifestPath?: string
  buildLedgerEntries: number
  auditLedgerEntries: number
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function extractFocus(handoff: string): string | undefined {
  const match = handoff.match(/^## Current state \/ focus\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m)
  if (!match) return undefined
  return match[1]
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
}

function countLedgerEntries(ledger: string): number {
  return (ledger.match(/^## \[\d{4}-\d{2}-\d{2}\]/gm) ?? []).length
}

async function findManifest(projectRoot: string): Promise<string | undefined> {
  const dir = join(projectRoot, '.nightraven')
  try {
    const files = await readdir(dir)
    const yaml = files.find((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    return yaml ? join(dir, yaml) : undefined
  } catch {
    return undefined
  }
}

export async function getProjectStatus(entry: RegistryEntry): Promise<ProjectStatus> {
  const available = await fileExists(entry.path)
  if (!available) {
    return { entry, available: false, buildLedgerEntries: 0, auditLedgerEntries: 0 }
  }

  const handoffPath = join(entry.path, 'docs/14_SESSION_HANDOFF.md')
  const focus = (await fileExists(handoffPath)) ? extractFocus(await readFile(handoffPath, 'utf8')) : undefined

  const buildLedgerPath = join(entry.path, 'docs/ledgers/BUILD_LEDGER.md')
  const auditLedgerPath = join(entry.path, 'docs/ledgers/AUDIT_LEDGER.md')
  const buildLedgerEntries = (await fileExists(buildLedgerPath))
    ? countLedgerEntries(await readFile(buildLedgerPath, 'utf8'))
    : 0
  const auditLedgerEntries = (await fileExists(auditLedgerPath))
    ? countLedgerEntries(await readFile(auditLedgerPath, 'utf8'))
    : 0

  const manifestPath = await findManifest(entry.path)

  return { entry, available, focus, manifestPath, buildLedgerEntries, auditLedgerEntries }
}
