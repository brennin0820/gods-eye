// Claim-file coordination — implements the Unified Manifest's `claim_before_editing` /
// `serialize_sensitive_files` rules and Bible §2.4 ("one file → one writer per pass") as
// executable logic instead of an instruction an agent might skip.
//
// Pure functions operate on the claim file's text content so they're unit-testable
// without touching disk; readClaimLog/writeClaimEntry are the thin fs wrappers.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export type ClaimAction = 'CLAIMED' | 'RELEASED'

export type ClaimEntry = {
  action: ClaimAction
  path: string
  streamId: string
  timestamp: string
  reason?: string
}

const HEADER = [
  '# Agent Work Log',
  '',
  'Append-only claim log — one line per claim/release. A path is claimed while its most',
  'recent entry is CLAIMED; RELEASED frees it for the next stream.',
  '',
  '## Claims',
  '',
].join('\n')

const LINE_RE = /^- \[(CLAIMED|RELEASED)\] `([^`]+)` — stream:([^\s—]+) — ([^\s—]+)(?: — (.*))?$/

export function parseClaimLog(content: string): ClaimEntry[] {
  const entries: ClaimEntry[] = []
  for (const line of content.split('\n')) {
    const match = line.match(LINE_RE)
    if (!match) continue
    const [, action, path, streamId, timestamp, reason] = match
    entries.push({ action: action as ClaimAction, path, streamId, timestamp, reason })
  }
  return entries
}

/** Most recent action per path — undefined if never claimed or currently released. */
function activeClaims(entries: ClaimEntry[]): Map<string, ClaimEntry> {
  const latest = new Map<string, ClaimEntry>()
  for (const entry of entries) latest.set(entry.path, entry)
  const active = new Map<string, ClaimEntry>()
  for (const [path, entry] of latest) if (entry.action === 'CLAIMED') active.set(path, entry)
  return active
}

export function isPathClaimed(content: string, path: string, byOtherThan?: string): boolean {
  const claim = activeClaims(parseClaimLog(content)).get(path)
  if (!claim) return false
  return byOtherThan ? claim.streamId !== byOtherThan : true
}

export function formatClaimLine(entry: Omit<ClaimEntry, 'timestamp'> & { timestamp?: string }): string {
  const timestamp = entry.timestamp ?? new Date().toISOString()
  const reasonSuffix = entry.reason ? ` — ${entry.reason}` : ''
  return `- [${entry.action}] \`${entry.path}\` — stream:${entry.streamId} — ${timestamp}${reasonSuffix}`
}

export async function readClaimLog(logPath: string): Promise<string> {
  try {
    return await readFile(logPath, 'utf8')
  } catch {
    return HEADER
  }
}

async function appendLine(logPath: string, line: string): Promise<void> {
  const current = await readClaimLog(logPath)
  await mkdir(dirname(logPath), { recursive: true })
  const separator = current.endsWith('\n') ? '' : '\n'
  await writeFile(logPath, `${current}${separator}${line}\n`, 'utf8')
}

export type ClaimResult = { ok: boolean; reason?: string }

/** Claim a path for a stream. Fails if another stream currently holds it. */
export async function claimPath(logPath: string, path: string, streamId: string, reason?: string): Promise<ClaimResult> {
  const content = await readClaimLog(logPath)
  const conflict = activeClaims(parseClaimLog(content)).get(path)
  if (conflict && conflict.streamId !== streamId) {
    return { ok: false, reason: `already claimed by stream:${conflict.streamId} at ${conflict.timestamp}` }
  }
  await appendLine(logPath, formatClaimLine({ action: 'CLAIMED', path, streamId, reason }))
  return { ok: true }
}

export async function releasePath(logPath: string, path: string, streamId: string): Promise<void> {
  await appendLine(logPath, formatClaimLine({ action: 'RELEASED', path, streamId }))
}
