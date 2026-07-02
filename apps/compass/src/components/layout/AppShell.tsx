import type { ReactNode } from 'react'
import { useCompassData } from '../../hooks/useCompassData'
import { Sidebar } from './Sidebar'
import { navItems, type NavItemId } from './navigation'

type AppShellProps = {
  activeView: NavItemId
  children: ReactNode
  onViewChange: (view: NavItemId) => void
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'just now'
  const deltaMs = Date.now() - new Date(iso).getTime()
  if (deltaMs < 15_000) return 'just now'
  if (deltaMs < 60_000) return `${Math.round(deltaMs / 1000)}s ago`
  if (deltaMs < 3_600_000) return `${Math.round(deltaMs / 60_000)}m ago`
  return new Date(iso).toLocaleTimeString()
}

export function AppShell({ activeView, children, onViewChange }: AppShellProps) {
  const { snapshot, loading, error, selected, refreshStatus } = useCompassData()
  const activeItem = navItems.find((item) => item.id === activeView) ?? navItems[0]
  const dataMode = snapshot?.settings.dataMode ?? 'local'
  const autoRefresh = snapshot?.settings.autoRefresh ?? true
  const modeLabel =
    dataMode === 'registry'
      ? "NightRaven registry"
      : dataMode === 'local'
        ? 'Local + IndexedDB'
        : 'Seed data'

  const liveWatching =
    autoRefresh && dataMode === 'registry' && refreshStatus.state === 'watching'
  const liveUpdated = refreshStatus.state === 'updated'
  const liveRefreshing = refreshStatus.state === 'refreshing'

  let statusBanner: ReactNode = null
  if (loading) {
    statusBanner = (
      <div className="compass-status compass-status--loading" role="status">
        Loading project snapshot…
      </div>
    )
  } else if (error) {
    statusBanner = (
      <div className="compass-status compass-status--error" role="alert">
        {error}
      </div>
    )
  } else if (liveUpdated) {
    statusBanner = (
      <div className="compass-status compass-status--updated" role="status">
        NightRaven memory changed — snapshot refreshed{' '}
        {formatRelativeTime(refreshStatus.lastRefreshedAt)}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="eyebrow">NightRaven Compass</p>
            <h1>{activeItem.label}</h1>
            {selected ? (
              <p className="header-project">
                {selected.label} · <code>{selected.path}</code>
              </p>
            ) : null}
          </div>
          <div className="header-status" aria-label="Data source status">
            <span className="header-badge" data-mode={dataMode}>
              {modeLabel}
            </span>
            {liveWatching || liveUpdated || liveRefreshing ? (
              <span
                className="header-badge header-badge--live"
                data-live-state={liveUpdated ? 'updated' : liveRefreshing ? 'refreshing' : 'watching'}
                title={
                  liveUpdated
                    ? `Refreshed ${formatRelativeTime(refreshStatus.lastRefreshedAt)}`
                    : liveRefreshing
                      ? 'Refreshing from disk…'
                      : 'Watching NightRaven files for changes'
                }
              >
                {liveUpdated ? 'Updated' : liveRefreshing ? 'Refreshing…' : 'Live'}
              </span>
            ) : null}
            <span>IndexedDB persistence</span>
            <span>{snapshot?.meta.handoffFound ? 'Handoff live' : 'No handoff file'}</span>
          </div>
        </header>
        {statusBanner}
        {children}
      </main>
    </div>
  )
}
