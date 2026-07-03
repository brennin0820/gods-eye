import { Gauge } from 'lucide-react'
import type { NextMove, ProjectMonitorSnapshot } from '../../types/snapshot'

type MonitorSummaryCardProps = {
  monitor: ProjectMonitorSnapshot
  nextMove: NextMove
}

export function MonitorSummaryCard({ monitor, nextMove }: MonitorSummaryCardProps) {
  return (
    <article className="dashboard-card dashboard-card--wide">
      <div className="card-heading">
        <span className="card-icon card-icon--green">
          <Gauge size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Project monitor</p>
          <h2>{monitor.lifecycleLabel}</h2>
        </div>
      </div>
      <p className="card-copy">{monitor.summary}</p>
      {monitor.blockingReason ? (
        <div className="monitor-blocking">
          <strong>Blocking reason</strong>
          <span>{monitor.blockingReason}</span>
        </div>
      ) : null}
      <div className="monitor-dimensions">
        {monitor.dimensions.map((dimension) => (
          <span key={dimension.id} data-status={dimension.status}>
            <strong>{dimension.label}</strong>
            {dimension.status}
          </span>
        ))}
      </div>
      <div className="next-move-box">
        <strong>Next move</strong>
        <p>{nextMove.action}</p>
        <small>
          {nextMove.targetAgent} · {nextMove.approvalRequired ? 'approval required' : 'no approval required'}
        </small>
      </div>
    </article>
  )
}
