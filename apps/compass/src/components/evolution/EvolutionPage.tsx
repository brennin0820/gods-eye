import { GitBranch, ListChecks, ShieldAlert, Target } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import type { EvolutionTrackerItem } from '../../types/snapshot'

function priorityRank(priority: EvolutionTrackerItem['priority']): number {
  if (priority === 'P0') return 0
  if (priority === 'P1') return 1
  if (priority === 'P2') return 2
  return 3
}

function statusLabel(item: EvolutionTrackerItem): string {
  const status = item.currentStatus.toLowerCase()
  if (status.includes('complete') || item.type === 'production-ready') return 'Ready'
  if (status.includes('progress')) return 'In progress'
  return 'Open'
}

function isResolvedStatus(status: string): boolean {
  return status.toLowerCase().includes('resolved')
}

export function EvolutionPage() {
  const { snapshot } = useCompassData()

  if (!snapshot) return null

  const { evolution } = snapshot
  const sortedItems = [...evolution.mockupItems].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.name.localeCompare(b.name),
  )
  const openItems = sortedItems.filter((item) => statusLabel(item) !== 'Ready')
  const highFindings = evolution.integrityFindings.filter(
    (finding) =>
      (finding.severity === 'critical' || finding.severity === 'high') &&
      !isResolvedStatus(finding.status),
  )

  return (
    <section className="evolution-page" aria-labelledby="evolution-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <GitBranch size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Evolution loop</p>
            <h2 id="evolution-title">{evolution.currentVersion}</h2>
          </div>
        </div>
        <p className="card-copy">{evolution.goal}</p>
        <div className="meta-grid meta-grid--two">
          <span>
            <strong>Current stage</strong>
            {evolution.currentStage}
          </span>
          <span>
            <strong>Last tracked</strong>
            {new Date(evolution.lastUpdated).toLocaleString()}
          </span>
          <span>
            <strong>Open unfinished</strong>
            {openItems.length}
          </span>
          <span>
            <strong>High integrity findings</strong>
            {highFindings.length}
          </span>
        </div>
      </article>

      <div className="evolution-grid">
        <article className="dashboard-card">
          <div className="card-heading">
            <span className="card-icon card-icon--green">
              <Target size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Final form</p>
              <h3>Goal and done gate</h3>
            </div>
          </div>
          <p className="card-copy">{evolution.corePromise}</p>
          <h4>Required screens</h4>
          <ul className="evolution-list">
            {evolution.requiredScreens.map((screen) => (
              <li key={screen}>{screen}</li>
            ))}
          </ul>
          <h4>Definition of Done</h4>
          <ul className="evolution-list">
            {evolution.definitionOfDone.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="dashboard-card">
          <div className="card-heading">
            <span className="card-icon card-icon--amber">
              <ShieldAlert size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Integrity</p>
              <h3>Audit findings</h3>
            </div>
          </div>
          <div className="evolution-finding-list">
            {evolution.integrityFindings.length === 0 ? (
              <p className="card-copy">No integrity findings recorded.</p>
            ) : (
              evolution.integrityFindings.map((finding) => (
                <section
                  className="evolution-finding"
                  data-resolved={isResolvedStatus(finding.status)}
                  data-severity={finding.severity}
                  key={finding.id}
                >
                  <strong>{finding.title}</strong>
                  <span>{finding.area} · {finding.status}</span>
                  <p>{finding.requiredFix}</p>
                </section>
              ))
            )}
          </div>
        </article>
      </div>

      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--amber">
            <ListChecks size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Mockups and unfinished work</p>
            <h3>Tracked components and gaps</h3>
          </div>
        </div>
        <div className="evolution-table-wrap">
          <table className="evolution-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Status</th>
                <th>Missing</th>
                <th>Final form</th>
                <th>Checklist</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} data-priority={item.priority}>
                  <td>
                    <strong>{item.name}</strong>
                    <code>{item.filePath}</code>
                    <small>{item.priority} · {item.dependencies}</small>
                  </td>
                  <td>{item.type}</td>
                  <td>
                    <span className="file-status" data-status={statusLabel(item)}>
                      {statusLabel(item)}
                    </span>
                  </td>
                  <td>{item.missing}</td>
                  <td>{item.finalForm}</td>
                  <td>
                    <ul className="evolution-list evolution-list--compact">
                      {item.checklist.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="evolution-grid">
        <article className="dashboard-card">
          <h3>Next version</h3>
          <p className="card-copy">
            <strong>{evolution.nextVersionTarget}</strong>
          </p>
          <p className="card-copy">{evolution.upgradeThesis}</p>
          <div className="next-move-box">
            <strong>Delta gate</strong>
            <p>{evolution.versionDeltaGate}</p>
          </div>
        </article>

        <article className="dashboard-card">
          <h3>Tracking files</h3>
          <ul className="run-file-list">
            {evolution.trackingFiles.map((file) => (
              <li key={file.path} data-status={file.status}>
                <strong>{file.name}</strong>
                <span>{file.purpose}</span>
                <code>{file.path}</code>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
