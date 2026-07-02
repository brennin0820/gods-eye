import { BarChart3, FileText } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import type { CompassReport } from '../../types/snapshot'

const kindLabel: Record<CompassReport['kind'], string> = {
  build: 'Build',
  audit: 'Audit',
  handoff: 'Handoff',
  learning: 'Learning',
  scope: 'Scope',
}

function ReportCard({ report }: { report: CompassReport }) {
  return (
    <article className="dashboard-card report-card">
      <div className="report-card__head">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <FileText size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">{kindLabel[report.kind]}</p>
            <h3>{report.title}</h3>
          </div>
        </div>
        <time className="report-card__date" dateTime={report.generatedAt}>
          {new Date(report.generatedAt).toLocaleDateString()}
        </time>
      </div>
      <p className="card-copy">{report.excerpt}</p>
      {report.artifactPath ? (
        <p className="report-card__path">
          <code>{report.artifactPath}</code>
        </p>
      ) : null}
    </article>
  )
}

export function ReportsPage() {
  const { snapshot } = useCompassData()
  const reports = snapshot?.reports ?? []
  const kinds = [...new Set(reports.map((report) => report.kind))]

  return (
    <section className="reports-page" aria-labelledby="reports-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <BarChart3 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Reports</p>
            <h2 id="reports-title">Build, audit, and memory artifacts</h2>
          </div>
        </div>
        <p className="card-copy">
          Build, audit, handoff, learning, and scope summaries derived from loaded NightRaven
          artifacts and current project state.
        </p>
        <div className="scope-stats">
          <span>
            <strong>Total</strong>
            {reports.length}
          </span>
          <span>
            <strong>Kinds</strong>
            {kinds.join(', ')}
          </span>
        </div>
      </article>

      <div className="reports-list">
        {reports.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No reports generated for this project yet.</p>
          </article>
        ) : (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        )}
      </div>
    </section>
  )
}
