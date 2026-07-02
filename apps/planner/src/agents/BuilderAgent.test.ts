import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BuilderAgent } from './BuilderAgent.js'
import { LmStudioClient } from '../llm/lmStudioClient.js'
import { claimPath } from '../coordination/claimFile.js'
import type { AppSpec, ArchitectureOutput, LayoutPlan, Module } from '../types/agent.js'

const originalFetch = global.fetch

const mod = (id: string): Module => ({ id, name: id, priority: 'must', description: id })
const spec: AppSpec = { name: 'Test App', intent: 'test' }
const layout: LayoutPlan = { modules: [mod('auth')], layoutContract: { auth: [] } }
const architecture: ArchitectureOutput = { adrs: [], mvpScope: [mod('auth')], roadmap: [] }

let dir: string
let targetPath: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'builder-agent-'))
  targetPath = join(dir, 'auth.ts')
})

afterEach(async () => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
  await rm(dir, { recursive: true, force: true })
})

function mockLlmProposal(path: string) {
  global.fetch = vi.fn(async (url: string) => {
    if (String(url).endsWith('/models')) {
      return { ok: true, json: async () => ({ data: [{ id: 'test-model' }] }) } as Response
    }
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                proposals: [{ path, action: 'write', content: 'export const auth = true\n', reasoning: 'scaffold auth' }],
              }),
            },
          },
        ],
      }),
    } as Response
  }) as unknown as typeof fetch
}

describe('BuilderAgent', () => {
  it('reports no proposals when no LLM client is configured', async () => {
    const result = await new BuilderAgent().run(spec, layout, architecture, { approve: true, targetDir: dir })
    expect(result.output.proposals).toHaveLength(0)
    expect(result.output.applied).toBe(false)
    expect(result.output.note).toContain('No LM Studio brain configured')
  })

  it('dry-runs without writing when approve is false', async () => {
    mockLlmProposal(targetPath)
    const builder = new BuilderAgent(new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' }))
    const result = await builder.run(spec, layout, architecture, { approve: false, targetDir: dir })
    expect(result.output.proposals).toHaveLength(1)
    expect(result.output.applied).toBe(false)
    await expect(readFile(targetPath, 'utf8')).rejects.toThrow()
  })

  it('writes the proposed file when approved, claiming and releasing the path', async () => {
    mockLlmProposal(targetPath)
    const claimLog = join(dir, 'AGENT_WORK_LOG.md')
    const claim = vi.fn((p: string) => claimPath(claimLog, p, 'test-stream'))
    const release = vi.fn(async () => undefined)

    const builder = new BuilderAgent(new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' }))
    const result = await builder.run(spec, layout, architecture, {
      approve: true,
      targetDir: dir,
      claimHooks: { claim, release },
    })

    expect(result.output.applied).toBe(true)
    expect(result.output.filesWritten).toEqual([targetPath])
    expect(claim).toHaveBeenCalledWith(targetPath)
    expect(release).toHaveBeenCalledWith(targetPath)
    await expect(readFile(targetPath, 'utf8')).resolves.toContain('export const auth')
  })

  it('skips the write and records a failure when the claim is denied', async () => {
    mockLlmProposal(targetPath)
    const builder = new BuilderAgent(new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' }))
    const result = await builder.run(spec, layout, architecture, {
      approve: true,
      targetDir: dir,
      claimHooks: {
        claim: async () => ({ ok: false, reason: 'already claimed by stream:other' }),
        release: async () => undefined,
      },
    })

    expect(result.output.filesWritten).toHaveLength(0)
    expect(result.output.filesFailed).toEqual([{ path: targetPath, error: 'Claim denied — already claimed by stream:other' }])
    await expect(readFile(targetPath, 'utf8')).rejects.toThrow()
  })
})
