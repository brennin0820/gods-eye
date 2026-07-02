import { useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { buildActivityFeed } from '../../data/mockSnapshot'
import { useCompassData } from '../../hooks/useCompassData'
import type { MemoryFeedKind, MemoryFeedItem } from '../../types/snapshot'

const kindLabels: Record<MemoryFeedKind, string> = {
  task: 'Tasks',
  decision: 'Decisions',
  audit: 'Audits',
  blocker: 'Blockers',
  session: 'Sessions',
}

const kindOrder: MemoryFeedKind[] = ['task', 'decision', 'audit', 'blocker', 'session']

function MemoryEntry({ item }: { item: MemoryFeedItem }) {
  return (
    <article className="dashboard-card memory-entry" data-kind={item.kind}>
      <div className="memory-entry__head">
        <p className="eyebrow">{item.date}</p>
        <span className="queue-pill">{kindLabels[item.kind]}</span>
      </div>
      <h3 className="memory-entry__title">{item.title}</h3>
      <p className="memory-entry__text">{item.text}</p>
      {item.source ? (
        <p className="memory-entry__source">
          Source: <code>{item.source}</code>
        </p>
      ) : null}
    </article>
  )
}

export function MemoryFeedPage() {
  const { snapshot } = useCompassData()
  const [filter, setFilter] = useState<MemoryFeedKind | 'all'>('all')

  const feed = useMemo(() => {
    if (!snapshot) return []
    return buildActivityFeed(snapshot)
  }, [snapshot])

  const counts = useMemo(() => {
    return kindOrder.reduce<Record<MemoryFeedKind, number>>(
      (acc, kind) => {
        acc[kind] = feed.filter((item) => item.kind === kind).length
        return acc
      },
      { task: 0, decision: 0, audit: 0, blocker: 0, session: 0 },
    )
  }, [feed])

  const visible = filter === 'all' ? feed : feed.filter((item) => item.kind === filter)

  return (
    <section className="memory-page" aria-labelledby="memory-feed-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <BookOpen size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Memory feed · Phase 7</p>
            <h2 id="memory-feed-title">Recent tasks, decisions, audits & blockers</h2>
          </div>
        </div>
        <p className="card-copy">
          Append-only project memory — NightRaven handoff sessions plus tasks, decisions,
          audits, and blockers from the live snapshot and local edits.
        </p>
        <div className="scope-stats">
          <span>
            <strong>Total</strong>
            {feed.length}
          </span>
          {kindOrder.map((kind) => (
            <span key={kind}>
              <strong>{kindLabels[kind]}</strong>
              {counts[kind]}
            </span>
          ))}
        </div>
      </article>

      <div className="memory-filters" role="tablist" aria-label="Filter memory feed">
        <button
          className="memory-filter-btn"
          data-active={filter === 'all'}
          onClick={() => setFilter('all')}
          type="button"
        >
          All
        </button>
        {kindOrder.map((kind) => (
          <button
            className="memory-filter-btn"
            data-active={filter === kind}
            key={kind}
            onClick={() => setFilter(kind)}
            type="button"
          >
            {kindLabels[kind]} ({counts[kind]})
          </button>
        ))}
      </div>

      <div className="memory-feed">
        {visible.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No entries for this filter.</p>
          </article>
        ) : (
          visible.map((item) => <MemoryEntry item={item} key={item.id} />)
        )}
      </div>
    </section>
  )
}
