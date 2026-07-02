import type { MemoryFeedItem } from './types'

export type HandoffParse = {
  focus: string
  nextItems: string[]
  recentSessions: MemoryFeedItem[]
  alreadyDoneCount: number
}

function extractSection(content: string, heading: string): string {
  // (?![\s\S]) = true end-of-input; JS regexes have no \Z anchor
  const pattern = new RegExp(
    `^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
    'm',
  )
  const match = content.match(pattern)
  return match?.[1]?.trim() ?? ''
}

function parseNextFromFocus(focus: string): string[] {
  const nextMatch = focus.match(/\*\*Next:\*\*\s*(.+)$/i)
  if (!nextMatch) return []
  return nextMatch[1]
    .split(/[·•]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseRecentSessions(section: string): MemoryFeedItem[] {
  const items: MemoryFeedItem[] = []
  for (const line of section.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- ')) continue
    const match = trimmed.match(/^-\s+\*\*(\d{4}-\d{2}-\d{2})\*\*\s+—\s+(.+)$/)
    if (match) {
      items.push({
        id: `session-${items.length}-${match[1]}`,
        date: match[1],
        kind: 'session',
        title: match[2].slice(0, 72),
        text: match[2],
      })
      continue
    }
    items.push({
      id: `session-${items.length}`,
      date: 'unknown',
      kind: 'session',
      title: trimmed.slice(2, 74),
      text: trimmed.slice(2),
    })
  }
  return items
}

export function parseHandoff(content: string): HandoffParse {
  const focusBlock = extractSection(content, 'Current state / focus')
  const focus =
    focusBlock
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith('#')) ?? 'No focus line in handoff.'

  const recentSection = extractSection(content, 'Recent sessions')
  const alreadyDoneSection = extractSection(content, 'Already done')
  const alreadyDoneCount = alreadyDoneSection
    .split('\n')
    .filter((line) => line.trim().startsWith('- +#')).length

  return {
    focus,
    nextItems: parseNextFromFocus(focus),
    recentSessions: parseRecentSessions(recentSection),
    alreadyDoneCount,
  }
}

export function parseOverlayNotNow(content: string): string[] {
  const boundary = extractSection(content, '2. Product boundary')
  if (!boundary) return []
  const items: string[] = []
  for (const line of boundary.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- **') && trimmed.includes('—')) {
      items.push(trimmed.replace(/^-\s+/, ''))
    }
  }
  return items
}
