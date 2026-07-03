import { Activity, FileText } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'

export function RunsPage() {
  const { snapshot } = useCompassData()
  if (!snapshot) return null

  const runFiles = snapshot.fileCatalog.filter((entry) =>
    ['run', 'build', 'audit', 'attachment'].includes(entry.monitorRole),
  )

  return (
    <section className="runs-page" aria-labelledby="runs-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <Activity size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Runs</p>
            <h2 id="runs-title">Build, audit, and run evidence</h2>
          </div>
        </div>
        <p className="card-copy">
          This screen shows run status and ledgers as evidence. It does not execute agents or
          replace the terminal.
        </p>
        <div className="meta-grid">
          <span>
            <strong>Lifecycle</strong>
            {snapshot.monitor.lifecycleLabel}
          </span>
          <span>
            <strong>Last evidence</strong>
            {snapshot.monitor.lastEvidenceSource}
          </span>
          <span>
            <strong>Next action</strong>
            {snapshot.nextMove.action}
          </span>
        </div>
      </article>

      <div className="reports-grid">
        {snapshot.reports.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No run or report artifacts found.</p>
          </article>
        ) : (
          snapshot.reports.map((report) => (
            <article className="dashboard-card" key={report.id}>
              <div className="card-heading">
                <span className="card-icon card-icon--green">
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="eyebrow">{report.kind}</p>
                  <h2>{report.title}</h2>
                </div>
              </div>
              <p className="card-copy">{report.excerpt}</p>
              <div className="meta-grid meta-grid--two">
                <span>
                  <strong>Generated</strong>
                  {new Date(report.generatedAt).toLocaleString()}
                </span>
                <span>
                  <strong>Source</strong>
                  {report.artifactPath ?? 'snapshot'}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      <article className="dashboard-card">
        <h3>Run evidence files</h3>
        <ul className="run-file-list">
          {runFiles.map((entry) => (
            <li key={entry.id} data-status={entry.status}>
              <strong>{entry.name}</strong>
              <span>{entry.purpose}</span>
              <code>{entry.sourcePath}</code>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}
