import { describe, expect, it } from 'vitest'
import { renderStatusDoc } from './statusDoc.js'

describe('renderStatusDoc', () => {
  it('renders a table row per stream', () => {
    const doc = renderStatusDoc('LinenFlow', [
      { streamId: 'main', division: 'builder', phase: 'Phase 4', state: 'passed', detail: '3 written' },
    ], '2026-07-02T00:00:00.000Z')
    expect(doc).toContain('# Parallel run status — LinenFlow')
    expect(doc).toContain('| main | builder | Phase 4 | passed | 3 written |')
  })

  it('shows a placeholder row when no streams have run', () => {
    const doc = renderStatusDoc('LinenFlow', [], '2026-07-02T00:00:00.000Z')
    expect(doc).toContain('no streams run yet')
  })
})
