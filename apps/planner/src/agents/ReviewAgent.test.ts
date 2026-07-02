import { describe, expect, it } from 'vitest'
import { ReviewAgent } from './ReviewAgent.js'
import type { ArchitectureOutput, LayoutPlan, Module } from '../types/agent.js'

const mod = (id: string): Module => ({ id, name: id, priority: 'must', description: id })

const layout = (contract: LayoutPlan['layoutContract']): LayoutPlan => ({
  modules: Object.keys(contract).map(mod),
  layoutContract: contract,
})

const architecture = (mvpScope: string[]): ArchitectureOutput => ({
  adrs: [{ id: 'ADR-001', decision: 'Test', rationale: 'Test' }],
  mvpScope: mvpScope.map(mod),
  roadmap: [],
})

describe('ReviewAgent', () => {
  it('passes a valid DAG with a defined MVP scope and reports full coverage', async () => {
    const result = await new ReviewAgent().run(
      layout({ shell: [], auth: ['shell'], dashboard: ['shell', 'auth'] }),
      architecture(['shell', 'auth']),
    )
    expect(result.output.passed).toBe(true)
    expect(result.output.coveragePercent).toBe(100)
    expect(result.output.findings).toHaveLength(0)
  })

  it('warns (not errors) when the MVP scope is empty', async () => {
    const result = await new ReviewAgent().run(layout({ shell: [] }), architecture([]))
    expect(result.output.passed).toBe(true)
    expect(result.output.coveragePercent).toBe(0)
    expect(result.output.findings.some((f) => f.severity === 'warn' && f.message.includes('Coverage'))).toBe(true)
  })

  it('errors on unknown module references', async () => {
    const result = await new ReviewAgent().run(
      layout({ shell: ['ghost'] }),
      architecture(['shell']),
    )
    expect(result.output.passed).toBe(false)
    expect(result.output.findings.some((f) => f.message.includes('ghost'))).toBe(true)
  })

  it('errors on circular dependencies', async () => {
    const result = await new ReviewAgent().run(
      layout({ a: ['b'], b: ['c'], c: ['a'] }),
      architecture(['a']),
    )
    expect(result.output.passed).toBe(false)
    expect(result.output.findings.some((f) => f.message.includes('Circular dependency'))).toBe(true)
  })
})
