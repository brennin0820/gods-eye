// Append-only writers for docs/ledgers/BUILD_LEDGER.md and AUDIT_LEDGER.md, matching the
// entry format already documented in those files exactly (Event / Files / Reasoning /
// Confidence for Build; Event / Findings / Scores / Risks for Audit).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export type BuildLedgerEntry = {
  date: string
  agent: string
  task: string
  event: string
  actionsPerformed: string
  filesCreated: string[]
  filesModified: string[]
  dependenciesAdded: string[]
  reasoning: string
  confidence: number
}

export function renderBuildLedgerEntry(e: BuildLedgerEntry): string {
  return [
    `## [${e.date}] ${e.agent} — ${e.task}`,
    `- Event: ${e.event}`,
    `- Actions performed: ${e.actionsPerformed}`,
    `- Files created: ${e.filesCreated.join(', ') || 'none'}`,
    `- Files modified: ${e.filesModified.join(', ') || 'none'}`,
    `- Dependencies added: ${e.dependenciesAdded.join(', ') || 'none'}`,
    `- Reasoning: ${e.reasoning}`,
    `- Confidence: ${e.confidence}/100`,
    '',
  ].join('\n')
}

export type AuditLedgerEntry = {
  date: string
  agent: string
  scope: string
  event: string
  findings: string
  scores: string
  risks: string
  recommendations: string
  fullReport?: string
}

export function renderAuditLedgerEntry(e: AuditLedgerEntry): string {
  const lines = [
    `## [${e.date}] ${e.agent} — ${e.scope}`,
    `- Event: ${e.event}`,
    `- Findings: ${e.findings}`,
    `- Scores: ${e.scores}`,
    `- Risks: ${e.risks}`,
    `- Recommendations: ${e.recommendations}`,
  ]
  if (e.fullReport) lines.push(`- Full report: ${e.fullReport}`)
  lines.push('')
  return lines.join('\n')
}

async function appendToLedger(ledgerPath: string, rendered: string): Promise<void> {
  let current: string
  try {
    current = await readFile(ledgerPath, 'utf8')
  } catch {
    current = '# Ledger\n\nAppend-only.\n\n---\n'
  }
  await mkdir(dirname(ledgerPath), { recursive: true })
  const separator = current.endsWith('\n') ? '' : '\n'
  await writeFile(ledgerPath, `${current}${separator}\n${rendered}`, 'utf8')
}

export async function appendBuildLedgerEntry(ledgerPath: string, entry: BuildLedgerEntry): Promise<void> {
  await appendToLedger(ledgerPath, renderBuildLedgerEntry(entry))
}

export async function appendAuditLedgerEntry(ledgerPath: string, entry: AuditLedgerEntry): Promise<void> {
  await appendToLedger(ledgerPath, renderAuditLedgerEntry(entry))
}
