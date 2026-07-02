import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GrepTool } from './GrepTool.js'

let dir: string
const cwd = process.cwd()

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'grep-tool-'))
  await mkdir(join(dir, 'nested'))
  await writeFile(join(dir, 'a.ts'), 'const needle = 1\n')
  await writeFile(join(dir, 'b.md'), 'needle in prose\n')
  await writeFile(join(dir, 'nested', 'c.ts'), 'another needle here\n')
  // grepFile reads paths relative to the walk base, resolved from cwd
  process.chdir(dir)
})

afterAll(async () => {
  process.chdir(cwd)
  await rm(dir, { recursive: true, force: true })
})

describe('GrepTool glob filter', () => {
  it('matches all files when no glob is given', async () => {
    const result = await new GrepTool().run({ pattern: 'needle', path: '.', context: 0 })
    expect(result.ok).toBe(true)
    expect(result.output).toContain('a.ts')
    expect(result.output).toContain('b.md')
    expect(result.output).toContain('c.ts')
  })

  it('filters by basename glob (no slash)', async () => {
    const result = await new GrepTool().run({ pattern: 'needle', path: '.', glob: '*.ts', context: 0 })
    expect(result.ok).toBe(true)
    expect(result.output).toContain('a.ts')
    expect(result.output).toContain('c.ts')
    expect(result.output).not.toContain('b.md')
  })

  it('filters by path glob (with slash)', async () => {
    const result = await new GrepTool().run({ pattern: 'needle', path: '.', glob: 'nested/*.ts', context: 0 })
    expect(result.ok).toBe(true)
    expect(result.output).toContain('c.ts')
    expect(result.output).not.toContain('a.ts')
  })
})
