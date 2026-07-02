import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { claimPath, releasePath, readClaimLog, parseClaimLog, isPathClaimed, formatClaimLine } from './claimFile.js'

let dir: string
let logPath: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'claim-file-'))
  logPath = join(dir, 'AGENT_WORK_LOG.md')
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('claimFile pure logic', () => {
  it('formats a claim line parsable by parseClaimLog', () => {
    const line = formatClaimLine({ action: 'CLAIMED', path: 'a.swift', streamId: 's1', timestamp: '2026-07-02T00:00:00.000Z', reason: 'edit' })
    const [entry] = parseClaimLog(line)
    expect(entry).toEqual({ action: 'CLAIMED', path: 'a.swift', streamId: 's1', timestamp: '2026-07-02T00:00:00.000Z', reason: 'edit' })
  })

  it('treats a path as unclaimed once RELEASED follows CLAIMED', () => {
    const content = [
      formatClaimLine({ action: 'CLAIMED', path: 'a.swift', streamId: 's1', timestamp: 't1' }),
      formatClaimLine({ action: 'RELEASED', path: 'a.swift', streamId: 's1', timestamp: 't2' }),
    ].join('\n')
    expect(isPathClaimed(content, 'a.swift')).toBe(false)
  })

  it('treats a path as claimed when the latest entry is CLAIMED', () => {
    const content = formatClaimLine({ action: 'CLAIMED', path: 'a.swift', streamId: 's1', timestamp: 't1' })
    expect(isPathClaimed(content, 'a.swift')).toBe(true)
    expect(isPathClaimed(content, 'a.swift', 's1')).toBe(false) // not claimed by "another" stream
    expect(isPathClaimed(content, 'a.swift', 's2')).toBe(true)
  })
})

describe('claimFile fs integration', () => {
  it('creates the log with a header on first claim', async () => {
    const result = await claimPath(logPath, 'a.swift', 's1')
    expect(result.ok).toBe(true)
    const content = await readClaimLog(logPath)
    expect(content).toContain('# Agent Work Log')
    expect(content).toContain('[CLAIMED] `a.swift` — stream:s1')
  })

  it('rejects a claim on a path already held by another stream', async () => {
    await claimPath(logPath, 'project.pbxproj', 's1')
    const result = await claimPath(logPath, 'project.pbxproj', 's2')
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('stream:s1')
  })

  it('allows re-claiming by the same stream (idempotent within a run)', async () => {
    await claimPath(logPath, 'a.swift', 's1')
    const result = await claimPath(logPath, 'a.swift', 's1')
    expect(result.ok).toBe(true)
  })

  it('frees the path for another stream after release', async () => {
    await claimPath(logPath, 'a.swift', 's1')
    await releasePath(logPath, 'a.swift', 's1')
    const result = await claimPath(logPath, 'a.swift', 's2')
    expect(result.ok).toBe(true)
  })
})
