import { useMemo, useState } from 'react'
import { Copy, ExternalLink, FolderOpen, Info } from 'lucide-react'
import { openSystemPath } from '../../services/compassApi'
import type { FileCatalogEntry } from '../../types/snapshot'
import { useCompassData } from '../../hooks/useCompassData'

type FileCatalogPageProps = {
  changedOnly?: boolean
}

function parentPath(sourcePath: string): string {
  const parts = sourcePath.split('/')
  parts.pop()
  return parts.length > 0 ? parts.join('/') : '.'
}

function statusText(entry: FileCatalogEntry): string {
  if (entry.status === 'missing') return 'Missing'
  if (entry.precision.blocking) return 'Needs attention'
  if (entry.precision.changed === 'yes') return 'Changed'
  return 'Ready'
}

function sortEntries(entries: FileCatalogEntry[]): FileCatalogEntry[] {
  return [...entries].sort((a, b) => {
    if (a.precision.blocking !== b.precision.blocking) return a.precision.blocking ? -1 : 1
    if (a.precision.changed !== b.precision.changed) return a.precision.changed === 'yes' ? -1 : 1
    if (a.status !== b.status) return a.status === 'missing' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function FileCatalogPage({ changedOnly = false }: FileCatalogPageProps) {
  const { snapshot } = useCompassData()
  const [message, setMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const entries = useMemo(() => {
    if (!snapshot) return []
    const source = changedOnly ? snapshot.fileCatalog.filter((entry) => entry.precision.changed === 'yes') : snapshot.fileCatalog
    return sortEntries(source)
  }, [changedOnly, snapshot])

  if (!snapshot) return null

  async function revealEntry(entry: FileCatalogEntry) {
    if (!snapshot) return
    setMessage(null)
    try {
      await openSystemPath({
        projectPath: snapshot.meta.projectPath,
        targetPath: entry.sourcePath,
        mode: entry.type === 'folder' ? 'open' : 'reveal',
      })
      setMessage(`Opened ${entry.name}.`)
    } catch (error) {
      setMessage(String(error))
    }
  }

  async function openParent(entry: FileCatalogEntry) {
    if (!snapshot) return
    setMessage(null)
    try {
      await openSystemPath({
        projectPath: snapshot.meta.projectPath,
        targetPath: entry.type === 'folder' ? entry.sourcePath : parentPath(entry.sourcePath),
        mode: 'open',
      })
      setMessage(`Opened parent for ${entry.name}.`)
    } catch (error) {
      setMessage(String(error))
    }
  }

  async function copyPath(entry: FileCatalogEntry) {
    await navigator.clipboard.writeText(entry.absolutePath)
    setMessage(`Copied path for ${entry.name}.`)
  }

  return (
    <section className="files-page" aria-labelledby={changedOnly ? 'changed-files-title' : 'files-title'}>
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <FolderOpen size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">{changedOnly ? 'What changed' : 'Project explorer'}</p>
            <h2 id={changedOnly ? 'changed-files-title' : 'files-title'}>
              {changedOnly ? 'Changed files with evidence' : 'Friendly file and folder map'}
            </h2>
          </div>
        </div>
        <p className="card-copy">
          Friendly names appear first. Real source paths remain visible so monitor claims always trace
          back to repo evidence.
        </p>
        {message ? <p className="files-page__message">{message}</p> : null}
      </article>

      <div className="file-table-card dashboard-card">
        <div className="file-table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Precision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5}>No {changedOnly ? 'changed' : 'catalog'} files found.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} data-blocking={entry.precision.blocking}>
                    <td>
                      <strong>{entry.name}</strong>
                      <code>{entry.sourcePath}</code>
                      <span>{entry.type} · {entry.monitorRole}</span>
                    </td>
                    <td>{entry.purpose}</td>
                    <td>
                      <span className="file-status" data-status={statusText(entry)}>
                        {statusText(entry)}
                      </span>
                      <small>{entry.lastUpdated ? new Date(entry.lastUpdated).toLocaleString() : 'No timestamp'}</small>
                    </td>
                    <td>
                      <ul className="file-precision-list">
                        <li>Changed: {entry.precision.changed}</li>
                        <li>Expected: {entry.precision.expected}</li>
                        <li>Claim: {entry.precision.claim}</li>
                        <li>Build: {entry.precision.build}</li>
                        <li>Audit: {entry.precision.audit}</li>
                      </ul>
                    </td>
                    <td>
                      <div className="file-actions">
                        <button type="button" onClick={() => void revealEntry(entry)} disabled={entry.status === 'missing'}>
                          <ExternalLink size={14} aria-hidden="true" />
                          Reveal
                        </button>
                        <button type="button" onClick={() => void openParent(entry)} disabled={entry.status === 'missing'}>
                          <FolderOpen size={14} aria-hidden="true" />
                          Parent
                        </button>
                        <button type="button" onClick={() => void copyPath(entry)}>
                          <Copy size={14} aria-hidden="true" />
                          Path
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        >
                          <Info size={14} aria-hidden="true" />
                          Info
                        </button>
                      </div>
                      {expandedId === entry.id ? (
                        <div className="file-info-panel">
                          <strong>Next action</strong>
                          <p>{entry.precision.nextAction}</p>
                          <strong>Evidence</strong>
                          <ul>
                            {entry.precision.evidence.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                          <strong>Required for</strong>
                          <p>{entry.requiredFor.join(', ') || 'optional'}</p>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export function ChangedFilesPage() {
  return <FileCatalogPage changedOnly />
}
