import { Eye, EyeOff, KeyRound, Plus, RefreshCw, Settings, ShieldCheck, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCompassData } from '../../hooks/useCompassData'
import type {
  AgentPermission,
  AgentProfile,
  AgentProviderCredential,
  AgentProviderId,
} from '../../types/snapshot'
import {
  agentPermissionLabels,
  agentProviderDefinitions,
  evaluateAgentCredential,
  getAgentCredentialStatus,
  normalizeAgentProfiles,
  normalizeAgentProviders,
} from '../../utils/agentSettings'

function formatStatus(status: AgentProviderCredential['status']): string {
  if (status === 'stored_local') return 'Stored locally'
  if (status === 'format_warning') return 'Check format'
  if (status === 'checked_local') return 'Local endpoint ready'
  return 'Not configured'
}

function createProfile(existingCount: number): AgentProfile {
  return {
    id: `profile-custom-${Date.now()}`,
    name: `Agent Profile ${existingCount + 1}`,
    providerId: 'openai',
    model: 'provider-default',
    role: 'project_assistant',
    purpose: 'Explain project monitor evidence and draft a safe next prompt.',
    permissions: ['explain_status', 'summarize_evidence', 'draft_prompts'],
    enabled: true,
  }
}

export function SettingsPage() {
  const { snapshot, selected, registry, refresh, selectProject, updateSettings, loading } =
    useCompassData()
  const settings = snapshot?.settings
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({})
  const [credentialMessage, setCredentialMessage] = useState<string | null>(null)

  const providers = useMemo(
    () => (settings ? normalizeAgentProviders(settings) : []),
    [settings],
  )
  const profiles = useMemo(
    () => (settings ? normalizeAgentProfiles(settings) : []),
    [settings],
  )

  const saveProviders = async (nextProviders: AgentProviderCredential[]) => {
    const openAiApiKey = nextProviders.find((provider) => provider.id === 'openai')?.token
    const claudeApiKey = nextProviders.find((provider) => provider.id === 'claude')?.token
    await updateSettings({
      agentProviders: nextProviders,
      openAiApiKey: openAiApiKey || undefined,
      claudeApiKey: claudeApiKey || undefined,
      tokenVaultMode: 'browser_local',
    })
  }

  const updateProvider = (
    providerId: AgentProviderId,
    patch: Partial<AgentProviderCredential>,
  ) => {
    const nextProviders = providers.map((provider) => {
      if (provider.id !== providerId) return provider
      const nextProvider = { ...provider, ...patch, lastCheckedAt: undefined }
      return { ...nextProvider, status: getAgentCredentialStatus(nextProvider) }
    })
    setCredentialMessage(null)
    void saveProviders(nextProviders)
  }

  const checkProvider = (providerId: AgentProviderId) => {
    const nextProviders = providers.map((provider) =>
      provider.id === providerId ? evaluateAgentCredential(provider) : provider,
    )
    const checked = nextProviders.find((provider) => provider.id === providerId)
    if (checked) {
      setCredentialMessage(
        `${checked.label}: ${formatStatus(checked.status)}. This is a local readiness check only.`,
      )
    }
    void saveProviders(nextProviders)
  }

  const clearProvider = (providerId: AgentProviderId) => {
    const nextProviders = providers.map((provider) =>
      provider.id === providerId
        ? {
            ...provider,
            token: undefined,
            status: 'not_configured' as const,
            lastCheckedAt: undefined,
          }
        : provider,
    )
    setVisibleTokens((current) => ({ ...current, [providerId]: false }))
    setCredentialMessage('Token cleared from local Compass settings.')
    void saveProviders(nextProviders)
  }

  const saveProfiles = (nextProfiles: AgentProfile[]) => {
    void updateSettings({ agentProfiles: nextProfiles })
  }

  const updateProfile = (profileId: string, patch: Partial<AgentProfile>) => {
    saveProfiles(
      profiles.map((profile) => (profile.id === profileId ? { ...profile, ...patch } : profile)),
    )
  }

  const togglePermission = (
    profile: AgentProfile,
    permission: AgentPermission,
    checked: boolean,
  ) => {
    const permissions = checked
      ? [...new Set([...profile.permissions, permission])]
      : profile.permissions.filter((item) => item !== permission)
    updateProfile(profile.id, { permissions })
  }

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

      {settings ? (
        <article className="dashboard-card dashboard-card--wide">
          <div className="card-heading">
            <span className="card-icon card-icon--amber">
              <KeyRound size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Agent Tokens</p>
              <h3>Local provider credentials</h3>
            </div>
          </div>
          <p className="card-copy">
            Tokens are stored in this browser's IndexedDB for the selected project. They are not
            written to repo files, not synced by Compass, and not used unless a user-triggered
            action needs them.
          </p>
          <div className="agent-token-grid">
            {providers.map((provider) => {
              const definition = agentProviderDefinitions.find((item) => item.id === provider.id)
              const visible = visibleTokens[provider.id] ?? false
              return (
                <section className="agent-provider-card" key={provider.id}>
                  <div className="agent-provider-card__head">
                    <div>
                      <strong>{provider.label}</strong>
                      <span>{definition?.purpose}</span>
                    </div>
                    <span data-status={provider.status}>{formatStatus(provider.status)}</span>
                  </div>
                  <label className="settings-field">
                    <strong>{definition?.tokenLabel ?? 'Provider token'}</strong>
                    <div className="token-input-row">
                      <input
                        type={visible ? 'text' : 'password'}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={definition?.placeholder ?? 'provider token'}
                        value={provider.token ?? ''}
                        onChange={(event) =>
                          updateProvider(provider.id, {
                            token: event.target.value || undefined,
                          })
                        }
                      />
                      <button
                        aria-label={visible ? `Hide ${provider.label} token` : `Reveal ${provider.label} token`}
                        title={visible ? 'Hide token' : 'Reveal token'}
                        type="button"
                        onClick={() =>
                          setVisibleTokens((current) => ({
                            ...current,
                            [provider.id]: !visible,
                          }))
                        }
                      >
                        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                  {(provider.id === 'local' || provider.id === 'custom') && (
                    <label className="settings-field">
                      <strong>Endpoint</strong>
                      <input
                        type="url"
                        placeholder="http://127.0.0.1:11434"
                        value={provider.endpoint ?? ''}
                        onChange={(event) =>
                          updateProvider(provider.id, {
                            endpoint: event.target.value || undefined,
                          })
                        }
                      />
                    </label>
                  )}
                  <label className="settings-field">
                    <strong>Model hint</strong>
                    <input
                      type="text"
                      spellCheck={false}
                      value={provider.modelHint ?? ''}
                      onChange={(event) =>
                        updateProvider(provider.id, {
                          modelHint: event.target.value || undefined,
                        })
                      }
                    />
                  </label>
                  <div className="agent-provider-card__actions">
                    <button type="button" onClick={() => checkProvider(provider.id)}>
                      <ShieldCheck size={14} aria-hidden="true" /> Check
                    </button>
                    <button type="button" onClick={() => clearProvider(provider.id)}>
                      <Trash2 size={14} aria-hidden="true" /> Clear
                    </button>
                  </div>
                  {provider.lastCheckedAt ? (
                    <small>
                      Last checked {new Date(provider.lastCheckedAt).toLocaleString()}
                    </small>
                  ) : null}
                </section>
              )
            })}
          </div>
          {credentialMessage ? (
            <p className="settings-message" role="status">
              {credentialMessage}
            </p>
          ) : null}
        </article>
      ) : null}

      {settings ? (
        <article className="dashboard-card dashboard-card--wide">
          <div className="card-heading">
            <span className="card-icon card-icon--blue">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Agent Profiles</p>
              <h3>Design how agents are used</h3>
            </div>
          </div>
          <p className="card-copy">
            Profiles describe which provider, model, role, and bounded permissions Compass should
            use for future AI-assisted explanations or prompt drafting. They do not grant repo
            edit or command execution rights.
          </p>
          <div className="agent-profile-list">
            {profiles.map((profile) => (
              <section className="agent-profile-card" key={profile.id}>
                <div className="agent-profile-card__top">
                  <label className="settings-field">
                    <strong>Name</strong>
                    <input
                      value={profile.name}
                      onChange={(event) => updateProfile(profile.id, { name: event.target.value })}
                    />
                  </label>
                  <label className="settings-field">
                    <strong>Provider</strong>
                    <select
                      value={profile.providerId}
                      onChange={(event) =>
                        updateProfile(profile.id, {
                          providerId: event.target.value as AgentProviderId,
                        })
                      }
                    >
                      {agentProviderDefinitions.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="settings-field">
                    <strong>Model</strong>
                    <input
                      spellCheck={false}
                      value={profile.model}
                      onChange={(event) =>
                        updateProfile(profile.id, { model: event.target.value })
                      }
                    />
                  </label>
                  <label className="settings-field settings-field--inline">
                    <input
                      checked={profile.enabled}
                      type="checkbox"
                      onChange={(event) =>
                        updateProfile(profile.id, { enabled: event.target.checked })
                      }
                    />
                    <strong>Enabled</strong>
                  </label>
                </div>
                <div className="agent-profile-card__body">
                  <label className="settings-field">
                    <strong>Role</strong>
                    <input
                      spellCheck={false}
                      value={profile.role}
                      onChange={(event) => updateProfile(profile.id, { role: event.target.value })}
                    />
                  </label>
                  <label className="settings-field">
                    <strong>Purpose</strong>
                    <textarea
                      rows={3}
                      value={profile.purpose}
                      onChange={(event) =>
                        updateProfile(profile.id, { purpose: event.target.value })
                      }
                    />
                  </label>
                </div>
                <fieldset className="permission-grid">
                  <legend>Allowed monitor actions</legend>
                  {(Object.keys(agentPermissionLabels) as AgentPermission[]).map((permission) => (
                    <label key={permission}>
                      <input
                        checked={profile.permissions.includes(permission)}
                        type="checkbox"
                        onChange={(event) =>
                          togglePermission(profile, permission, event.target.checked)
                        }
                      />
                      <span>{agentPermissionLabels[permission]}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="agent-profile-card__actions">
                  <button
                    type="button"
                    onClick={() => saveProfiles(profiles.filter((item) => item.id !== profile.id))}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Remove profile
                  </button>
                </div>
              </section>
            ))}
          </div>
          <button
            className="scope-link-btn settings-add-profile"
            type="button"
            onClick={() => saveProfiles([...profiles, createProfile(profiles.length)])}
          >
            <Plus size={14} aria-hidden="true" /> Add profile
          </button>
        </article>
      ) : null}

      <article className="dashboard-card">
        <h3>Monitor rules</h3>
        <p className="card-copy">
          Command Center progress is evidence-backed. AI can explain or draft prompts, but it
          cannot mark work done.
        </p>
        <div className="meta-grid meta-grid--two">
          <span>
            <strong>Done rule</strong>
            Build done is not audit done
          </span>
          <span>
            <strong>Detach rule</strong>
            Active claims, failed audit, or changed files block detach
          </span>
          <span>
            <strong>Explorer</strong>
            User-clicked open/reveal only
          </span>
          <span>
            <strong>Safety</strong>
            Paths must stay inside selected project
          </span>
        </div>
      </article>

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
