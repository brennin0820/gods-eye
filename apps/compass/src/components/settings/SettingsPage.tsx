import { RefreshCw, Settings } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'

export function SettingsPage() {
  const { snapshot, selected, registry, refresh, selectProject, updateSettings, loading } =
    useCompassData()
  const settings = snapshot?.settings

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <Settings size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Settings</p>
            <h2 id="settings-title">Project registry & preferences</h2>
          </div>
        </div>
        <p className="card-copy">
          Compass reads live NightRaven files via the Vite dev API (
          <code>scripts/nightraven-projects.conf</code>, handoff, overlay). Edits persist in
          IndexedDB and survive refresh. Production static builds fall back to seed + local
          overrides until served with the API middleware.
        </p>
        <button
          className="scope-link-btn settings-refresh"
          disabled={loading}
          onClick={() => void refresh()}
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" /> Refresh from NightRaven
        </button>
      </article>

      {settings ? (
        <article className="dashboard-card">
          <h3>Preferences</h3>
          <div className="meta-grid meta-grid--two">
            <label className="settings-field">
              <strong>Data mode</strong>
              <select
                value={settings.dataMode}
                onChange={(event) =>
                  void updateSettings({
                    dataMode: event.target.value as typeof settings.dataMode,
                  })
                }
              >
                <option value="registry">Registry (live memory files)</option>
                <option value="local">Local seed + overrides</option>
                <option value="mock">Mock seed only</option>
              </select>
            </label>
            <label className="settings-field">
              <strong>Auto refresh</strong>
              <input
                checked={settings.autoRefresh}
                onChange={(event) => void updateSettings({ autoRefresh: event.target.checked })}
                type="checkbox"
              />
              <span className="settings-hint">
                Polls NightRaven files every 10s in registry mode; pauses when tab is hidden.
              </span>
            </label>
            <span>
              <strong>Phase badges</strong>
              {settings.showPhaseBadges ? 'Shown' : 'Hidden'}
            </span>
            <span>
              <strong>Root hint</strong>
              <code>{settings.projectRootHint}</code>
            </span>
          </div>
        </article>
      ) : null}

      <article className="dashboard-card">
        <h3>Selected project</h3>
        <div className="meta-grid">
          <span>
            <strong>Label</strong>
            {selected?.label ?? '—'}
          </span>
          <span>
            <strong>Path</strong>
            {selected?.path ?? '—'}
          </span>
          <span>
            <strong>Handoff</strong>
            {snapshot?.meta.handoffFound ? 'Found' : 'Missing'}
          </span>
          <span>
            <strong>Overlay</strong>
            {snapshot?.meta.overlayFound ? 'Found' : 'Missing'}
          </span>
          <span>
            <strong>Loaded</strong>
            {snapshot?.meta.loadedAt
              ? new Date(snapshot.meta.loadedAt).toLocaleString()
              : '—'}
          </span>
        </div>
      </article>

      <article className="dashboard-card settings-registry">
        <h3>Registry ({registry.length})</h3>
        <ul className="registry-list">
          {registry.map((entry) => (
            <li key={entry.path} data-available={entry.available}>
              <div className="registry-list__main">
                <strong>{entry.label}</strong>
                <span>{entry.role}</span>
                <code>{entry.path}</code>
              </div>
              {entry.available ? (
                <button
                  className="scope-link-btn"
                  disabled={selected?.path === entry.path}
                  onClick={() => selectProject(entry.path, entry.label)}
                  type="button"
                >
                  {selected?.path === entry.path ? 'Active' : 'Select'}
                </button>
              ) : (
                <span className="registry-unavailable">Path not found</span>
              )}
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}
