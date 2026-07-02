import { describe, expect, it } from 'vitest'
import { renderBuildLedgerEntry, renderAuditLedgerEntry } from './ledger.js'

describe('renderBuildLedgerEntry', () => {
  it('matches the documented docs/ledgers/BUILD_LEDGER.md entry format', () => {
    const entry = renderBuildLedgerEntry({
      date: '2026-07-02',
      agent: 'BuilderAgent',
      task: 'LinenFlow MVP',
      event: 'FeatureBuilt',
      actionsPerformed: 'Scaffolded Auth module',
      filesCreated: ['a.swift'],
      filesModified: [],
      dependenciesAdded: [],
      reasoning: 'MVP scope: Auth',
      confidence: 80,
    })
    expect(entry).toContain('## [2026-07-02] BuilderAgent — LinenFlow MVP')
    expect(entry).toContain('- Event: FeatureBuilt')
    expect(entry).toContain('- Files created: a.swift')
    expect(entry).toContain('- Files modified: none')
    expect(entry).toContain('- Confidence: 80/100')
  })
})

describe('renderAuditLedgerEntry', () => {
  it('matches the documented docs/ledgers/AUDIT_LEDGER.md entry format', () => {
    const entry = renderAuditLedgerEntry({
      date: '2026-07-02',
      agent: 'ReviewAgent',
      scope: 'LinenFlow layout',
      event: 'AuditCompleted',
      findings: 'none',
      scores: 'coverage 100/100',
      risks: 'none',
      recommendations: 'proceed to build',
    })
    expect(entry).toContain('## [2026-07-02] ReviewAgent — LinenFlow layout')
    expect(entry).toContain('- Event: AuditCompleted')
    expect(entry).not.toContain('Full report')
  })
})
