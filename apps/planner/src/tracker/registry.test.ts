import { describe, expect, it } from 'vitest'
import { parseRegistry } from './registry.js'

describe('parseRegistry', () => {
  it('parses ABS_PATH|label|role lines, skipping comments and blanks', () => {
    const content = [
      '# comment',
      '',
      '/Users/x/nightraven|NightRaven monorepo (framework)|framework',
      '/Users/x/HimFLer|HimFLer (linen DST)|app',
    ].join('\n')
    const entries = parseRegistry(content)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({ path: '/Users/x/nightraven', label: 'NightRaven monorepo (framework)', role: 'framework' })
    expect(entries[1].role).toBe('app')
  })

  it('ignores malformed lines', () => {
    expect(parseRegistry('not-a-valid-line')).toHaveLength(0)
  })
})
