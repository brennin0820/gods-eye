import type {
  AgentCredentialStatus,
  AgentPermission,
  AgentProfile,
  AgentProviderCredential,
  AgentProviderId,
  CompassSettingsProfile,
} from '../types/snapshot'

export type AgentProviderDefinition = {
  id: AgentProviderId
  label: string
  tokenLabel: string
  placeholder: string
  defaultModel: string
  purpose: string
  tokenOptional?: boolean
}

export const agentProviderDefinitions: AgentProviderDefinition[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    tokenLabel: 'OpenAI API token',
    placeholder: 'sk-...',
    defaultModel: 'provider-default',
    purpose: 'Explain monitor evidence and draft precise build prompts.',
  },
  {
    id: 'claude',
    label: 'Claude',
    tokenLabel: 'Claude API token',
    placeholder: 'sk-ant-...',
    defaultModel: 'provider-default',
    purpose: 'Review plans, summarize handoffs, and cross-check audit wording.',
  },
  {
    id: 'github',
    label: 'GitHub',
    tokenLabel: 'GitHub token',
    placeholder: 'github_pat_...',
    defaultModel: 'repository context',
    purpose: 'Read issue or pull request context when a future connector is enabled.',
  },
  {
    id: 'local',
    label: 'Local model',
    tokenLabel: 'Local token',
    placeholder: 'optional',
    defaultModel: 'local-default',
    purpose: 'Use a local endpoint for private summaries without cloud calls.',
    tokenOptional: true,
  },
  {
    id: 'custom',
    label: 'Custom endpoint',
    tokenLabel: 'Custom token',
    placeholder: 'provider token',
    defaultModel: 'custom-model',
    purpose: 'Configure another provider behind the same non-executing monitor boundary.',
    tokenOptional: true,
  },
]

export const agentPermissionLabels: Record<AgentPermission, string> = {
  explain_status: 'Explain status',
  summarize_evidence: 'Summarize evidence',
  draft_prompts: 'Draft prompts',
  read_project_files: 'Read project files',
  open_project_paths: 'Open project paths',
}

const defaultPermissions: AgentPermission[] = [
  'explain_status',
  'summarize_evidence',
  'draft_prompts',
]

export const defaultAgentProfiles: AgentProfile[] = [
  {
    id: 'profile-evidence-explainer',
    name: 'Evidence Explainer',
    providerId: 'openai',
    model: 'provider-default',
    role: 'status_explainer',
    purpose: 'Translate deterministic monitor evidence into plain next-step guidance.',
    permissions: defaultPermissions,
    enabled: true,
  },
  {
    id: 'profile-audit-reader',
    name: 'Audit Reader',
    providerId: 'claude',
    model: 'provider-default',
    role: 'audit_reviewer',
    purpose: 'Review audit evidence and draft a fix prompt without marking work done.',
    permissions: ['explain_status', 'summarize_evidence', 'draft_prompts'],
    enabled: false,
  },
]

function getDefinition(id: AgentProviderId): AgentProviderDefinition {
  return (
    agentProviderDefinitions.find((provider) => provider.id === id) ??
    agentProviderDefinitions[agentProviderDefinitions.length - 1]
  )
}

function inferStatus(
  providerId: AgentProviderId,
  token: string | undefined,
  endpoint: string | undefined,
): AgentCredentialStatus {
  const trimmed = token?.trim()
  const endpointReady = Boolean(endpoint?.trim())
  const definition = getDefinition(providerId)
  if (!trimmed && !(definition.tokenOptional && endpointReady)) return 'not_configured'
  if (!trimmed && definition.tokenOptional && endpointReady) return 'checked_local'

  if (providerId === 'openai' && !trimmed?.startsWith('sk-')) return 'format_warning'
  if (providerId === 'claude' && !trimmed?.startsWith('sk-ant-')) return 'format_warning'
  if (
    providerId === 'github' &&
    !trimmed?.startsWith('github_pat_') &&
    !trimmed?.startsWith('ghp_')
  ) {
    return 'format_warning'
  }

  return 'stored_local'
}

export function normalizeAgentProviders(
  settings: Partial<CompassSettingsProfile> | undefined,
): AgentProviderCredential[] {
  const existing = new Map((settings?.agentProviders ?? []).map((provider) => [provider.id, provider]))

  return agentProviderDefinitions.map((definition) => {
    const saved = existing.get(definition.id)
    const token =
      saved?.token ??
      (definition.id === 'openai'
        ? settings?.openAiApiKey
        : definition.id === 'claude'
          ? settings?.claudeApiKey
          : undefined)
    const endpoint = saved?.endpoint
    return {
      id: definition.id,
      label: saved?.label ?? definition.label,
      token,
      endpoint,
      modelHint: saved?.modelHint ?? definition.defaultModel,
      status: saved?.status ?? inferStatus(definition.id, token, endpoint),
      lastCheckedAt: saved?.lastCheckedAt,
    }
  })
}

export function normalizeAgentProfiles(
  settings: Partial<CompassSettingsProfile> | undefined,
): AgentProfile[] {
  const profiles = settings?.agentProfiles
  if (profiles && profiles.length > 0) return profiles
  return defaultAgentProfiles
}

export function evaluateAgentCredential(
  provider: AgentProviderCredential,
): AgentProviderCredential {
  return {
    ...provider,
    status: inferStatus(provider.id, provider.token, provider.endpoint),
    lastCheckedAt: new Date().toISOString(),
  }
}

export function getAgentCredentialStatus(
  provider: AgentProviderCredential,
): AgentCredentialStatus {
  return inferStatus(provider.id, provider.token, provider.endpoint)
}
